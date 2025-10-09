/*
  # Create Document History Tables

  This migration creates history tables for all document types to support:
  - Version history and rollback
  - Audit trails
  - Auto-save tracking
  - Change detection

  ## New Tables

  Each history table stores snapshots of document changes with:
  - Full document snapshot as JSONB
  - List of changed fields
  - Save type (auto/manual/merge)
  - Creator and timestamp

  ## History Tables Created

  - patch_sheet_history
  - stage_plot_history
  - technical_rider_history
  - run_of_show_history
  - production_schedule_history
  - pixel_map_history
  - corporate_mic_plot_history
  - theater_mic_plot_history

  ## Performance

  - Indexes on document_id and created_at for fast lookups
  - Composite indexes for common query patterns
*/

-- =====================================================
-- PATCH SHEET HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS patch_sheet_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patch_sheet_id UUID NOT NULL REFERENCES patch_sheets(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  changed_fields TEXT[] DEFAULT '{}',
  save_type TEXT NOT NULL CHECK (save_type IN ('auto', 'manual', 'merge')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_patch_sheet_history_document_id
  ON patch_sheet_history(patch_sheet_id);

CREATE INDEX IF NOT EXISTS idx_patch_sheet_history_created_at
  ON patch_sheet_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patch_sheet_history_document_version
  ON patch_sheet_history(patch_sheet_id, version DESC);

COMMENT ON TABLE patch_sheet_history IS 'Version history for patch_sheets documents';
COMMENT ON COLUMN patch_sheet_history.content IS 'Complete snapshot of the document at this version';
COMMENT ON COLUMN patch_sheet_history.changed_fields IS 'Array of field names that changed in this version';
COMMENT ON COLUMN patch_sheet_history.save_type IS 'Type of save: auto (auto-save), manual (user save), merge (conflict resolution)';

-- =====================================================
-- STAGE PLOT HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS stage_plot_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_plot_id UUID NOT NULL REFERENCES stage_plots(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  changed_fields TEXT[] DEFAULT '{}',
  save_type TEXT NOT NULL CHECK (save_type IN ('auto', 'manual', 'merge')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_stage_plot_history_document_id
  ON stage_plot_history(stage_plot_id);

CREATE INDEX IF NOT EXISTS idx_stage_plot_history_created_at
  ON stage_plot_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stage_plot_history_document_version
  ON stage_plot_history(stage_plot_id, version DESC);

COMMENT ON TABLE stage_plot_history IS 'Version history for stage_plots documents';

-- =====================================================
-- TECHNICAL RIDER HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS technical_rider_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technical_rider_id UUID NOT NULL REFERENCES technical_riders(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  changed_fields TEXT[] DEFAULT '{}',
  save_type TEXT NOT NULL CHECK (save_type IN ('auto', 'manual', 'merge')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_technical_rider_history_document_id
  ON technical_rider_history(technical_rider_id);

CREATE INDEX IF NOT EXISTS idx_technical_rider_history_created_at
  ON technical_rider_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_technical_rider_history_document_version
  ON technical_rider_history(technical_rider_id, version DESC);

COMMENT ON TABLE technical_rider_history IS 'Version history for technical_riders documents';

-- =====================================================
-- RUN OF SHOW HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS run_of_show_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_of_show_id UUID NOT NULL REFERENCES run_of_shows(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  changed_fields TEXT[] DEFAULT '{}',
  save_type TEXT NOT NULL CHECK (save_type IN ('auto', 'manual', 'merge')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_run_of_show_history_document_id
  ON run_of_show_history(run_of_show_id);

CREATE INDEX IF NOT EXISTS idx_run_of_show_history_created_at
  ON run_of_show_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_run_of_show_history_document_version
  ON run_of_show_history(run_of_show_id, version DESC);

COMMENT ON TABLE run_of_show_history IS 'Version history for run_of_shows documents';

-- =====================================================
-- PRODUCTION SCHEDULE HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS production_schedule_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_schedule_id UUID NOT NULL REFERENCES production_schedules(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  changed_fields TEXT[] DEFAULT '{}',
  save_type TEXT NOT NULL CHECK (save_type IN ('auto', 'manual', 'merge')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_production_schedule_history_document_id
  ON production_schedule_history(production_schedule_id);

CREATE INDEX IF NOT EXISTS idx_production_schedule_history_created_at
  ON production_schedule_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_production_schedule_history_document_version
  ON production_schedule_history(production_schedule_id, version DESC);

COMMENT ON TABLE production_schedule_history IS 'Version history for production_schedules documents';

-- =====================================================
-- PIXEL MAP HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS pixel_map_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pixel_map_id UUID NOT NULL REFERENCES pixel_maps(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  changed_fields TEXT[] DEFAULT '{}',
  save_type TEXT NOT NULL CHECK (save_type IN ('auto', 'manual', 'merge')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_pixel_map_history_document_id
  ON pixel_map_history(pixel_map_id);

CREATE INDEX IF NOT EXISTS idx_pixel_map_history_created_at
  ON pixel_map_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pixel_map_history_document_version
  ON pixel_map_history(pixel_map_id, version DESC);

COMMENT ON TABLE pixel_map_history IS 'Version history for pixel_maps documents';

-- =====================================================
-- CORPORATE MIC PLOT HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS corporate_mic_plot_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_mic_plot_id UUID NOT NULL REFERENCES corporate_mic_plots(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  changed_fields TEXT[] DEFAULT '{}',
  save_type TEXT NOT NULL CHECK (save_type IN ('auto', 'manual', 'merge')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_corporate_mic_plot_history_document_id
  ON corporate_mic_plot_history(corporate_mic_plot_id);

CREATE INDEX IF NOT EXISTS idx_corporate_mic_plot_history_created_at
  ON corporate_mic_plot_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_corporate_mic_plot_history_document_version
  ON corporate_mic_plot_history(corporate_mic_plot_id, version DESC);

COMMENT ON TABLE corporate_mic_plot_history IS 'Version history for corporate_mic_plots documents';

-- =====================================================
-- THEATER MIC PLOT HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS theater_mic_plot_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theater_mic_plot_id UUID NOT NULL REFERENCES theater_mic_plots(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  changed_fields TEXT[] DEFAULT '{}',
  save_type TEXT NOT NULL CHECK (save_type IN ('auto', 'manual', 'merge')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_theater_mic_plot_history_document_id
  ON theater_mic_plot_history(theater_mic_plot_id);

CREATE INDEX IF NOT EXISTS idx_theater_mic_plot_history_created_at
  ON theater_mic_plot_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_theater_mic_plot_history_document_version
  ON theater_mic_plot_history(theater_mic_plot_id, version DESC);

COMMENT ON TABLE theater_mic_plot_history IS 'Version history for theater_mic_plots documents';
