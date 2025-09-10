/*
  # Fix shared links functionality

  1. Changes
    - Create optimized function for retrieving shared resources by share code
    - Improve RLS policies to ensure proper resource access
    - Fix issue with "Share link not found" error

  This migration provides a comprehensive fix for the shared links feature
  and ensures that both view and edit links work correctly.
*/

-- Create a better function to retrieve shared links
CREATE OR REPLACE FUNCTION get_shared_link_by_code(
    p_share_code TEXT
)
RETURNS SETOF SHARED_LINKS
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM shared_links
  WHERE share_code = p_share_code
  LIMIT 1;
$$;

-- Create a function to verify if a share code is valid for a specific resource
CREATE OR REPLACE FUNCTION is_valid_share_code(
    p_share_code TEXT,
    p_resource_type TEXT,
    p_require_edit BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM shared_links
    WHERE 
      share_code = p_share_code AND
      resource_type = p_resource_type AND
      (NOT p_require_edit OR link_type = 'edit') AND
      (expires_at IS NULL OR expires_at > now())
  ) INTO v_link_exists;
  
  RETURN v_link_exists;
END;
$$;

-- Remove and recreate row-level security policies for shared resources
DROP POLICY IF EXISTS "Shared patch sheets can be viewed by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared patch sheets with edit links can be updated by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared stage plots can be viewed by anyone" ON public.stage_plots;
DROP POLICY IF EXISTS "Shared stage plots with edit links can be updated by anyone" ON public.stage_plots;

-- Create public accessors for shared resources
CREATE POLICY "Shared patch sheets can be viewed by anyone"
ON public.patch_sheets
FOR SELECT
TO anon
USING (handle_share_access(id, 'patch_sheet', FALSE));

CREATE POLICY "Shared patch sheets with edit links can be updated by anyone"
ON public.patch_sheets
FOR UPDATE
TO anon
USING (handle_share_access(id, 'patch_sheet', TRUE));

CREATE POLICY "Shared stage plots can be viewed by anyone"
ON public.stage_plots
FOR SELECT
TO anon
USING (handle_share_access(id, 'stage_plot', FALSE));

CREATE POLICY "Shared stage plots with edit links can be updated by anyone"
ON public.stage_plots
FOR UPDATE
TO anon
USING (handle_share_access(id, 'stage_plot', TRUE));

-- Ensure the handle_share_access function is optimized
CREATE OR REPLACE FUNCTION handle_share_access(
    p_resource_id UUID, 
    p_resource_type TEXT,
    p_require_edit BOOLEAN DEFAULT FALSE
) 
RETURNS BOOLEAN AS $$
DECLARE
  v_link_exists BOOLEAN;
BEGIN
  -- Check if any valid share link exists for this resource
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_links
    WHERE 
      resource_id = p_resource_id AND 
      resource_type = p_resource_type AND
      (NOT p_require_edit OR link_type = 'edit') AND
      (expires_at IS NULL OR expires_at > now())
  ) INTO v_link_exists;
  
  RETURN v_link_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
