/*
  # Create user_claimed_shares table

  This migration creates a new table `user_claimed_shares` to track which shared links users have "claimed" or added to their "Shared With Me" list.

  1.  **New Table**: `user_claimed_shares`
      *   `id` (uuid, primary key): Unique identifier for the claimed share record.
      *   `user_id` (uuid, foreign key): References `auth.users.id`. The user who claimed the share.
      *   `shared_link_id` (uuid, foreign key): References `shared_links.id`. The specific shared link that was claimed.
      *   `claimed_at` (timestamptz, default now()): Timestamp of when the link was claimed.
      *   **Unique Constraint**: A unique constraint on `(user_id, shared_link_id)` ensures a user cannot claim the same shared link multiple times.

  2.  **Security**:
      *   Row Level Security (RLS) is enabled on the `user_claimed_shares` table.
      *   **Policies**:
          *   "Users can view their own claimed shares": Allows users to select records they own.
          *   "Users can insert their own claimed shares": Allows users to add new claimed shares for themselves.
          *   "Users can delete their own claimed shares": Allows users to remove shares they previously claimed.
*/

-- Create the user_claimed_shares table
CREATE TABLE IF NOT EXISTS user_claimed_shares (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_link_id uuid NOT NULL REFERENCES public.shared_links(id) ON DELETE CASCADE,
    claimed_at timestamptz DEFAULT now(),
    CONSTRAINT user_claimed_shares_user_id_shared_link_id_key UNIQUE (user_id, shared_link_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_claimed_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own claimed shares"
ON public.user_claimed_shares
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claimed shares"
ON public.user_claimed_shares
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own claimed shares"
ON public.user_claimed_shares
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add comments to the table and columns for better understanding
COMMENT ON TABLE public.user_claimed_shares IS 'Stores associations between users and shared links they have claimed.';
COMMENT ON COLUMN public.user_claimed_shares.id IS 'Unique identifier for the claimed share record.';
COMMENT ON COLUMN public.user_claimed_shares.user_id IS 'The user who claimed the share.';
COMMENT ON COLUMN public.user_claimed_shares.shared_link_id IS 'The specific shared link that was claimed.';
COMMENT ON COLUMN public.user_claimed_shares.claimed_at IS 'Timestamp of when the link was claimed.';
