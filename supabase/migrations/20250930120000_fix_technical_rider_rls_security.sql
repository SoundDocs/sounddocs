/*
  # Security Fix: Technical Rider RLS Share Code Validation

  This migration strengthens the RLS policy for public access to technical riders
  by ensuring that a share code explicitly exists before granting access.

  ## Changes
  - Drops and recreates the "Public can select technical riders via valid view share code" policy
  - Adds `sl.share_code IS NOT NULL` check to prevent potential security vulnerability
  - Ensures public access is only granted when a valid share code exists
*/

-- Drop the existing public view policy
DROP POLICY IF EXISTS "Public can select technical riders via valid view share code" ON public.technical_riders;

-- Recreate with enhanced security check
CREATE POLICY "Public can select technical riders via valid view share code"
  ON public.technical_riders FOR SELECT
  TO public, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.shared_links sl
      WHERE sl.resource_id = technical_riders.id
        AND sl.resource_type = 'technical_rider'
        AND sl.share_code IS NOT NULL -- Ensure a share code exists
        AND (sl.link_type = 'view' OR sl.link_type = 'edit')
        AND (sl.expires_at IS NULL OR sl.expires_at > now())
    )
  );
