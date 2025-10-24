/*
  # Create Pending Saves Table

  This migration creates a table to track pending save operations for:
  - Offline support
  - Failed save retry logic
  - Queue management for auto-saves
  - Network resilience

  ## New Table: pending_saves

  Stores save operations that haven't been successfully committed yet.
  Used by client-side code to retry failed saves and maintain
  offline editing capability.

  ## Features

  - Tracks save attempts and retry count
  - Supports both auto and manual saves
  - Enables offline editing with sync
  - Automatic cleanup after successful save

  ## Usage Flow

  1. Client attempts save -> Network fails
  2. Save queued in pending_saves table
  3. Background job retries periodically
  4. On success -> Remove from queue
  5. On max retries -> Alert user

  ## Performance

  - Indexes on user_id and created_at
  - Index on retry_count for batch processing
*/

CREATE TABLE IF NOT EXISTS pending_saves (
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

  -- User who initiated the save
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The updates to apply (partial or full document)
  updates JSONB NOT NULL,

  -- Save metadata
  save_type TEXT NOT NULL CHECK (save_type IN ('auto', 'manual')) DEFAULT 'auto',

  -- Retry tracking
  attempted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  last_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for user's pending saves
CREATE INDEX IF NOT EXISTS idx_pending_saves_user
  ON pending_saves(user_id, created_at DESC);

-- Index for document's pending saves
CREATE INDEX IF NOT EXISTS idx_pending_saves_document
  ON pending_saves(document_type, document_id);

-- Index for retry job processing
CREATE INDEX IF NOT EXISTS idx_pending_saves_retry
  ON pending_saves(retry_count, attempted_at)
  WHERE retry_count < 5; -- Only index saves that haven't hit max retries

-- Index for cleanup of old successful saves
CREATE INDEX IF NOT EXISTS idx_pending_saves_created_at
  ON pending_saves(created_at DESC);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE pending_saves IS 'Queue of pending save operations for offline support and retry logic';
COMMENT ON COLUMN pending_saves.updates IS 'JSONB object containing fields to update on the document';
COMMENT ON COLUMN pending_saves.save_type IS 'Whether this was an auto-save or manual save';
COMMENT ON COLUMN pending_saves.retry_count IS 'Number of times this save has been retried';
COMMENT ON COLUMN pending_saves.last_error IS 'Last error message if save failed';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

/*
  Queue a pending save operation

  Usage:
    SELECT queue_pending_save(
      'patch_sheet',
      '123e4567-e89b-12d3-a456-426614174000',
      '{"name": "Updated Name", "info": {...}}'::jsonb,
      'auto'
    );
*/

CREATE OR REPLACE FUNCTION queue_pending_save(
  p_document_type TEXT,
  p_document_id UUID,
  p_updates JSONB,
  p_save_type TEXT DEFAULT 'auto'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pending_save_id UUID;
BEGIN
  INSERT INTO pending_saves (
    document_type,
    document_id,
    user_id,
    updates,
    save_type
  ) VALUES (
    p_document_type,
    p_document_id,
    auth.uid(),
    p_updates,
    p_save_type
  )
  RETURNING id INTO v_pending_save_id;

  RETURN v_pending_save_id;
END;
$$;

COMMENT ON FUNCTION queue_pending_save IS 'Queue a save operation for later retry';

/*
  Mark a pending save as retried

  Updates the retry count and attempted timestamp.
*/

CREATE OR REPLACE FUNCTION retry_pending_save(
  p_pending_save_id UUID,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE pending_saves
  SET
    retry_count = retry_count + 1,
    attempted_at = NOW(),
    last_error = COALESCE(p_error_message, last_error)
  WHERE id = p_pending_save_id;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION retry_pending_save IS 'Increment retry count for a pending save';

/*
  Remove a pending save after successful completion
*/

CREATE OR REPLACE FUNCTION complete_pending_save(
  p_pending_save_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM pending_saves
  WHERE id = p_pending_save_id;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION complete_pending_save IS 'Remove a pending save after successful completion';

/*
  Get all pending saves for retry (max retries not exceeded)
*/

CREATE OR REPLACE FUNCTION get_pending_saves_for_retry(
  p_max_retries INTEGER DEFAULT 5,
  p_retry_after_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_type TEXT,
  document_id UUID,
  user_id UUID,
  updates JSONB,
  save_type TEXT,
  retry_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.id,
    ps.document_type,
    ps.document_id,
    ps.user_id,
    ps.updates,
    ps.save_type,
    ps.retry_count
  FROM pending_saves ps
  WHERE ps.retry_count < p_max_retries
    AND ps.attempted_at < NOW() - (p_retry_after_minutes || ' minutes')::INTERVAL
  ORDER BY ps.created_at ASC
  LIMIT 100; -- Process in batches
END;
$$;

COMMENT ON FUNCTION get_pending_saves_for_retry IS 'Get pending saves ready for retry';
