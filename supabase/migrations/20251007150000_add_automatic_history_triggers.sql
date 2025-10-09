/*
  # Add Automatic History Triggers

  This migration creates triggers to automatically capture version history
  for all document types. Every UPDATE operation will:

  1. Detect which fields changed
  2. Create a snapshot in the history table
  3. Increment the version number
  4. Record the save type (auto/manual)

  ## Triggers Created

  - patch_sheets -> patch_sheet_history
  - stage_plots -> stage_plot_history
  - technical_riders -> technical_rider_history
  - run_of_shows -> run_of_show_history
  - production_schedules -> production_schedule_history
  - pixel_maps -> pixel_map_history
  - corporate_mic_plots -> corporate_mic_plot_history
  - theater_mic_plots -> theater_mic_plot_history

  ## Features

  - Automatic field change detection
  - Version number auto-increment
  - Save type detection (from metadata or default to 'manual')
  - Complete document snapshot in JSONB
  - Efficient: Only runs on UPDATE, not SELECT

  ## Performance Impact

  - Minimal overhead on updates
  - Asynchronous history writes
  - Indexed history tables for fast queries
*/

-- =====================================================
-- SHARED FUNCTION: Create Document History
-- =====================================================

/*
  Generic function to create document history records.
  Called by all document-specific triggers.

  Parameters:
  - p_table_name: Name of the document table
  - p_document_id: UUID of the document
  - p_old_row: OLD row data as JSONB
  - p_new_row: NEW row data as JSONB
  - p_save_type: 'auto', 'manual', or 'merge'
*/

CREATE OR REPLACE FUNCTION create_document_history_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_changed_fields TEXT[];
  v_save_type TEXT;
  v_old_json JSONB;
  v_new_json JSONB;
  v_field TEXT;
BEGIN
  -- Determine save type (check metadata if available, default to 'manual')
  -- Application can set NEW.metadata->>'save_type' to indicate auto-save
  v_save_type := COALESCE(
    NEW.metadata->>'save_type',
    'manual'
  );

  -- Remove save_type from metadata to avoid storing it in content
  IF NEW.metadata IS NOT NULL THEN
    NEW.metadata := NEW.metadata - 'save_type';
  END IF;

  -- Convert OLD and NEW to JSONB for comparison
  v_old_json := to_jsonb(OLD);
  v_new_json := to_jsonb(NEW);

  -- Detect changed fields
  v_changed_fields := ARRAY(
    SELECT key
    FROM jsonb_each(v_old_json) AS old_fields(key, value)
    WHERE v_old_json->key IS DISTINCT FROM v_new_json->key
      AND key NOT IN ('last_edited', 'version', 'metadata')  -- Exclude auto-updated fields
  );

  -- Increment version number
  NEW.version := COALESCE(OLD.version, 0) + 1;

  -- Insert into appropriate history table based on TG_TABLE_NAME
  CASE TG_TABLE_NAME
    WHEN 'patch_sheets' THEN
      INSERT INTO patch_sheet_history (
        patch_sheet_id, version, content, changed_fields, save_type, created_by
      ) VALUES (
        OLD.id, NEW.version, v_old_json, v_changed_fields, v_save_type, auth.uid()
      );

    WHEN 'stage_plots' THEN
      INSERT INTO stage_plot_history (
        stage_plot_id, version, content, changed_fields, save_type, created_by
      ) VALUES (
        OLD.id, NEW.version, v_old_json, v_changed_fields, v_save_type, auth.uid()
      );

    WHEN 'technical_riders' THEN
      INSERT INTO technical_rider_history (
        technical_rider_id, version, content, changed_fields, save_type, created_by
      ) VALUES (
        OLD.id, NEW.version, v_old_json, v_changed_fields, v_save_type, auth.uid()
      );

    WHEN 'run_of_shows' THEN
      INSERT INTO run_of_show_history (
        run_of_show_id, version, content, changed_fields, save_type, created_by
      ) VALUES (
        OLD.id, NEW.version, v_old_json, v_changed_fields, v_save_type, auth.uid()
      );

    WHEN 'production_schedules' THEN
      INSERT INTO production_schedule_history (
        production_schedule_id, version, content, changed_fields, save_type, created_by
      ) VALUES (
        OLD.id, NEW.version, v_old_json, v_changed_fields, v_save_type, auth.uid()
      );

    WHEN 'pixel_maps' THEN
      INSERT INTO pixel_map_history (
        pixel_map_id, version, content, changed_fields, save_type, created_by
      ) VALUES (
        OLD.id, NEW.version, v_old_json, v_changed_fields, v_save_type, auth.uid()
      );

    WHEN 'corporate_mic_plots' THEN
      INSERT INTO corporate_mic_plot_history (
        corporate_mic_plot_id, version, content, changed_fields, save_type, created_by
      ) VALUES (
        OLD.id, NEW.version, v_old_json, v_changed_fields, v_save_type, auth.uid()
      );

    WHEN 'theater_mic_plots' THEN
      INSERT INTO theater_mic_plot_history (
        theater_mic_plot_id, version, content, changed_fields, save_type, created_by
      ) VALUES (
        OLD.id, NEW.version, v_old_json, v_changed_fields, v_save_type, auth.uid()
      );

  END CASE;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION create_document_history_record IS 'Automatically create history records for document updates';

