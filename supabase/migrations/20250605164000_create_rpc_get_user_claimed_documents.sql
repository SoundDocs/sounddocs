/*
      # Create RPC get_user_claimed_documents

      This migration creates a PostgreSQL function `get_user_claimed_documents`
      that retrieves a list of all documents a user has claimed via the
      `user_claimed_shares` table. It joins with `shared_links` and
      the respective resource tables (patch_sheets, stage_plots, run_of_shows,
      production_schedules) to fetch details like the resource name and type.

      1.  **New RPC Function**: `get_user_claimed_documents()`
          *   **Returns**: A table with columns:
              *   `claimed_share_id` (UUID): ID from `user_claimed_shares`.
              *   `shared_link_id` (UUID): ID from `shared_links`.
              *   `resource_id` (UUID): ID of the actual resource.
              *   `resource_type` (TEXT): Type of the resource (e.g., 'patch_sheet').
              *   `link_type` (TEXT): Type of the share link (e.g., 'view', 'edit').
              *   `resource_name` (TEXT): Name of the shared resource.
              *   `claimed_at` (TIMESTAMPTZ): When the user claimed the share.
              *   `share_code` (TEXT): The unique share code for the link.
              *   `original_owner_id` (UUID): The user ID of the person who originally created the share link.
          *   **Logic**:
              *   Selects from `user_claimed_shares` for the currently authenticated user (`auth.uid()`).
              *   Joins `shared_links` to get link details.
              *   Left joins various resource tables based on `resource_type` to retrieve the `resource_name`.
              *   Orders results by `claimed_at` descending.
          *   **Security**: Runs with the invoker's permissions. RLS on `user_claimed_shares` ensures users only see their own claims. RLS on `shared_links` and resource tables will apply.

      2.  **Important Considerations**:
          *   The function relies on RLS policies on `user_claimed_shares`, `shared_links`, and the individual resource tables to control data visibility.
          *   The `COALESCE` function is used to pick the first non-null name from the joined resource tables.
    */

    CREATE OR REPLACE FUNCTION get_user_claimed_documents()
    RETURNS TABLE (
      claimed_share_id UUID,
      shared_link_id UUID,
      resource_id UUID,
      resource_type TEXT,
      link_type TEXT,
      resource_name TEXT,
      claimed_at TIMESTAMPTZ,
      share_code TEXT,
      original_owner_id UUID
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        ucs.id AS claimed_share_id,
        sl.id AS shared_link_id,
        sl.resource_id,
        sl.resource_type::TEXT,
        sl.link_type::TEXT,
        COALESCE(
          ps.name,
          sp.name,
          rs.name,
          prods.name,
          'Untitled Document' -- Fallback name
        ) AS resource_name,
        ucs.claimed_at,
        sl.share_code,
        sl.user_id AS original_owner_id
      FROM
        public.user_claimed_shares ucs
      JOIN
        public.shared_links sl ON ucs.shared_link_id = sl.id
      LEFT JOIN
        public.patch_sheets ps ON sl.resource_type = 'patch_sheet' AND sl.resource_id = ps.id
      LEFT JOIN
        public.stage_plots sp ON sl.resource_type = 'stage_plot' AND sl.resource_id = sp.id
      LEFT JOIN
        public.run_of_shows rs ON sl.resource_type = 'run_of_show' AND sl.resource_id = rs.id
      LEFT JOIN
        public.production_schedules prods ON sl.resource_type = 'production_schedule' AND sl.resource_id = prods.id
      WHERE
        ucs.user_id = auth.uid()
      ORDER BY
        ucs.claimed_at DESC;
    END;
    $$;

    COMMENT ON FUNCTION get_user_claimed_documents() IS 'Retrieves a list of documents claimed by the current user, along with their details from shared_links and resource tables.';