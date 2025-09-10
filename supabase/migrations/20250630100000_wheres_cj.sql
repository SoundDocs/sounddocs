/*
  # "Where's CJ?" Feature: Location Table
  1. New Table: cj_location
     - Stores CJ's location for events.
     - Columns: id, location_name, description, start_date, end_date, created_at.
  2. Constraints:
     - Ensures end_date is after start_date.
  3. Security:
     - Enables RLS on the table.
     - Adds a policy for public, read-only access.
*/

CREATE TABLE IF NOT EXISTS cj_location (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    location_name text NOT NULL,
    description text,
    start_date timestamptz NOT NULL,
    end_date timestamptz NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT end_date_after_start_date CHECK (end_date > start_date)
);

ALTER TABLE cj_location ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to cj_location"
ON cj_location
FOR SELECT
TO anon, authenticated
USING (true);
