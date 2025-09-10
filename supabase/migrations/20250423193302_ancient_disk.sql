/*
  # Add inputs field to patch_sheets table

  1. Changes
     - Add `inputs` field to the `patch_sheets` table for storing the input list
     - Uses JSONB type to store an array of input channel objects

  2. Structure of inputs data
     - Each input channel contains: 
       id, channelNumber, name, type, device, phantom, connection, notes
*/

-- Add inputs field to the patch_sheets table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'patch_sheets' 
    AND column_name = 'inputs'
  ) THEN
    ALTER TABLE patch_sheets 
    ADD COLUMN inputs JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
