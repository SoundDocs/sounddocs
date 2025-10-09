/*
  # Add Version Columns to Document Tables

  This migration adds version tracking columns to all document tables
  to support real-time collaboration and versioning features.

  ## Changes

  1. Add `version` column to all document tables
     - INTEGER type with DEFAULT 1
     - Incremented on each update
     - Used for conflict detection

  2. Add indexes on version columns for query performance

  ## Affected Tables

  - patch_sheets
  - stage_plots
  - technical_riders
  - run_of_shows
  - production_schedules
  - pixel_maps
  - corporate_mic_plots
  - theater_mic_plots

  ## Rollback

  To rollback this migration, drop the version columns and indexes
  from all affected tables.
*/

-- Add version column to patch_sheets
ALTER TABLE patch_sheets
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patch_sheets_version
  ON patch_sheets(version);

-- Add version column to stage_plots
ALTER TABLE stage_plots
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stage_plots_version
  ON stage_plots(version);

-- Add version column to technical_riders
ALTER TABLE technical_riders
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_technical_riders_version
  ON technical_riders(version);

-- Add version column to run_of_shows
ALTER TABLE run_of_shows
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_run_of_shows_version
  ON run_of_shows(version);

-- Add version column to production_schedules
ALTER TABLE production_schedules
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_production_schedules_version
  ON production_schedules(version);

-- Add version column to pixel_maps
ALTER TABLE pixel_maps
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pixel_maps_version
  ON pixel_maps(version);

-- Add version column to corporate_mic_plots
ALTER TABLE corporate_mic_plots
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_corporate_mic_plots_version
  ON corporate_mic_plots(version);

-- Add version column to theater_mic_plots
ALTER TABLE theater_mic_plots
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_theater_mic_plots_version
  ON theater_mic_plots(version);

-- Add comments to document the version column purpose
COMMENT ON COLUMN patch_sheets.version IS 'Version number incremented on each update for conflict detection';
COMMENT ON COLUMN stage_plots.version IS 'Version number incremented on each update for conflict detection';
COMMENT ON COLUMN technical_riders.version IS 'Version number incremented on each update for conflict detection';
COMMENT ON COLUMN run_of_shows.version IS 'Version number incremented on each update for conflict detection';
COMMENT ON COLUMN production_schedules.version IS 'Version number incremented on each update for conflict detection';
COMMENT ON COLUMN pixel_maps.version IS 'Version number incremented on each update for conflict detection';
COMMENT ON COLUMN corporate_mic_plots.version IS 'Version number incremented on each update for conflict detection';
COMMENT ON COLUMN theater_mic_plots.version IS 'Version number incremented on each update for conflict detection';
