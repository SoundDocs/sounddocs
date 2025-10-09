-- Migration: Fix update_shared_resource RETURNING clause
-- Problem: to_jsonb() in RETURNING clause is serializing the row and potentially transforming JSONB columns
-- Solution: Return the row as a record type, then convert to JSONB using row_to_json()

CREATE OR REPLACE FUNCTION update_shared_resource(
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
  v_row_result record;
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

  v_resource_id := v_link.resource_id;

  -- Update the last_accessed timestamp on the shared link
  UPDATE shared_links
  SET last_accessed = NOW()
  WHERE id = v_link.id;

  -- Build SET clause from jsonb keys and values
  -- Use -> for JSONB columns (preserves structure), ->> for other types
  FOR v_key IN SELECT jsonb_object_keys(p_updates)
  LOOP
    -- Check if this column is JSONB type
    v_is_jsonb := is_jsonb_column(p_table_name, v_key);
    v_column_type := pg_typeof_column(p_table_name, v_key);

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

  -- Execute the dynamic UPDATE and get the row as a record
  -- CRITICAL: We use row_to_json() instead of to_jsonb() to preserve JSONB column types
  -- row_to_json() keeps JSONB columns as-is, while to_jsonb() re-serializes them
  EXECUTE format(
    'UPDATE %I SET %s WHERE id = $2 RETURNING row_to_json(%I.*)::jsonb',
    p_table_name,
    v_set_clause,
    p_table_name
  )
  INTO v_result
  USING p_updates, v_resource_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Resource not found or update failed';
  END IF;

  RETURN v_result;
END;
$$;

-- Update comment
COMMENT ON FUNCTION update_shared_resource IS 'Updates a shared resource by share code, bypassing RLS. Uses row_to_json() in RETURNING to preserve JSONB column types.';
