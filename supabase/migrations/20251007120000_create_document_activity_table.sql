/*
  # Create Document Activity Table

  This migration creates a comprehensive activity tracking table for all
  document types to support:
  - Audit logging
  - Activity feeds
  - Change tracking
  - User collaboration insights

  ## New Table: document_activity

  Tracks all user interactions with documents including:
  - Creation, updates, views
  - Field-level changes
  - Sharing events
  - Auto-save events

  ## Features

  - Polymorphic design (works with all document types)
  - Field-level change tracking (old_value, new_value)
  - Indexed for fast lookups by document, user, and time
  - Supports activity feed queries

  ## Performance

  - Composite indexes for common queries
  - Partial indexes for specific action types
  - Retention policy can be added later if needed
*/

CREATE TABLE IF NOT EXISTS document_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Document reference (polymorphic)
  document_type TEXT NOT NULL CHECK (document_type IN (
    'patch_sheet',
    'stage_plot',
    'technical_rider',
    'run_of_show',
    'production_schedule',
    'pixel_map',
    'corporate_mic_plot',
    'theater_mic_plot'
  )),
  document_id UUID NOT NULL,

  -- User and action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN (
    'created',
    'updated',
    'viewed',
    'shared',
    'auto_saved',
    'deleted',
    'restored',
    'duplicated',
    'exported'
  )),

  -- Field-level change tracking (optional, for updates)
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,

  -- Additional metadata (optional)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite index for document lookups
CREATE INDEX IF NOT EXISTS idx_document_activity_document
  ON document_activity(document_type, document_id, created_at DESC);

-- Index for user activity queries
CREATE INDEX IF NOT EXISTS idx_document_activity_user
  ON document_activity(user_id, created_at DESC);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_document_activity_created_at
  ON document_activity(created_at DESC);

-- Partial index for auto-save events (most frequent)
CREATE INDEX IF NOT EXISTS idx_document_activity_auto_saves
  ON document_activity(document_id, created_at DESC)
  WHERE action = 'auto_saved';

-- Partial index for update events
CREATE INDEX IF NOT EXISTS idx_document_activity_updates
  ON document_activity(document_id, created_at DESC)
  WHERE action = 'updated';

-- GIN index for metadata queries (if needed for complex filters)
CREATE INDEX IF NOT EXISTS idx_document_activity_metadata
  ON document_activity USING GIN(metadata);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE document_activity IS 'Comprehensive activity log for all document types';
COMMENT ON COLUMN document_activity.document_type IS 'Type of document (patch_sheet, stage_plot, etc.)';
COMMENT ON COLUMN document_activity.document_id IS 'UUID of the document in its respective table';
COMMENT ON COLUMN document_activity.action IS 'Type of action performed on the document';
COMMENT ON COLUMN document_activity.field_changed IS 'Name of the field that was changed (for updates)';
COMMENT ON COLUMN document_activity.old_value IS 'Previous value of the field (stored as text)';
COMMENT ON COLUMN document_activity.new_value IS 'New value of the field (stored as text)';
COMMENT ON COLUMN document_activity.metadata IS 'Additional context about the action (e.g., share_code, export_format)';

-- =====================================================
-- HELPER FUNCTION: Log Activity
-- =====================================================

/*
  Helper function to easily log document activity from application code or triggers.

  Usage:
    SELECT log_document_activity(
      'patch_sheet',
      '123e4567-e89b-12d3-a456-426614174000',
      'updated',
      'name',
      'Old Name',
      'New Name'
    );
*/

CREATE OR REPLACE FUNCTION log_document_activity(
  p_document_type TEXT,
  p_document_id UUID,
  p_action TEXT,
  p_field_changed TEXT DEFAULT NULL,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO document_activity (
    document_type,
    document_id,
    user_id,
    action,
    field_changed,
    old_value,
    new_value,
    metadata
  ) VALUES (
    p_document_type,
    p_document_id,
    auth.uid(),
    p_action,
    p_field_changed,
    p_old_value,
    p_new_value,
    p_metadata
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$;

COMMENT ON FUNCTION log_document_activity IS 'Helper function to log document activity with current user context';
