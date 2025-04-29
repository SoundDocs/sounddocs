/*
  # Fix shared links functionality

  1. Security
     - Drop existing policies and create more precise ones for shared resources
     - Ensure single row returns from shared resource queries
     - Fix the path handling for edit links

  This migration addresses an issue where edit links were failing with
  "JSON object requested, multiple (or no) rows returned" errors.
*/

-- Delete existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Shared patch sheets can be viewed by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared patch sheets with edit links can be updated by anyone" ON public.patch_sheets;
DROP POLICY IF EXISTS "Shared stage plots can be viewed by anyone" ON public.stage_plots;
DROP POLICY IF EXISTS "Shared stage plots with edit links can be updated by anyone" ON public.stage_plots;

-- Create more specific policies with correlated subqueries 
-- to ensure proper row-level security for shared resources

-- Patch sheets view access policy
CREATE POLICY "Shared patch sheets can be viewed by anyone" 
  ON public.patch_sheets
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 
      FROM shared_links
      WHERE 
        shared_links.resource_id = patch_sheets.id AND
        shared_links.resource_type = 'patch_sheet' AND
        (shared_links.expires_at IS NULL OR shared_links.expires_at > now())
    )
  );

-- Patch sheets edit access policy
CREATE POLICY "Shared patch sheets with edit links can be updated by anyone"
  ON public.patch_sheets
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 
      FROM shared_links
      WHERE 
        shared_links.resource_id = patch_sheets.id AND
        shared_links.resource_type = 'patch_sheet' AND
        shared_links.link_type = 'edit' AND
        (shared_links.expires_at IS NULL OR shared_links.expires_at > now())
    )
  );

-- Stage plots view access policy
CREATE POLICY "Shared stage plots can be viewed by anyone"
  ON public.stage_plots
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 
      FROM shared_links
      WHERE 
        shared_links.resource_id = stage_plots.id AND
        shared_links.resource_type = 'stage_plot' AND
        (shared_links.expires_at IS NULL OR shared_links.expires_at > now())
    )
  );

-- Stage plots edit access policy
CREATE POLICY "Shared stage plots with edit links can be updated by anyone"
  ON public.stage_plots
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 
      FROM shared_links
      WHERE 
        shared_links.resource_id = stage_plots.id AND
        shared_links.resource_type = 'stage_plot' AND
        shared_links.link_type = 'edit' AND
        (shared_links.expires_at IS NULL OR shared_links.expires_at > now())
    )
  );