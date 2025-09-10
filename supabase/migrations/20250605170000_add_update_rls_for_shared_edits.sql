/*
  # Add UPDATE RLS Policies for Shared Editable Resources

  This migration adds Row Level Security (RLS) policies to allow users to UPDATE
  resources (`patch_sheets`, `stage_plots`, `run_of_shows`, `production_schedules`)
  if they meet one of the following conditions:
  1. They are the direct owner of the resource (`auth.uid() = user_id`).
  2. They have claimed a `shared_link` that points to the resource, and this
     `shared_link` has `link_type = 'edit'`.

  These policies are necessary to enable saving changes to documents accessed
  via an "editable" shared link.

  1.  **Modified Tables and New Policies**:

      *   **`public.patch_sheets`**:
          *   A new policy "Users can update own or claimed editable patch sheets" is created.
            This allows a user to update a `patch_sheets` record if:
              *   They are the owner (`auth.uid() = user_id`).
              *   OR, the patch sheet is referenced by a `shared_link` that the current
                user has claimed, and `shared_links.link_type` is 'edit'.

      *   **`public.stage_plots`**:
          *   A new policy "Users can update own or claimed editable stage plots" is created
            with similar logic to `patch_sheets`.

      *   **`public.run_of_shows`**:
          *   A new policy "Users can update own or claimed editable run of shows" is created
            with similar logic. (Note: Direct shared editing of run_of_shows might have
            specific handling in the application, but the RLS policy provides the DB-level permission).

      *   **`public.production_schedules`**:
          *   A new policy "Users can update own or claimed editable production schedules"
            is created with similar logic.

  2.  **Impact**:
      *   Users who access a document through a shared link with 'edit' permissions
        and have claimed that share will now be able to save their changes.
      *   The existing `SELECT` policies remain, ensuring users can still view
        documents they own or have claimed (regardless of 'view' or 'edit' link type
        for the claimed share, as per `update_rls_for_claimed_shares.sql`).
      *   Security is maintained by ensuring only authorized users can modify data.
*/

-- RLS UPDATE Policy for patch_sheets
CREATE POLICY "Users can update own or claimed editable patch sheets"
ON public.patch_sheets
FOR UPDATE
TO authenticated
USING (
    (auth.uid() = user_id)
    OR EXISTS (
        SELECT 1
        FROM public.shared_links AS sl
        INNER JOIN public.user_claimed_shares AS ucs ON sl.id = ucs.shared_link_id
        WHERE
            sl.resource_id = public.patch_sheets.id
            AND sl.resource_type = 'patch_sheet'
            AND sl.link_type = 'edit' -- Critical check for edit permission
            AND ucs.user_id = auth.uid()
    )
)
WITH CHECK (
    (auth.uid() = user_id)
    OR EXISTS (
        SELECT 1
        FROM public.shared_links AS sl
        INNER JOIN public.user_claimed_shares AS ucs ON sl.id = ucs.shared_link_id
        WHERE
            sl.resource_id = public.patch_sheets.id
            AND sl.resource_type = 'patch_sheet'
            AND sl.link_type = 'edit'
            AND ucs.user_id = auth.uid()
    )
);

-- RLS UPDATE Policy for stage_plots
CREATE POLICY "Users can update own or claimed editable stage plots"
ON public.stage_plots
FOR UPDATE
TO authenticated
USING (
    (auth.uid() = user_id)
    OR EXISTS (
        SELECT 1
        FROM public.shared_links AS sl
        INNER JOIN public.user_claimed_shares AS ucs ON sl.id = ucs.shared_link_id
        WHERE
            sl.resource_id = public.stage_plots.id
            AND sl.resource_type = 'stage_plot'
            AND sl.link_type = 'edit'
            AND ucs.user_id = auth.uid()
    )
)
WITH CHECK (
    (auth.uid() = user_id)
    OR EXISTS (
        SELECT 1
        FROM public.shared_links AS sl
        INNER JOIN public.user_claimed_shares AS ucs ON sl.id = ucs.shared_link_id
        WHERE
            sl.resource_id = public.stage_plots.id
            AND sl.resource_type = 'stage_plot'
            AND sl.link_type = 'edit'
            AND ucs.user_id = auth.uid()
    )
);

-- RLS UPDATE Policy for run_of_shows
CREATE POLICY "Users can update own or claimed editable run of shows"
ON public.run_of_shows
FOR UPDATE
TO authenticated
USING (
    (auth.uid() = user_id)
    OR EXISTS (
        SELECT 1
        FROM public.shared_links AS sl
        INNER JOIN public.user_claimed_shares AS ucs ON sl.id = ucs.shared_link_id
        WHERE
            sl.resource_id = public.run_of_shows.id
            AND sl.resource_type = 'run_of_show'
            AND sl.link_type = 'edit'
            AND ucs.user_id = auth.uid()
    )
)
WITH CHECK (
    (auth.uid() = user_id)
    OR EXISTS (
        SELECT 1
        FROM public.shared_links AS sl
        INNER JOIN public.user_claimed_shares AS ucs ON sl.id = ucs.shared_link_id
        WHERE
            sl.resource_id = public.run_of_shows.id
            AND sl.resource_type = 'run_of_show'
            AND sl.link_type = 'edit'
            AND ucs.user_id = auth.uid()
    )
);

-- RLS UPDATE Policy for production_schedules
CREATE POLICY "Users can update own or claimed editable production schedules"
ON public.production_schedules
FOR UPDATE
TO authenticated
USING (
    (auth.uid() = user_id)
    OR EXISTS (
        SELECT 1
        FROM public.shared_links AS sl
        INNER JOIN public.user_claimed_shares AS ucs ON sl.id = ucs.shared_link_id
        WHERE
            sl.resource_id = public.production_schedules.id
            AND sl.resource_type = 'production_schedule'
            AND sl.link_type = 'edit'
            AND ucs.user_id = auth.uid()
    )
)
WITH CHECK (
    (auth.uid() = user_id)
    OR EXISTS (
        SELECT 1
        FROM public.shared_links AS sl
        INNER JOIN public.user_claimed_shares AS ucs ON sl.id = ucs.shared_link_id
        WHERE
            sl.resource_id = public.production_schedules.id
            AND sl.resource_type = 'production_schedule'
            AND sl.link_type = 'edit'
            AND ucs.user_id = auth.uid()
    )
);

COMMENT ON POLICY "Users can update own or claimed editable patch sheets" ON public.patch_sheets IS 'Allows users to update patch_sheets they own or are shared with them via a claimed editable link.';
COMMENT ON POLICY "Users can update own or claimed editable stage plots" ON public.stage_plots IS 'Allows users to update stage_plots they own or are shared with them via a claimed editable link.';
COMMENT ON POLICY "Users can update own or claimed editable run of shows" ON public.run_of_shows IS 'Allows users to update run_of_shows they own or are shared with them via a claimed editable link.';
COMMENT ON POLICY "Users can update own or claimed editable production schedules" ON public.production_schedules IS 'Allows users to update production_schedules they own or are shared with them via a claimed editable link.';
