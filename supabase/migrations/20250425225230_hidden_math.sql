/*
  # Add background image support to stage plots

  1. Changes
    - Add `backgroundImage` column to store image URL/data URI
    - Add `backgroundOpacity` column to store opacity value (0-100)

  This allows stage plots to have a customizable background image
  with adjustable opacity.
*/

-- Add background image fields to stage_plots table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'stage_plots' 
    AND column_name = 'backgroundImage'
  ) THEN
    ALTER TABLE stage_plots 
    ADD COLUMN "backgroundImage" TEXT DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'stage_plots' 
    AND column_name = 'backgroundOpacity'
  ) THEN
    ALTER TABLE stage_plots 
    ADD COLUMN "backgroundOpacity" INTEGER DEFAULT 50;
  END IF;
END $$;
