/*
  # Fix RLS policies for shared resources to ensure proper access

  1. Changes
    - Update the RLS policies for patch_sheets and stage_plots
    - Ensure proper anonymous access to shared resources
    - Fix the USING clause in policies to handle resource IDs correctly

  2. Security
    - Ensure that only resources with valid share links are accessible
    - Make sure view-only and edit permissions work correctly
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Shared patch sheets can be viewed by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared patch sheets with edit links can be updated by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared stage plots can be viewed by anyone" ON public.stage_plots;
DROP POLICY IF EXISTS "Shared stage plots with edit links can be updated by anyone" ON public.stage_plots;

-- Recreate anonymous access policies with improved conditions

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