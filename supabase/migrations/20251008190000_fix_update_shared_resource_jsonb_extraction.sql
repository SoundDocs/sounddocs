-- Migration: Fix update_shared_resource to properly extract JSONB values
-- The previous version was using -> which returns JSONB (with quotes for strings)
-- We need to use ->> to extract as text, then the database will handle type conversion

CREATE OR REPLACE FUNCTION update_shared_resource(
  p_share_code text,
  p_resource_type text,
  p_table_name text,
  p_updates jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link shared_links;
  v_resource_id uuid;
  v_result jsonb;
BEGIN
  -- Verify the share link exists and has edit permissions
  SELECT * INTO v_link
  FROM shared_links
  WHERE share_code = p_share_code
    AND link_type = 'edit'
    AND resource_type = p_resource_type
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_link IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired share code';
  END IF;

  v_resource_id := v_link.resource_id;

  -- Update the last_accessed timestamp on the shared link
  UPDATE shared_links
  SET last_accessed = NOW()
  WHERE id = v_link.id;

  -- Perform the update on the target table with SECURITY DEFINER privileges (bypasses RLS)
  -- Build a dynamic UPDATE statement with each field from p_updates
  DECLARE
    v_key text;
    v_set_clause text := '';
    v_first boolean := true;
  BEGIN
    -- Build SET clause from jsonb keys and values
    -- Use ->> to extract as text, which removes JSONB quotes and allows proper type conversion
    FOR v_key IN SELECT jsonb_object_keys(p_updates)
    LOOP
      IF v_first THEN
        v_set_clause := format('%I = ($1->>%L)::%s', v_key, v_key, pg_typeof_column(p_table_name, v_key));
        v_first := false;
      ELSE
        v_set_clause := v_set_clause || format(', %I = ($1->>%L)::%s', v_key, v_key, pg_typeof_column(p_table_name, v_key));
      END IF;
    END LOOP;

    -- Add last_edited to SET clause
    IF v_set_clause != '' THEN
      v_set_clause := v_set_clause || ', last_edited = NOW()';
    ELSE
      v_set_clause := 'last_edited = NOW()';
    END IF;

    -- Execute the dynamic UPDATE
    EXECUTE format(
      'UPDATE %I SET %s WHERE id = $2 RETURNING to_jsonb(%I.*)',
      p_table_name,
      v_set_clause,
      p_table_name
    )
    INTO v_result
    USING p_updates, v_resource_id;

    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Resource not found or update failed';
    END IF;

    RETURN v_result;
  END;
END;
$$;

-- Helper function to get the PostgreSQL type of a column
CREATE OR REPLACE FUNCTION pg_typeof_column(
  p_table_name text,
  p_column_name text
)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_type text;
BEGIN
  SELECT format_type(atttypid, atttypmod)
  INTO v_type
  FROM pg_attribute
  WHERE attrelid = p_table_name::regclass
    AND attname = p_column_name
    AND NOT attisdropped;

  IF v_type IS NULL THEN
    RAISE EXCEPTION 'Column % does not exist in table %', p_column_name, p_table_name;
  END IF;

  RETURN v_type;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_shared_resource(text, text, text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION update_shared_resource(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_typeof_column(text, text) TO anon;
GRANT EXECUTE ON FUNCTION pg_typeof_column(text, text) TO authenticated;

COMMENT ON FUNCTION update_shared_resource IS 'Updates a shared resource by share code, bypassing RLS. Fixed to properly extract JSONB values without extra quotes.';
COMMENT ON FUNCTION pg_typeof_column IS 'Helper function to get the PostgreSQL type of a table column for type casting';
