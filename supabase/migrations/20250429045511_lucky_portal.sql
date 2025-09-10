/*
  # Fix RLS policy implementation for shared resources

  1. Security
    - Improve how shared resources are accessed by anonymous users
    - Create a more robust function to validate share access
    - Ensure proper view/edit permissions
*/

-- Replace existing handle_share_access function with an improved version
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

-- Drop existing policies
DROP POLICY IF EXISTS "Shared patch sheets can be viewed by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared patch sheets with edit links can be updated by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared stage plots can be viewed by anyone" ON public.stage_plots;
DROP POLICY IF EXISTS "Shared stage plots with edit links can be updated by anyone" ON public.stage_plots;

-- Create policies that use the improved function
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
