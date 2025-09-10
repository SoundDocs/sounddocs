/*
      # Enhance Run of Shows for Sharing and Live Data

      This migration introduces capabilities for sharing run of shows and supporting live data updates for shared views.

      1. Table Modifications
        - `run_of_shows` table:
          - Added `live_show_data` (JSONB, nullable): This column will store real-time status information for a run of show when it's in "Show Mode", such as the current item index, timer status, and remaining time. This data will be used by shared view-only pages to reflect live updates.

      2. New Functions
        - `get_public_run_of_show_by_share_code(p_share_code TEXT)`:
          - A PL/pgSQL function designed to be called by anonymous or authenticated users to retrieve data for a shared run of show.
          - It takes a `share_code` as input.
          - Verifies the `shared_links` entry: checks if the link exists, is for a 'run_of_show', is a 'view' link, and is not expired.
          - Fetches the corresponding `run_of_shows` data.
          - **Crucially, it sanitizes the `items` array by removing the `privateNotes` field from each item, ensuring private information is not exposed on shared links.**
          - Returns the run of show details including the sanitized items and the `live_show_data`.
          - Increments the `access_count` and updates `last_accessed` on the `shared_links` table.
          - This function uses `SECURITY DEFINER` to allow necessary table access while being callable by less privileged roles (like `anon`).

      3. Security
        - The new RPC function `get_public_run_of_show_by_share_code` is granted execute permission to the `anon` and `authenticated` roles. This allows unauthenticated users to view shared run of shows if they have a valid link.

      Important Notes:
      - The `live_show_data` column will be updated by the main "Show Mode" page to publish its state.
      - The `get_public_run_of_show_by_share_code` function is central to securely providing data for shared views.
    */

    -- Add live_show_data column to run_of_shows table
DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'run_of_shows' AND column_name = 'live_show_data'
      ) THEN
        ALTER TABLE public.run_of_shows ADD COLUMN live_show_data JSONB NULL;
      END IF;
    END $$;

-- Create or replace the function to get public run of show data by share code
CREATE OR REPLACE FUNCTION get_public_run_of_show_by_share_code(p_share_code TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    items JSONB, -- Sanitized items
    custom_column_definitions JSONB,
    created_at TIMESTAMPTZ,
    last_edited TIMESTAMPTZ,
    live_show_data JSONB,
    resource_id TEXT, -- from shared_links, for client-side reference
    resource_type TEXT, -- from shared_links
    link_id UUID -- id of the shared_links entry
)
SECURITY DEFINER
SET search_path = public -- Ensure the function operates in the public schema context
AS $$
    DECLARE
      v_link RECORD;
      v_run_of_show RECORD;
      sanitized_items JSONB;
      item JSONB;
    BEGIN
      -- Verify the share link
      SELECT sl.id as sl_id, sl.resource_id as sl_resource_id, sl.resource_type as sl_resource_type, sl.link_type, sl.expires_at
      INTO v_link
      FROM public.shared_links sl
      WHERE sl.share_code = p_share_code;

      IF v_link IS NULL THEN
        RAISE EXCEPTION 'SHARE_LINK_NOT_FOUND';
      END IF;

      IF v_link.link_type != 'view' THEN
        RAISE EXCEPTION 'LINK_NOT_FOR_VIEWING';
      END IF;

      IF v_link.sl_resource_type != 'run_of_show' THEN
        RAISE EXCEPTION 'LINK_NOT_FOR_RUN_OF_SHOW';
      END IF;

      IF v_link.expires_at IS NOT NULL AND v_link.expires_at < now() THEN
        RAISE EXCEPTION 'SHARE_LINK_EXPIRED';
      END IF;

      -- Fetch the run of show data
      SELECT ros.* INTO v_run_of_show
      FROM public.run_of_shows ros
      WHERE ros.id = v_link.sl_resource_id::uuid;

      IF v_run_of_show IS NULL THEN
        RAISE EXCEPTION 'RUN_OF_SHOW_NOT_FOUND';
      END IF;

      -- Sanitize items: remove privateNotes
      sanitized_items := '[]'::jsonb;
      IF jsonb_typeof(v_run_of_show.items) = 'array' THEN
        FOR item IN SELECT * FROM jsonb_array_elements(v_run_of_show.items)
        LOOP
          IF jsonb_typeof(item) = 'object' THEN
            sanitized_items := sanitized_items || (item - 'privateNotes');
          ELSE
            sanitized_items := sanitized_items || item; -- Keep non-object items (e.g. headers if stored differently)
          END IF;
        END LOOP;
      END IF;


      -- Increment access count and update last_accessed
      -- This is done here to ensure it happens only on successful verification and data fetch.
      UPDATE public.shared_links
      SET
        last_accessed = now(),
        access_count = public.shared_links.access_count + 1
      WHERE public.shared_links.id = v_link.sl_id;

      RETURN QUERY SELECT
        v_run_of_show.id,
        v_run_of_show.name,
        sanitized_items,
        v_run_of_show.custom_column_definitions,
        v_run_of_show.created_at,
        v_run_of_show.last_edited,
        v_run_of_show.live_show_data,
        v_link.sl_resource_id::TEXT,
        v_link.sl_resource_type::TEXT,
        v_link.sl_id; -- return the shared_links.id as link_id
    END;
    $$ LANGUAGE plpgsql;

-- Grant execute permission on the function to relevant roles
GRANT EXECUTE ON FUNCTION get_public_run_of_show_by_share_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_public_run_of_show_by_share_code(TEXT) TO authenticated;
