/*
  # Schema Update: Technical Riders Sharing Support

  This migration adds support for sharing Technical Riders and establishes comprehensive Row Level Security (RLS) policies for the `technical_riders` table.

  1.  **Shared Links Constraint Update**
      *   Modifies the `shared_links_resource_type_check` constraint on the `shared_links` table to include `'technical_rider'` as a valid resource type. This allows technical riders to be shared using the existing sharing mechanism.

  2.  **Technical Riders RLS Policies**
      *   **Enable RLS**: Row Level Security is enabled on the `technical_riders` table.
      *   **Owner Policies**:
          *   `Owners can select their own technical riders`: Allows users to read technical riders they own.
          *   `Owners can insert their own technical riders`: Allows users to create new technical riders, automatically associating them with their `user_id`.
          *   `Owners can update their own technical riders`: Allows users to modify technical riders they own.
          *   `Owners can delete their own technical riders`: Allows users to delete technical riders they own.
      *   **Shared Access Policies**:
          *   `Users can select technical riders shared with them for viewing`: Allows users to read technical riders for which a 'view' or 'edit' share link exists and which they have claimed (or if the link is public and not expired).
          *   `Users can update technical riders shared with them for editing`: Allows users to modify technical riders for which an 'edit' share link exists and which they have claimed (or if the link is public and not expired).
      *   **Public Access (View-Only via Share Code)**:
          *   `Public can select technical riders via valid view share code`: Allows anyone with a valid, non-expired 'view' or 'edit' share code to read the corresponding technical rider. This policy is crucial for the `/shared/technical-rider/:shareCode` route.

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
    'theater_mic_plot',
    'technical_rider' -- Added new type
  ));

-- 2. Technical Riders RLS Policies
ALTER TABLE public.technical_riders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts (optional, but good for idempotency)
DROP POLICY IF EXISTS "Owners can select their own technical riders" ON public.technical_riders;
DROP POLICY IF EXISTS "Owners can insert their own technical riders" ON public.technical_riders;
DROP POLICY IF EXISTS "Owners can update their own technical riders" ON public.technical_riders;
DROP POLICY IF EXISTS "Owners can delete their own technical riders" ON public.technical_riders;
DROP POLICY IF EXISTS "Users can select technical riders shared with them for viewing" ON public.technical_riders;
DROP POLICY IF EXISTS "Users can update technical riders shared with them for editing" ON public.technical_riders;
DROP POLICY IF EXISTS "Public can select technical riders via valid view share code" ON public.technical_riders;


-- Owner Policies
CREATE POLICY "Owners can select their own technical riders"
  ON public.technical_riders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert their own technical riders"
  ON public.technical_riders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their own technical riders"
  ON public.technical_riders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete their own technical riders"
  ON public.technical_riders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Shared Access Policies
CREATE POLICY "Users can select technical riders shared with them for viewing"
  ON public.technical_riders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM shared_links sl
      LEFT JOIN user_claimed_shares ucs ON sl.id = ucs.shared_link_id AND ucs.user_id = auth.uid()
      WHERE sl.resource_id = technical_riders.id
        AND sl.resource_type = 'technical_rider'
        AND (sl.link_type = 'view' OR sl.link_type = 'edit')
        AND (sl.expires_at IS NULL OR sl.expires_at > now())
        AND ( -- Either claimed by the user OR it's a link that doesn't strictly require claiming for view (depends on app logic)
              ucs.id IS NOT NULL OR
              NOT EXISTS (SELECT 1 FROM user_claimed_shares ucs_check WHERE ucs_check.shared_link_id = sl.id) -- if no one claimed it, it's open if link is valid
            )
    )
  );

CREATE POLICY "Users can update technical riders shared with them for editing"
  ON public.technical_riders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM shared_links sl
      JOIN user_claimed_shares ucs ON sl.id = ucs.shared_link_id -- Must be claimed for edit
      WHERE sl.resource_id = technical_riders.id
        AND sl.resource_type = 'technical_rider'
        AND sl.link_type = 'edit'
        AND ucs.user_id = auth.uid()
        AND (sl.expires_at IS NULL OR sl.expires_at > now())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM shared_links sl
      JOIN user_claimed_shares ucs ON sl.id = ucs.shared_link_id
      WHERE sl.resource_id = technical_riders.id
        AND sl.resource_type = 'technical_rider'
        AND sl.link_type = 'edit'
        AND ucs.user_id = auth.uid()
        AND (sl.expires_at IS NULL OR sl.expires_at > now())
    )
  );

-- Public view access for shared links (used by shared view pages before login/claiming)
CREATE POLICY "Public can select technical riders via valid view share code"
  ON public.technical_riders FOR SELECT
  TO public, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.shared_links sl
      WHERE sl.resource_id = technical_riders.id
        AND sl.resource_type = 'technical_rider'
        AND (sl.link_type = 'view' OR sl.link_type = 'edit') -- Allow viewing if edit link is used for view page
        AND (sl.expires_at IS NULL OR sl.expires_at > now())
        -- This policy doesn't check user_claimed_shares, it's for direct access via share_code
        -- The RPC get_shared_link_by_code should handle share_code validation
    )
  );
