/*
  # Fix shared resource access policies

  1. Changes
    - Drop previous RLS policies for shared resources that might be causing issues
    - Create improved policies for anonymous access to shared resources
    - Ensure correct access control for both patch sheets and stage plots
  
  2. Security
    - Reorganize policies to properly handle both view and edit permissions
    - Ensure expired links don't grant access
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Shared patch sheets can be viewed by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared patch sheets with edit links can be updated by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared stage plots can be viewed by anyone" ON public.stage_plots;
DROP POLICY IF EXISTS "Shared stage plots with edit links can be updated by anyone" ON public.stage_plots;

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
        resource_type = 'patch_sheet' AND
        (expires_at IS NULL OR expires_at > now())
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
        resource_type = 'patch_sheet' AND
        link_type = 'edit' AND
        (expires_at IS NULL OR expires_at > now())
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
        resource_type = 'stage_plot' AND
        (expires_at IS NULL OR expires_at > now())
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
        resource_type = 'stage_plot' AND
        link_type = 'edit' AND
        (expires_at IS NULL OR expires_at > now())
    )
  );