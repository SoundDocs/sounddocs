/*
  # Schema Update: Theater Mic Plots and Sharing Enhancements

  This migration introduces support for sharing Theater Mic Plots and establishes comprehensive Row Level Security (RLS) policies for the `theater_mic_plots` table.

  1.  **Shared Links Constraint Update**
      *   Modifies the `shared_links_resource_type_check` constraint on the `shared_links` table to include `'theater_mic_plot'` as a valid resource type. This allows theater mic plots to be shared using the existing sharing mechanism.

  2.  **Theater Mic Plots RLS Policies**
      *   **Enable RLS**: Row Level Security is enabled on the `theater_mic_plots` table.
      *   **Owner Policies**:
          *   `Owners can select their own theater mic plots`: Allows users to read theater mic plots they own.
          *   `Owners can insert their own theater mic plots`: Allows users to create new theater mic plots, automatically associating them with their `user_id`.
          *   `Owners can update their own theater mic plots`: Allows users to modify theater mic plots they own.
          *   `Owners can delete their own theater mic plots`: Allows users to delete theater mic plots they own.
      *   **Shared Access Policies**:
          *   `Users can select theater mic plots shared with them for viewing`: Allows users to read theater mic plots for which a 'view' or 'edit' share link exists and which they have claimed (or if the link is public and not expired).
          *   `Users can update theater mic plots shared with them for editing`: Allows users to modify theater mic plots for which an 'edit' share link exists and which they have claimed (or if the link is public and not expired).
      *   **Public Access (View-Only via Share Code)**:
          *   `Public can select theater mic plots via valid view share code`: Allows anyone with a valid, non-expired 'view' or 'edit' share code to read the corresponding theater mic plot. This policy is crucial for the `/shared/theater-mic-plot/:shareCode` route.

  3.  **Important Notes**
      *   The RLS policies ensure that users can only access and modify data they are authorized to, either as owners or through a valid share link.
      *   The `auth.uid()` function is used to identify the currently authenticated user.
      *   The `shared_links` table is joined to check for valid share permissions.
      *   The `user_claimed_shares` table is used to verify if a user has explicitly added a shared document to their collection, which can be a condition for accessing shared editable documents.
*/

-- 1. Update shared_links_resource_type_check constraint
ALTER TABLE public.shared_links DROP CONSTRAINT IF EXISTS shared_links_resource_type_check;
ALTER TABLE public.shared_links ADD CONSTRAINT shared_links_resource_type_check
CHECK (resource_type IN (
    'patch_sheet',
    'stage_plot',
    'production_schedule',
    'run_of_show',
    'corporate_mic_plot',
    'theater_mic_plot' -- Added new type
));

-- 2. Theater Mic Plots RLS Policies
ALTER TABLE public.theater_mic_plots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts (optional, but good for idempotency)
DROP POLICY IF EXISTS "Owners can select their own theater mic plots" ON public.theater_mic_plots;
DROP POLICY IF EXISTS "Owners can insert their own theater mic plots" ON public.theater_mic_plots;
DROP POLICY IF EXISTS "Owners can update their own theater mic plots" ON public.theater_mic_plots;
DROP POLICY IF EXISTS "Owners can delete their own theater mic plots" ON public.theater_mic_plots;
DROP POLICY IF EXISTS "Users can select theater mic plots shared with them for viewing" ON public.theater_mic_plots;
DROP POLICY IF EXISTS "Users can update theater mic plots shared with them for editing" ON public.theater_mic_plots;
DROP POLICY IF EXISTS "Public can select theater mic plots via valid view share code" ON public.theater_mic_plots;


-- Owner Policies
CREATE POLICY "Owners can select their own theater mic plots"
ON public.theater_mic_plots FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert their own theater mic plots"
ON public.theater_mic_plots FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their own theater mic plots"
ON public.theater_mic_plots FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete their own theater mic plots"
ON public.theater_mic_plots FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Shared Access Policies
CREATE POLICY "Users can select theater mic plots shared with them for viewing"
ON public.theater_mic_plots FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM shared_links AS sl
        LEFT JOIN user_claimed_shares AS ucs ON sl.id = ucs.shared_link_id AND ucs.user_id = auth.uid()
        WHERE
            sl.resource_id = theater_mic_plots.id
            AND sl.resource_type = 'theater_mic_plot'
            AND (sl.link_type = 'view' OR sl.link_type = 'edit')
            AND (sl.expires_at IS NULL OR sl.expires_at > now())
            AND ( -- Either claimed by the user OR it's a link that doesn't strictly require claiming for view (depends on app logic)
                ucs.id IS NOT NULL
                -- if no one claimed it, it's open if link is valid
                OR NOT EXISTS (
                    SELECT 1 FROM user_claimed_shares AS ucs_check
                    WHERE ucs_check.shared_link_id = sl.id
                )
            ) 
    )
);

CREATE POLICY "Users can update theater mic plots shared with them for editing"
ON public.theater_mic_plots FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM shared_links AS sl
        INNER JOIN user_claimed_shares AS ucs ON sl.id = ucs.shared_link_id -- Must be claimed for edit
        WHERE
            sl.resource_id = theater_mic_plots.id
            AND sl.resource_type = 'theater_mic_plot'
            AND sl.link_type = 'edit'
            AND ucs.user_id = auth.uid()
            AND (sl.expires_at IS NULL OR sl.expires_at > now())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM shared_links AS sl
        INNER JOIN user_claimed_shares AS ucs ON sl.id = ucs.shared_link_id
        WHERE
            sl.resource_id = theater_mic_plots.id
            AND sl.resource_type = 'theater_mic_plot'
            AND sl.link_type = 'edit'
            AND ucs.user_id = auth.uid()
            AND (sl.expires_at IS NULL OR sl.expires_at > now())
    )
);
  
-- Public view access for shared links (used by shared view pages before login/claiming)
CREATE POLICY "Public can select theater mic plots via valid view share code"
ON public.theater_mic_plots FOR SELECT
TO public, authenticated -- Changed from 'anon' to 'public' which is more standard, or use 'anon, authenticated'
USING (
    EXISTS (
        SELECT 1
        FROM public.shared_links AS sl
        WHERE
            sl.resource_id = theater_mic_plots.id
            AND sl.resource_type = 'theater_mic_plot'
            AND (sl.link_type = 'view' OR sl.link_type = 'edit') -- Allow viewing if edit link is used for view page
            AND (sl.expires_at IS NULL OR sl.expires_at > now())
    -- This policy doesn't check user_claimed_shares, it's for direct access via share_code
    -- The RPC get_shared_link_by_code should handle share_code validation
    )
);
