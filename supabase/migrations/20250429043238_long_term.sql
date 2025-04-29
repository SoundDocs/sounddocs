/*
  # Fix shared links functionality

  1. Changes
    - Add new migration to ensure shared links work properly
    - Fix the policy implementation for shared resources
    - Make sure the query for shared links returns the correct number of rows

  This migration adds an explicit policy for each resource type and action
  to fix the issue with "multiple rows returned" when trying to access
  shared resources.
*/

-- Recreate policies with the correct syntax and logic
DROP POLICY IF EXISTS "Shared patch sheets can be viewed by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared patch sheets with edit links can be updated by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared stage plots can be viewed by anyone" ON public.stage_plots;
DROP POLICY IF EXISTS "Shared stage plots with edit links can be updated by anyone" ON public.stage_plots;

-- Allow anonymous users to view shared patch sheets
CREATE POLICY "Shared patch sheets can be viewed by anyone"
  ON public.patch_sheets
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shared_links
      WHERE 
        shared_links.resource_id = patch_sheets.id AND
        shared_links.resource_type = 'patch_sheet' AND
        (shared_links.expires_at IS NULL OR shared_links.expires_at > now())
    )
  );

-- Allow anonymous users to update patch sheets with edit links
CREATE POLICY "Shared patch sheets with edit links can be updated by anyone"
  ON public.patch_sheets
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shared_links
      WHERE 
        shared_links.resource_id = patch_sheets.id AND
        shared_links.resource_type = 'patch_sheet' AND
        shared_links.link_type = 'edit' AND
        (shared_links.expires_at IS NULL OR shared_links.expires_at > now())
    )
  );

-- Allow anonymous users to view shared stage plots
CREATE POLICY "Shared stage plots can be viewed by anyone"
  ON public.stage_plots
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shared_links
      WHERE 
        shared_links.resource_id = stage_plots.id AND
        shared_links.resource_type = 'stage_plot' AND
        (shared_links.expires_at IS NULL OR shared_links.expires_at > now())
    )
  );

-- Allow anonymous users to update stage plots with edit links
CREATE POLICY "Shared stage plots with edit links can be updated by anyone"
  ON public.stage_plots
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shared_links
      WHERE 
        shared_links.resource_id = stage_plots.id AND
        shared_links.resource_type = 'stage_plot' AND
        shared_links.link_type = 'edit' AND
        (shared_links.expires_at IS NULL OR shared_links.expires_at > now())
    )
  );

-- Create a function to check if a share link is valid
CREATE OR REPLACE FUNCTION is_valid_share_link(
  p_resource_id UUID, 
  p_resource_type TEXT,
  p_link_type TEXT DEFAULT NULL
) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM shared_links
    WHERE 
      resource_id = p_resource_id AND
      resource_type = p_resource_type AND
      (p_link_type IS NULL OR link_type = p_link_type) AND
      (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;