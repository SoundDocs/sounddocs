/*
  # Create Document Locks Table

  This migration creates a table to manage document editing locks for:
  - Preventing simultaneous edits
  - Showing who is currently editing
  - Automatic lock expiration
  - Graceful lock handoff

  ## New Table: document_locks

  Tracks which user is currently editing a document.
  Locks expire automatically after a timeout to prevent abandoned locks.

  ## Features

  - One lock per document (enforced by primary key)
  - Automatic expiration (default 30 minutes)
  - User information for "Currently editing" UI
  - Heartbeat mechanism to keep lock alive

  ## Lock Flow

  1. User opens document -> Acquire lock (if available)
  2. Client sends heartbeat every 60s -> Extend expiration
  3. User saves/closes -> Release lock
  4. Lock expires -> Auto-release (30 min timeout)

  ## Performance

  - Primary key on document_id (one lock per document)
  - Index on expires_at for cleanup
  - Index on locked_by for user lookups
*/

CREATE TABLE IF NOT EXISTS document_locks (
  -- Composite primary key: one lock per document
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

  -- Lock owner
  locked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Lock timing
  locked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Lock metadata (optional)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Composite primary key ensures one lock per document
  PRIMARY KEY (document_type, document_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for finding locks by user
CREATE INDEX IF NOT EXISTS idx_document_locks_user
  ON document_locks(locked_by);

-- Index for cleanup of expired locks (no partial index - NOW() is not immutable)
CREATE INDEX IF NOT EXISTS idx_document_locks_expired
  ON document_locks(expires_at);

-- Index for finding locks that need heartbeat soon
CREATE INDEX IF NOT EXISTS idx_document_locks_heartbeat
  ON document_locks(last_heartbeat, expires_at);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE document_locks IS 'Active editing locks for documents to prevent conflicts';
COMMENT ON COLUMN document_locks.locked_by IS 'User who currently holds the lock';
COMMENT ON COLUMN document_locks.expires_at IS 'When the lock will automatically expire';
COMMENT ON COLUMN document_locks.last_heartbeat IS 'Last time the client confirmed they still need the lock';
COMMENT ON COLUMN document_locks.metadata IS 'Additional context (e.g., client_id, session_id)';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

/*
  Acquire a lock on a document

  Returns TRUE if lock was acquired, FALSE if document is already locked.
  Default lock duration is 30 minutes.

  Usage:
    SELECT acquire_document_lock(
      'patch_sheet',
      '123e4567-e89b-12d3-a456-426614174000',
      30  -- minutes
    );
*/

CREATE OR REPLACE FUNCTION acquire_document_lock(
  p_document_type TEXT,
  p_document_id UUID,
  p_duration_minutes INTEGER DEFAULT 30,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user UUID;
BEGIN
  v_current_user := auth.uid();

  -- Try to insert the lock
  INSERT INTO document_locks (
    document_type,
    document_id,
    locked_by,
    expires_at,
    metadata
  )
  VALUES (
    p_document_type,
    p_document_id,
    v_current_user,
    NOW() + (p_duration_minutes || ' minutes')::INTERVAL,
    p_metadata
  )
  ON CONFLICT (document_type, document_id) DO NOTHING;

  -- Return TRUE if we inserted a row (lock acquired)
  RETURN FOUND;

EXCEPTION
  WHEN OTHERS THEN
    -- Lock acquisition failed
    RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION acquire_document_lock IS 'Acquire an editing lock on a document';

/*
  Release a lock on a document

  Only the lock owner can release their own lock.
  Returns TRUE if lock was released.
*/

CREATE OR REPLACE FUNCTION release_document_lock(
  p_document_type TEXT,
  p_document_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM document_locks
  WHERE document_type = p_document_type
    AND document_id = p_document_id
    AND locked_by = auth.uid();

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION release_document_lock IS 'Release an editing lock on a document';

/*
  Send heartbeat to extend lock expiration

  Resets the expiration time and updates last_heartbeat.
  Only the lock owner can send heartbeats.
*/

CREATE OR REPLACE FUNCTION heartbeat_document_lock(
  p_document_type TEXT,
  p_document_id UUID,
  p_extend_minutes INTEGER DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE document_locks
  SET
    expires_at = NOW() + (p_extend_minutes || ' minutes')::INTERVAL,
    last_heartbeat = NOW()
  WHERE document_type = p_document_type
    AND document_id = p_document_id
    AND locked_by = auth.uid();

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION heartbeat_document_lock IS 'Send heartbeat to extend lock expiration';

/*
  Check if a document is locked

  Returns lock information if locked, NULL if available.
*/

CREATE OR REPLACE FUNCTION check_document_lock(
  p_document_type TEXT,
  p_document_id UUID
)
RETURNS TABLE (
  is_locked BOOLEAN,
  locked_by UUID,
  locked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_own_lock BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TRUE as is_locked,
    dl.locked_by,
    dl.locked_at,
    dl.expires_at,
    (dl.locked_by = auth.uid()) as is_own_lock
  FROM document_locks dl
  WHERE dl.document_type = p_document_type
    AND dl.document_id = p_document_id
    AND dl.expires_at > NOW();  -- Only return active locks
END;
$$;

COMMENT ON FUNCTION check_document_lock IS 'Check if a document is currently locked';

/*
  Force release expired locks (cleanup job)

  Should be run periodically by a cron job.
  Returns number of locks released.
*/

CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM document_locks
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_locks IS 'Remove all expired locks (for cron job)';

/*
  Force unlock a document (admin/emergency use)

  Allows any user to break a lock if needed.
  Use with caution - may cause conflicts.
*/

CREATE OR REPLACE FUNCTION force_unlock_document(
  p_document_type TEXT,
  p_document_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM document_locks
  WHERE document_type = p_document_type
    AND document_id = p_document_id;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION force_unlock_document IS 'Force release a lock (admin/emergency use)';
