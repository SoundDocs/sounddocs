/*
      # Update Shared Links Constraint for Corporate Mic Plot

      This migration updates the `shared_links` table to support 'corporate_mic_plot' as a resource type.

      1. Table Modifications
        - `shared_links` table:
          - The `shared_links_resource_type_check` constraint is updated to include 'corporate_mic_plot' as a valid `resource_type`. The allowed types are now: 'patch_sheet', 'stage_plot', 'production_schedule', 'run_of_show', 'corporate_mic_plot'.

      Important Notes:
      - This change is crucial for enabling the creation of share links for "Corporate Mic Plot" resources.
    */

    -- Drop the existing constraint on shared_links if it exists
    -- It might be named based on the previous migration or a default name if created manually.
    -- We'll try the specific name first, then a more general approach if needed.
DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'shared_links_resource_type_check' AND conrelid = 'public.shared_links'::regclass
      ) THEN
        ALTER TABLE public.shared_links DROP CONSTRAINT shared_links_resource_type_check;
      END IF;
    END $$;

-- Add the new constraint with 'corporate_mic_plot' included
ALTER TABLE public.shared_links
ADD CONSTRAINT shared_links_resource_type_check
CHECK (resource_type IN ('patch_sheet', 'stage_plot', 'production_schedule', 'run_of_show', 'corporate_mic_plot'));

-- Additionally, we need to ensure RLS policies for corporate_mic_plots allow shared viewing/editing.
-- This policy allows anonymous users to view shared corporate_mic_plots via a valid link.
-- This complements any RPC functions by providing a direct table access security layer.

-- Ensure RLS is enabled on corporate_mic_plots table (should be from its creation migration)
ALTER TABLE public.corporate_mic_plots ENABLE ROW LEVEL SECURITY;

-- Policy for anonymous users to VIEW shared corporate_mic_plots
CREATE POLICY "Shared corporate_mic_plots can be viewed by anyone"
ON public.corporate_mic_plots
FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1
        FROM public.shared_links AS sl
        WHERE
            sl.resource_id = public.corporate_mic_plots.id
            AND sl.resource_type = 'corporate_mic_plot'
            AND sl.link_type = 'view'
            AND (sl.expires_at IS NULL OR sl.expires_at > now())
    )
);

-- Policy for anonymous users to EDIT shared corporate_mic_plots
-- Note: This is a powerful permission. Ensure your application logic correctly
-- gatekeeps who can generate 'edit' links.
CREATE POLICY "Shared corporate_mic_plots can be edited by anyone with an edit link"
ON public.corporate_mic_plots
FOR UPDATE
TO anon
USING (
    EXISTS (
        SELECT 1
        FROM public.shared_links AS sl
        WHERE
            sl.resource_id = public.corporate_mic_plots.id
            AND sl.resource_type = 'corporate_mic_plot'
            AND sl.link_type = 'edit'
            AND (sl.expires_at IS NULL OR sl.expires_at > now())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.shared_links AS sl
        WHERE
            sl.resource_id = public.corporate_mic_plots.id
            AND sl.resource_type = 'corporate_mic_plot'
            AND sl.link_type = 'edit'
            AND (sl.expires_at IS NULL OR sl.expires_at > now())
    )
);
