/*
  # Fix for shared links functionality

  This migration creates a stable API for retrieving shared links
  by their share code, ensuring consistent single record returns.
*/

-- Create a function to reliably fetch a shared link by code
DROP FUNCTION IF EXISTS get_shared_link_by_code;
CREATE OR REPLACE FUNCTION get_shared_link_by_code(
  p_share_code TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  resource_id UUID,
  resource_type TEXT,
  link_type TEXT,
  share_code TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  last_accessed TIMESTAMPTZ,
  access_count INTEGER
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    id,
    user_id,
    resource_id, 
    resource_type,
    link_type,
    share_code,
    expires_at,
    created_at,
    last_accessed,
    access_count
  FROM public.shared_links
  WHERE share_code = p_share_code
  LIMIT 1;
$$;

-- Ensure we have the correct RLS policies in place
DROP POLICY IF EXISTS "Shared patch sheets can be viewed by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared patch sheets with edit links can be updated by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared stage plots can be viewed by anyone" ON public.stage_plots;
DROP POLICY IF EXISTS "Shared stage plots with edit links can be updated by anyone" ON public.stage_plots;

-- Create policies with the proper approach for RLS
CREATE POLICY "Shared patch sheets can be viewed by anyone"
  ON patch_sheets
  FOR SELECT
  TO anon
  USING (handle_share_access(id, 'patch_sheet', false));

CREATE POLICY "Shared patch sheets with edit links can be updated by anyone"
  ON patch_sheets
  FOR UPDATE
  TO anon
  USING (handle_share_access(id, 'patch_sheet', true));

CREATE POLICY "Shared stage plots can be viewed by anyone"
  ON stage_plots
  FOR SELECT
  TO anon
  USING (handle_share_access(id, 'stage_plot', false));

CREATE POLICY "Shared stage plots with edit links can be updated by anyone"
  ON stage_plots
  FOR UPDATE
  TO anon
  USING (handle_share_access(id, 'stage_plot', true));