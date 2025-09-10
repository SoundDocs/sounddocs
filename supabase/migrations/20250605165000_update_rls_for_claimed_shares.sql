/*
      # Update RLS Policies for Claimed Shares Access

      This migration updates Row Level Security (RLS) policies for the `shared_links`
      table and all relevant resource tables (`patch_sheets`, `stage_plots`, 
      `run_of_shows`, `production_schedules`). The goal is to allow users who have 
      claimed a shared item (via the `user_claimed_shares` table) to view the 
      details of the shared link itself and the underlying resource.

      Without these changes, the `get_user_claimed_documents` RPC would not be able
      to retrieve information for claimed items where the current user is not the
      original owner of the share link or resource.

      1.  **Modified Tables and Policies**:

          *   **`public.shared_links`**:
              *   The existing SELECT policy (likely named "Users can view their own shared links") is dropped.
              *   A new policy "Users can view own or claimed shared links" is created. This allows a user to select a `shared_links` record if:
                  *   They are the owner (`auth.uid() = user_id`).
                  *   OR, they have an entry in `user_claimed_shares` linking them to this `shared_link_id`.

          *   **`public.patch_sheets`**:
              *   The existing SELECT policy ("Users can view their own patch sheets") is dropped.
              *   A new policy "Users can view own or claimed patch sheets" is created. This allows a user to select a `patch_sheets` record if:
                  *   They are the owner (`auth.uid() = user_id`).
                  *   OR, the patch sheet is referenced by a `shared_link` that the current user has claimed.

          *   **`public.stage_plots`**:
              *   Any existing SELECT policy (e.g., "Users can view their own stage plots") is dropped.
              *   A new policy "Users can view own or claimed stage plots" is created with similar logic to `patch_sheets`.

          *   **`public.run_of_shows`**:
              *   Any existing SELECT policy (e.g., "Users can view their own run of shows") is dropped.
              *   A new policy "Users can view own or claimed run of shows" is created with similar logic.

          *   **`public.production_schedules`**:
              *   Any existing SELECT policy (e.g., "Users can view their own production schedules") is dropped.
              *   A new policy "Users can view own or claimed production schedules" is created with similar logic.

      2.  **Impact**:
          *   Users will now be able to see documents listed in their "Shared With Me" page correctly, as the `get_user_claimed_documents` RPC will have the necessary permissions to read the joined data.
          *   Security remains intact as users can only access shared items they have explicitly claimed or items they own.
    */

    -- Update RLS for shared_links
DROP POLICY IF EXISTS "Users can view their own shared links" ON public.shared_links;
CREATE POLICY "Users can view own or claimed shared links"
ON public.shared_links
FOR SELECT
TO authenticated
USING (
    (auth.uid() = user_id)
    OR EXISTS (
        SELECT 1
        FROM public.user_claimed_shares AS ucs
        WHERE ucs.shared_link_id = public.shared_links.id AND ucs.user_id = auth.uid()
    )
);

-- Update RLS for patch_sheets
DROP POLICY IF EXISTS "Users can view their own patch sheets" ON public.patch_sheets;
CREATE POLICY "Users can view own or claimed patch sheets"
ON public.patch_sheets
FOR SELECT
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
            AND ucs.user_id = auth.uid()
    )
);

-- Update RLS for stage_plots
-- Assuming a similar naming convention for the old policy.
-- If your stage_plots table or its RLS policy doesn't exist or is named differently, 
-- this DROP might not affect anything, or you might need to adjust the name.
DROP POLICY IF EXISTS "Users can view their own stage plots" ON public.stage_plots;
CREATE POLICY "Users can view own or claimed stage plots"
ON public.stage_plots
FOR SELECT
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
            AND ucs.user_id = auth.uid()
    )
);

-- Update RLS for run_of_shows
DROP POLICY IF EXISTS "Users can view their own run of shows" ON public.run_of_shows;
CREATE POLICY "Users can view own or claimed run of shows"
ON public.run_of_shows
FOR SELECT
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
            AND ucs.user_id = auth.uid()
    )
);

-- Update RLS for production_schedules
DROP POLICY IF EXISTS "Users can view their own production schedules" ON public.production_schedules;
CREATE POLICY "Users can view own or claimed production schedules"
ON public.production_schedules
FOR SELECT
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
            AND ucs.user_id = auth.uid()
    )
);

COMMENT ON POLICY "Users can view own or claimed shared links" ON public.shared_links IS 'Allows users to view shared_links they own or have claimed.';
COMMENT ON POLICY "Users can view own or claimed patch sheets" ON public.patch_sheets IS 'Allows users to view patch_sheets they own or are shared with them via a claimed link.';
COMMENT ON POLICY "Users can view own or claimed stage plots" ON public.stage_plots IS 'Allows users to view stage_plots they own or are shared with them via a claimed link.';
COMMENT ON POLICY "Users can view own or claimed run of shows" ON public.run_of_shows IS 'Allows users to view run_of_shows they own or are shared with them via a claimed link.';
COMMENT ON POLICY "Users can view own or claimed production schedules" ON public.production_schedules IS 'Allows users to view production_schedules they own or are shared with them via a claimed link.';
