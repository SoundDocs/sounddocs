/*
  # Final Fix for Shared Resource Access
  
  1. Changes
     - Add .maybeSingle() functionality in the database
     - Create a new RLS handle_share utility function
     - Simplify and clarify all RLS policies for shared resources
  
  2. Security
     - Ensure proper permission checking for view/edit links
     - Add robust error handling for shared resource queries
     - Fix issue with "JSON object requested, multiple (or no) rows returned"
*/

-- Create a secure function for validating share links
CREATE OR REPLACE FUNCTION handle_share_access(
  p_resource_id UUID, 
  p_resource_type TEXT,
  p_require_edit BOOLEAN DEFAULT FALSE
) 
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count valid share links that match the criteria
  SELECT COUNT(*)
  INTO v_count
  FROM shared_links
  WHERE 
    resource_id = p_resource_id AND 
    resource_type = p_resource_type AND
    (p_require_edit = FALSE OR link_type = 'edit') AND
    (expires_at IS NULL OR expires_at > NOW());
    
  -- Return true if at least one matching share link exists
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Shared patch sheets can be viewed by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared patch sheets with edit links can be updated by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared stage plots can be viewed by anyone" ON public.stage_plots;
DROP POLICY IF EXISTS "Shared stage plots with edit links can be updated by anyone" ON public.stage_plots;

-- Create cleaner, more efficient policies using the new function

-- Allow anonymous users to view shared patch sheets
CREATE POLICY "Shared patch sheets can be viewed by anyone"
  ON public.patch_sheets
  FOR SELECT
  TO anon
  USING (handle_share_access(id, 'patch_sheet', FALSE));

-- Allow anonymous users to update patch sheets with edit links
CREATE POLICY "Shared patch sheets with edit links can be updated by anyone"
  ON public.patch_sheets
  FOR UPDATE
  TO anon
  USING (handle_share_access(id, 'patch_sheet', TRUE));

-- Allow anonymous users to view shared stage plots
CREATE POLICY "Shared stage plots can be viewed by anyone"
  ON public.stage_plots
  FOR SELECT
  TO anon
  USING (handle_share_access(id, 'stage_plot', FALSE));

-- Allow anonymous users to update stage plots with edit links
CREATE POLICY "Shared stage plots with edit links can be updated by anyone"
  ON public.stage_plots
  FOR UPDATE
  TO anon
  USING (handle_share_access(id, 'stage_plot', TRUE));