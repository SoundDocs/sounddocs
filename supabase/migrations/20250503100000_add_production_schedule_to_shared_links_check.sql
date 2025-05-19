-- Drop the existing constraint
ALTER TABLE public.shared_links
DROP CONSTRAINT IF EXISTS shared_links_resource_type_check;

-- Add the new constraint with 'production_schedule'
ALTER TABLE public.shared_links
ADD CONSTRAINT shared_links_resource_type_check
CHECK (resource_type IN ('patch_sheet', 'stage_plot', 'production_schedule'));

-- Also, ensure production_schedules table has RLS policies for shared access if not already present
-- (These might be similar to what exists for patch_sheets and stage_plots)

-- Allow anonymous users to view shared production schedules
CREATE POLICY "Shared production schedules can be viewed by anyone"
  ON public.production_schedules
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.shared_links sl
      WHERE sl.resource_id = public.production_schedules.id
        AND sl.resource_type = 'production_schedule'
        AND (sl.expires_at IS NULL OR sl.expires_at > now())
    )
  );

-- Allow anonymous users to update production schedules with edit links (if/when edit is implemented)
CREATE POLICY "Shared production schedules with edit links can be updated by anyone"
  ON public.production_schedules
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.shared_links sl
      WHERE sl.resource_id = public.production_schedules.id
        AND sl.resource_type = 'production_schedule'
        AND sl.link_type = 'edit'
        AND (sl.expires_at IS NULL OR sl.expires_at > now())
    )
  );
