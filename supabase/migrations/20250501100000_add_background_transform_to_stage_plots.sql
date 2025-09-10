-- Add columns for background image transformation to stage_plots table
ALTER TABLE stage_plots
ADD COLUMN IF NOT EXISTS background_image_x INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS background_image_y INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS background_image_scale DOUBLE PRECISION DEFAULT 1.0;

-- Update existing rows that have a background image to ensure they have default transform values
-- This helps maintain consistency for older stage plots.
UPDATE stage_plots
SET
    background_image_x = COALESCE(background_image_x, 0),
    background_image_y = COALESCE(background_image_y, 0),
    background_image_scale = COALESCE(background_image_scale, 1.0)
WHERE "backgroundImage" IS NOT NULL;
