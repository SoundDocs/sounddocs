/*
  # Update stage_plots schema to handle new stage size format
  
  1. Changes
     - Modify the stage_size column to store the new format 
       that includes both width and depth dimensions
     - The new format will be strings like 'medium-wide', 'large-narrow', etc.
*/

-- Update the stage_size column default to the new format
ALTER TABLE stage_plots 
ALTER COLUMN stage_size SET DEFAULT 'medium-wide';

-- Convert existing records to use the new format
UPDATE stage_plots 
SET
    stage_size
    = CASE 
        WHEN stage_size = 'small' THEN 'small-wide'
        WHEN stage_size = 'medium' THEN 'medium-wide'
        WHEN stage_size = 'large' THEN 'large-wide'
        ELSE stage_size -- Keep as is if already in the new format
    END;
