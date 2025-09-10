/*
  # Create shared_links table and sharing functionality

  1. New Tables
    - `shared_links`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `resource_id` (uuid): ID of the resource being shared
      - `resource_type` (text): 'patch_sheet' or 'stage_plot'
      - `link_type` (text): 'view' or 'edit'
      - `share_code` (text, unique): Generated unique share code
      - `expires_at` (timestamptz): When the shared link expires
      - `created_at` (timestamptz)
      - `last_accessed` (timestamptz): When the link was last accessed
      - `access_count` (integer): How many times the link was accessed
  
  2. Security
    - Enable RLS on `shared_links` table
    - Add policy for authenticated users to manage their own shared links
    - Add policy for anonymous users to view shared links
    - Add policies for anonymous access to shared resources
*/

-- Create the shared_links table
CREATE TABLE IF NOT EXISTS shared_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    resource_id uuid NOT NULL,
    resource_type text NOT NULL CHECK (resource_type IN ('patch_sheet', 'stage_plot')),
    link_type text NOT NULL CHECK (link_type IN ('view', 'edit')),
    share_code text NOT NULL UNIQUE,
    expires_at timestamptz,
    created_at timestamptz DEFAULT now(),
    last_accessed timestamptz,
    access_count integer DEFAULT 0,
  
    -- Add composite unique constraint to prevent duplicate shares of the same resource with the same type
    UNIQUE(user_id, resource_id, resource_type, link_type)
);

-- Enable Row Level Security
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own shared links
CREATE POLICY "Users can view their own shared links"
ON shared_links
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create shared links"
ON shared_links
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their shared links"
ON shared_links
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their shared links"
ON shared_links
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Everyone (including anonymous users) can use shared links
CREATE POLICY "Anyone can view shared links"
ON shared_links
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to view shared patch sheets
CREATE POLICY "Shared patch sheets can be viewed by anyone"
ON patch_sheets
FOR SELECT
TO anon
USING (
    id IN (
        SELECT resource_id 
        FROM shared_links 
        WHERE
            resource_type = 'patch_sheet' 
            AND (expires_at IS null OR expires_at > now())
    )
);

-- Allow anonymous users to update patch sheets with edit links
CREATE POLICY "Shared patch sheets with edit links can be updated by anyone"
ON patch_sheets
FOR UPDATE
TO anon
USING (
    id IN (
        SELECT resource_id 
        FROM shared_links 
        WHERE
            resource_type = 'patch_sheet' 
            AND link_type = 'edit'
            AND (expires_at IS null OR expires_at > now())
    )
);

-- Allow anonymous users to view shared stage plots
CREATE POLICY "Shared stage plots can be viewed by anyone"
ON stage_plots
FOR SELECT
TO anon
USING (
    id IN (
        SELECT resource_id 
        FROM shared_links 
        WHERE
            resource_type = 'stage_plot'
            AND (expires_at IS null OR expires_at > now())
    )
);

-- Allow anonymous users to update stage plots with edit links
CREATE POLICY "Shared stage plots with edit links can be updated by anyone"
ON stage_plots
FOR UPDATE
TO anon
USING (
    id IN (
        SELECT resource_id 
        FROM shared_links 
        WHERE
            resource_type = 'stage_plot'
            AND link_type = 'edit'
            AND (expires_at IS null OR expires_at > now())
    )
);

-- Create index to improve query performance
CREATE INDEX idx_shared_links_resource ON shared_links(resource_id, resource_type);
CREATE INDEX idx_shared_links_share_code ON shared_links(share_code);
