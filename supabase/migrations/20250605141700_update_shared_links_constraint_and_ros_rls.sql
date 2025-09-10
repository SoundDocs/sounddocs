/*
      # Update Shared Links Constraint and Add Run of Show RLS

      This migration updates the `shared_links` table to support 'run_of_show' as a resource type and adds a Row Level Security (RLS) policy to the `run_of_shows` table for shared access.

      1. Table Modifications
        - `shared_links` table:
          - The `shared_links_resource_type_check` constraint is updated to include 'run_of_show' as a valid `resource_type`. The allowed types are now: 'patch_sheet', 'stage_plot', 'production_schedule', 'run_of_show'.

      2. Security
        - `run_of_shows` table:
          - Row Level Security is explicitly enabled (if not already).
          - A new policy named "Shared run_of_shows can be viewed by anyone" is added. This policy allows users with the `anon` role to select records from `run_of_shows` if a corresponding valid and non-expired 'view' link exists in the `shared_links` table for that specific run of show. This complements the `get_public_run_of_show_by_share_code` RPC function by providing a direct table access security layer.

      Important Notes:
      - This change is crucial for enabling the creation of share links for "Run of Show" resources.
      - The RLS policy on `run_of_shows` enhances security by ensuring that even if direct table access were attempted by an anonymous user, it would be governed by the presence of a valid share link.
    */

    -- Drop the existing constraint on shared_links if it exists
ALTER TABLE public.shared_links
DROP CONSTRAINT IF EXISTS shared_links_resource_type_check;

-- Add the new constraint with 'run_of_show' included
ALTER TABLE public.shared_links
ADD CONSTRAINT shared_links_resource_type_check
CHECK (resource_type IN ('patch_sheet', 'stage_plot', 'production_schedule', 'run_of_show'));

-- Ensure RLS is enabled on run_of_shows table
-- This command is idempotent; it does nothing if RLS is already enabled.
ALTER TABLE public.run_of_shows ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to view shared run_of_shows via a valid link
-- This policy complements the get_public_run_of_show_by_share_code RPC.
-- The RPC is SECURITY DEFINER and handles sanitization, but this policy adds a layer for direct table access.
CREATE POLICY "Shared run_of_shows can be viewed by anyone"
ON public.run_of_shows
FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1
        FROM public.shared_links AS sl
        WHERE
            sl.resource_id = public.run_of_shows.id -- Links shared_links.resource_id to run_of_shows.id
            AND sl.resource_type = 'run_of_show'
            AND sl.link_type = 'view' -- Ensure it's a view link
            AND (sl.expires_at IS NULL OR sl.expires_at > now()) -- Check for expiration
    )
);

-- Note: Policies for authenticated users (e.g., owner can CRUD their own run_of_shows)
-- are assumed to exist from the initial table creation.
-- This migration specifically addresses anonymous access for shared links.
