/*
  # Create RPC function to get total user count

  This function counts all registered users from the auth.users table.
  Uses SECURITY DEFINER to allow querying the auth schema.
*/

CREATE OR REPLACE FUNCTION get_total_user_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)
  FROM auth.users;
$$;