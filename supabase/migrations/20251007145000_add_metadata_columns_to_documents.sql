/*
  # Add Metadata Columns to Document Tables

  This migration adds a metadata JSONB column to all document tables
  that don't already have one. This column is used for:

  - Storing save_type ('auto' or 'manual') for history tracking
  - Client-side metadata (e.g., cursor position, scroll position)
  - Feature flags and experimental features
  - Any other ephemeral or auxiliary data

  ## Tables Updated

  All document tables receive a metadata column if they don't have one.

  ## Safety

  - Uses ADD COLUMN IF NOT EXISTS (safe to run multiple times)
  - Defaults to empty JSONB object
  - Non-blocking operation
  - Backward compatible (existing queries unaffected)
*/

-- Add metadata column to patch_sheets
ALTER TABLE patch_sheets
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to stage_plots
ALTER TABLE stage_plots
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to technical_riders
ALTER TABLE technical_riders
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to run_of_shows
ALTER TABLE run_of_shows
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to production_schedules
ALTER TABLE production_schedules
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to pixel_maps
ALTER TABLE pixel_maps
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to corporate_mic_plots
ALTER TABLE corporate_mic_plots
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to theater_mic_plots
ALTER TABLE theater_mic_plots
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- =====================================================
-- OPTIONAL: Add GIN index for metadata queries
-- =====================================================

-- Only add if you plan to query metadata frequently
-- Commented out by default to minimize index overhead

-- CREATE INDEX IF NOT EXISTS idx_patch_sheets_metadata
--   ON patch_sheets USING GIN(metadata);

-- CREATE INDEX IF NOT EXISTS idx_stage_plots_metadata
--   ON stage_plots USING GIN(metadata);

-- And so on for other tables...

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN patch_sheets.metadata IS 'JSONB metadata for save_type, client state, and feature flags';
COMMENT ON COLUMN stage_plots.metadata IS 'JSONB metadata for save_type, client state, and feature flags';
COMMENT ON COLUMN technical_riders.metadata IS 'JSONB metadata for save_type, client state, and feature flags';
COMMENT ON COLUMN run_of_shows.metadata IS 'JSONB metadata for save_type, client state, and feature flags';
COMMENT ON COLUMN production_schedules.metadata IS 'JSONB metadata for save_type, client state, and feature flags';
COMMENT ON COLUMN pixel_maps.metadata IS 'JSONB metadata for save_type, client state, and feature flags';
COMMENT ON COLUMN corporate_mic_plots.metadata IS 'JSONB metadata for save_type, client state, and feature flags';
COMMENT ON COLUMN theater_mic_plots.metadata IS 'JSONB metadata for save_type, client state, and feature flags';
