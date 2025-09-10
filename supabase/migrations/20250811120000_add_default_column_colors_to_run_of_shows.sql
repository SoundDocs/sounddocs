/*
  # Add default_column_colors to run_of_shows table

  This migration adds the `default_column_colors` column to the `run_of_shows` table
  to store color preferences for default columns (Item #, Start, Preset, Duration, etc.).

  ## Changes
  - Add `default_column_colors` (jsonb, default: '{}'::jsonb) to `run_of_shows` table
  - This will store a mapping of column keys to color hex codes
  - Example: {"startTime": "#0066FF", "duration": "#00AA44"}
*/

ALTER TABLE run_of_shows 
ADD COLUMN IF NOT EXISTS default_column_colors JSONB DEFAULT '{}'::JSONB;
