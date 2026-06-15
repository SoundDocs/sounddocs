-- ============================================================================
-- Migration: Harden public.update_shared_resource (SELF-HOST ONLY)
-- ============================================================================
--
-- WHAT THIS IS
--   This is a SELF-HOST-ONLY security hardening of the SECURITY DEFINER RPC
--   public.update_shared_resource(text, text, text, jsonb). It auto-applies on
--   fresh self-hosted databases AFTER the migrations that define and GRANT the
--   function (20251008180000_add_update_shared_resource_rpc.sql and
--   20251008210000_fix_update_shared_resource_returning.sql).
--
--   It is intentionally a CREATE OR REPLACE (idempotent, non-destructive):
--     * The same signature (text, text, text, jsonb) and RETURNS jsonb.
--     * SECURITY DEFINER + `SET search_path = public` are preserved.
--     * The successful-edit path and the row_to_json(...)::jsonb RETURNING
--       behavior are preserved EXACTLY for allowed tables/columns, so
--       legitimate shared-link editing keeps working unchanged.
--   Because it does not drop the function, existing GRANTs are preserved; the
--   GRANTs are nonetheless re-stated at the bottom to be safe and idempotent.
--
--   NOTE: This migration is NOT applied to the production hosted database
--   (owner lost access; that instance retires 2026-09-01). It exists so that
--   self-hosted deployments are not exposed to the vulnerabilities below.
--
-- VULNERABILITIES CLOSED
--   The function is granted to `anon` and `authenticated` and runs as its owner
--   (SECURITY DEFINER, bypassing RLS). The original implementation trusted two
--   pieces of client-supplied input, both of which are exploitable:
--
--   (1) Arbitrary table write via p_table_name.
--       The function executed `UPDATE <p_table_name> ...` using the raw,
--       client-supplied table name. Anyone with (or guessing) a valid edit
--       share code could coerce the function into writing to ANY table the
--       function owner can write to.
--       FIX: Ignore p_table_name as a source of truth. Derive the allowed
--       table SERVER-SIDE from v_link.resource_type via a fixed allowlist
--       mapping, and REQUIRE that the client-supplied p_table_name matches the
--       allowed table (else RAISE EXCEPTION). The dynamic UPDATE only ever
--       targets the server-derived table.
--
--   (2) Privileged-column overwrite via p_updates keys.
--       The SET clause was built from EVERY key in p_updates, so a shared
--       editor could set privileged columns such as user_id (ownership
--       hijack), id, created_at, share_code, etc.
--       FIX: Inside the key loop, SKIP a denylist of privileged/identity
--       columns. We SKIP (rather than RAISE) so that legitimate payloads that
--       happen to echo back fields like `id`, `created_at`, `updated_at`, or
--       `version` (the app frequently round-trips full row objects) still
--       succeed for the remaining editable columns instead of failing the
--       whole save. Denied keys are simply never written.
--
-- ALLOWLIST DERIVATION (resource_type -> table)
--   The 7 pairs below are the canonical, mutually-confirmed set, derived from:
--     * The latest shared_links_resource_type_check CHECK constraint
--       (supabase/migrations/20250930110000_add_technical_riders_to_shared_links.sql),
--       which is the authoritative server-side enumeration of every value that
--       shared_links.resource_type (and therefore v_link.resource_type) can hold.
--     * The ResourceType union and the updateSharedResource()/getSharedResource()
--       resource_type -> table switches in apps/web/src/lib/shareUtils.ts.
--     * The mapDocumentTypeToResourceType() mapping in apps/web/src/lib/autoSave.ts.
--   All three sources agree exactly on these 7 pairs. (The strings 'pixel_map'
--   and 'comms_planner' appear elsewhere in the app/db for the document-locks /
--   pending-saves collaboration feature, but they are NOT permitted values of
--   shared_links.resource_type, so they can never legitimately reach this RPC
--   and are intentionally excluded from the allowlist.)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_shared_resource(
  p_share_code text,
  p_resource_type text,
  p_table_name text,
  p_updates jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link shared_links;
  v_resource_id uuid;
  v_result jsonb;
  v_key text;
  v_set_clause text := '';
  v_first boolean := true;
  v_is_jsonb boolean;
  v_column_type text;
  v_allowed_table text;
  v_column_exists boolean;
BEGIN
  -- Verify the share link exists and has edit permissions
  SELECT * INTO v_link
  FROM shared_links
  WHERE share_code = p_share_code
    AND link_type = 'edit'
    AND resource_type = p_resource_type
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_link IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired share code';
  END IF;

  -- ----------------------------------------------------------------------
  -- GUARD 1: Derive the allowed table SERVER-SIDE from the share link's
  -- resource_type. Never trust p_table_name as the write target. Require the
  -- client-supplied p_table_name to match the server-derived table.
  -- ----------------------------------------------------------------------
  v_allowed_table := CASE v_link.resource_type
    WHEN 'patch_sheet'         THEN 'patch_sheets'
    WHEN 'stage_plot'          THEN 'stage_plots'
    WHEN 'production_schedule'  THEN 'production_schedules'
    WHEN 'run_of_show'         THEN 'run_of_shows'
    WHEN 'corporate_mic_plot'  THEN 'corporate_mic_plots'
    WHEN 'theater_mic_plot'    THEN 'theater_mic_plots'
    WHEN 'technical_rider'     THEN 'technical_riders'
    ELSE NULL
  END;

  IF v_allowed_table IS NULL THEN
    RAISE EXCEPTION 'Unsupported resource type for shared update: %', v_link.resource_type;
  END IF;

  IF p_table_name IS DISTINCT FROM v_allowed_table THEN
    RAISE EXCEPTION 'Table name does not match share link resource type';
  END IF;

  v_resource_id := v_link.resource_id;

  -- Update the last_accessed timestamp on the shared link
  UPDATE shared_links
  SET last_accessed = NOW()
  WHERE id = v_link.id;

  -- ----------------------------------------------------------------------
  -- Build SET clause from jsonb keys and values.
  -- GUARD 2: SKIP privileged / identity columns so a shared editor can never
  -- overwrite ownership or identity fields. Skipping (vs. raising) preserves
  -- legitimate edits that round-trip these fields in their payload.
  -- Use -> for JSONB columns (preserves structure), ->> for other types.
  -- ----------------------------------------------------------------------
  FOR v_key IN SELECT jsonb_object_keys(p_updates)
  LOOP
    -- Privileged-column denylist (case-insensitive). Never writable here.
    CONTINUE WHEN lower(v_key) IN (
      'id',
      'user_id',
      'created_at',
      'updated_at',
      'last_edited',   -- managed below by the function itself
      'last_accessed',
      'share_code',
      'version'
    );

    -- Only act on columns that actually exist on the server-derived table.
    -- The is_jsonb_column()/pg_typeof_column() helpers RAISE on unknown columns,
    -- which would abort the whole save; so check existence first and SKIP any
    -- stray key (preserves legitimate edits that include extra/unknown fields).
    SELECT EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = v_allowed_table::regclass
        AND attname = v_key
        AND attnum > 0
        AND NOT attisdropped
    ) INTO v_column_exists;

    IF NOT v_column_exists THEN
      CONTINUE;
    END IF;

    v_is_jsonb := is_jsonb_column(v_allowed_table, v_key);
    v_column_type := pg_typeof_column(v_allowed_table, v_key);

    IF v_first THEN
      IF v_is_jsonb THEN
        -- Use -> for JSONB columns to preserve structure
        v_set_clause := format('%I = ($1->%L)::%s', v_key, v_key, v_column_type);
      ELSE
        -- Use ->> for non-JSONB columns to extract as text
        v_set_clause := format('%I = ($1->>%L)::%s', v_key, v_key, v_column_type);
      END IF;
      v_first := false;
    ELSE
      IF v_is_jsonb THEN
        v_set_clause := v_set_clause || format(', %I = ($1->%L)::%s', v_key, v_key, v_column_type);
      ELSE
        v_set_clause := v_set_clause || format(', %I = ($1->>%L)::%s', v_key, v_key, v_column_type);
      END IF;
    END IF;
  END LOOP;

  -- Add last_edited to SET clause
  IF v_set_clause != '' THEN
    v_set_clause := v_set_clause || ', last_edited = NOW()';
  ELSE
    v_set_clause := 'last_edited = NOW()';
  END IF;

  -- Execute the dynamic UPDATE and get the row as a record.
  -- The target table is the SERVER-DERIVED v_allowed_table (never the raw
  -- client input). CRITICAL: we use row_to_json() instead of to_jsonb() to
  -- preserve JSONB column types (kept identical to the prior behavior).
  EXECUTE format(
    'UPDATE %I SET %s WHERE id = $2 RETURNING row_to_json(%I.*)::jsonb',
    v_allowed_table,
    v_set_clause,
    v_allowed_table
  )
  INTO v_result
  USING p_updates, v_resource_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Resource not found or update failed';
  END IF;

  RETURN v_result;
END;
$$;

-- Re-state grants to match the original (idempotent; CREATE OR REPLACE keeps
-- existing grants, but this guarantees anon/authenticated execute remains).
GRANT EXECUTE ON FUNCTION public.update_shared_resource(text, text, text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.update_shared_resource(text, text, text, jsonb) TO authenticated;

COMMENT ON FUNCTION public.update_shared_resource IS
  'Updates a shared resource by share code, bypassing RLS for valid edit links. '
  'Self-host security-hardened: the target table is derived server-side from the '
  'share link resource_type (client p_table_name must match an allowlisted table), '
  'and privileged/identity columns (id, user_id, created_at, updated_at, share_code, '
  'version, etc.) are skipped from the update. Uses row_to_json() in RETURNING to '
  'preserve JSONB column types.';
