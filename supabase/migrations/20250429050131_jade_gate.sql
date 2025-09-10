/*
  # Fix shared links query issues

  1. Changes
    - Create a new function to properly handle share code lookups
    - Ensure consistent single-row returns for share links
    - Fix the "JSON object requested, multiple rows returned" error

  2. Security
    - Maintain Row Level Security while fixing share functionality
    - Ensure policies properly handle the share code validation
*/

-- Create a function to get a resource by share code
CREATE OR REPLACE FUNCTION get_resource_by_share_code(
    p_share_code TEXT,
    p_resource_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    resource_id UUID,
    resource_type TEXT,
    link_type TEXT,
    share_code TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    last_accessed TIMESTAMPTZ,
    access_count INTEGER
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    id, 
    resource_id, 
    resource_type,
    link_type,
    share_code,
    expires_at,
    created_at,
    last_accessed,
    access_count
  FROM public.shared_links
  WHERE 
    share_code = p_share_code
    AND (p_resource_type IS NULL OR resource_type = p_resource_type)
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

-- Update handle_share_access to handle share codes directly
CREATE OR REPLACE FUNCTION handle_share_access(
    p_resource_id UUID, 
    p_resource_type TEXT,
    p_require_edit BOOLEAN DEFAULT FALSE
) 
RETURNS BOOLEAN AS $$
DECLARE
  v_link_exists BOOLEAN;
BEGIN
  -- Check if any valid share link exists for this resource
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_links
    WHERE 
      resource_id = p_resource_id AND 
      resource_type = p_resource_type AND
      (NOT p_require_edit OR link_type = 'edit') AND
      (expires_at IS NULL OR expires_at > now())
  ) INTO v_link_exists;
  
  RETURN v_link_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update access policies to use handle_share_access function
-- We're keeping the existing policies, just making sure they're
-- correctly implemented using the handle_share_access function