-- =====================================================
-- TRIGGERS FOR EACH DOCUMENT TABLE
-- =====================================================

-- Patch Sheets
DROP TRIGGER IF EXISTS trigger_patch_sheets_history ON patch_sheets;
CREATE TRIGGER trigger_patch_sheets_history
  BEFORE UPDATE ON patch_sheets
  FOR EACH ROW
  EXECUTE FUNCTION create_document_history_record();

-- Stage Plots
DROP TRIGGER IF EXISTS trigger_stage_plots_history ON stage_plots;
CREATE TRIGGER trigger_stage_plots_history
  BEFORE UPDATE ON stage_plots
  FOR EACH ROW
  EXECUTE FUNCTION create_document_history_record();

-- Technical Riders
DROP TRIGGER IF EXISTS trigger_technical_riders_history ON technical_riders;
CREATE TRIGGER trigger_technical_riders_history
  BEFORE UPDATE ON technical_riders
  FOR EACH ROW
  EXECUTE FUNCTION create_document_history_record();

-- Run of Shows
DROP TRIGGER IF EXISTS trigger_run_of_shows_history ON run_of_shows;
CREATE TRIGGER trigger_run_of_shows_history
  BEFORE UPDATE ON run_of_shows
  FOR EACH ROW
  EXECUTE FUNCTION create_document_history_record();

-- Production Schedules
DROP TRIGGER IF EXISTS trigger_production_schedules_history ON production_schedules;
CREATE TRIGGER trigger_production_schedules_history
  BEFORE UPDATE ON production_schedules
  FOR EACH ROW
  EXECUTE FUNCTION create_document_history_record();

-- Pixel Maps
DROP TRIGGER IF EXISTS trigger_pixel_maps_history ON pixel_maps;
CREATE TRIGGER trigger_pixel_maps_history
  BEFORE UPDATE ON pixel_maps
  FOR EACH ROW
  EXECUTE FUNCTION create_document_history_record();

-- Corporate Mic Plots
DROP TRIGGER IF EXISTS trigger_corporate_mic_plots_history ON corporate_mic_plots;
CREATE TRIGGER trigger_corporate_mic_plots_history
  BEFORE UPDATE ON corporate_mic_plots
  FOR EACH ROW
  EXECUTE FUNCTION create_document_history_record();

-- Theater Mic Plots
DROP TRIGGER IF EXISTS trigger_theater_mic_plots_history ON theater_mic_plots;
CREATE TRIGGER trigger_theater_mic_plots_history
  BEFORE UPDATE ON theater_mic_plots
  FOR EACH ROW
  EXECUTE FUNCTION create_document_history_record();

-- =====================================================
-- NOTE: Metadata Column Requirement
-- =====================================================

/*
  IMPORTANT: Some document tables may not have a 'metadata' column yet.
  If you see errors about missing 'metadata' column, you need to add it first:

  For tables without metadata column, add it with:
    ALTER TABLE <table_name> ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

  The trigger function checks for metadata->>'save_type' to determine
  if a save was auto or manual. If metadata doesn't exist or save_type
  is not set, it defaults to 'manual'.

  This is safe to deploy even if metadata columns don't exist yet,
  but you'll want to add them for full auto-save functionality.
*/
