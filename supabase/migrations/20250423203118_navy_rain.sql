/*
  # Add outputs field to patch_sheets table

  1. Changes
    - Add `outputs` column to `patch_sheets` table to store output channel information
    - Uses JSONB type to store an array of output objects
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'patch_sheets' 
    AND column_name = 'outputs'
  ) THEN
    ALTER TABLE patch_sheets 
    ADD COLUMN outputs JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;