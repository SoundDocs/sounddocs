-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Shared patch sheets can be viewed by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared patch sheets with edit links can be updated by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared stage plots can be viewed by anyone" ON public.stage_plots;
DROP POLICY IF EXISTS "Shared stage plots with edit links can be updated by anyone" ON public.stage_plots;

-- Create improved policies for shared patch sheets (view access)
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

-- Create improved policies for shared patch sheets (edit access)
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

-- Create improved policies for shared stage plots (view access)
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

-- Create improved policies for shared stage plots (edit access)
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