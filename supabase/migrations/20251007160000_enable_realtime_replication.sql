/*
  # Enable Real-time Replication for Documents

  This migration configures PostgreSQL replication settings to enable
  Supabase Realtime for all document tables. This allows:

  - Live updates when documents change
  - Real-time collaboration features
  - Presence indicators (who's viewing/editing)
  - Instant sync across clients

  ## Changes

  1. Set REPLICA IDENTITY to FULL for all document tables
     - Required for Supabase Realtime to track all changes
     - Allows tracking of old and new values for all columns

  2. Enable replication for all document tables
     - Enables Postgres Changes feature in Supabase
     - Allows real-time subscriptions to document updates

  ## Affected Tables

  - patch_sheets
  - stage_plots
  - technical_riders
  - run_of_shows
  - production_schedules
  - pixel_maps
  - corporate_mic_plots
  - theater_mic_plots

  ## Additional Tables (for collaboration metadata)

  - document_locks (show who's editing in real-time)
  - document_activity (show recent changes)

  ## Performance Impact

  - REPLICA IDENTITY FULL increases WAL (Write-Ahead Log) size
  - Minimal performance impact on most workloads
  - Consider using REPLICA IDENTITY INDEX if performance issues arise
  - Monitor WAL size and adjust archiving/retention if needed

  ## Supabase Client Usage

  After this migration, you can subscribe to changes:

  ```typescript
  const subscription = supabase
    .channel('document-changes')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'patch_sheets',
        filter: `id=eq.${documentId}`
      },
      (payload) => {
        console.log('Document changed:', payload);
      }
    )
    .subscribe();
  ```
*/

-- =====================================================
-- SET REPLICA IDENTITY FOR DOCUMENT TABLES
-- =====================================================

-- Patch Sheets
ALTER TABLE patch_sheets REPLICA IDENTITY FULL;

-- Stage Plots
ALTER TABLE stage_plots REPLICA IDENTITY FULL;

-- Technical Riders
ALTER TABLE technical_riders REPLICA IDENTITY FULL;

-- Run of Shows
ALTER TABLE run_of_shows REPLICA IDENTITY FULL;

-- Production Schedules
ALTER TABLE production_schedules REPLICA IDENTITY FULL;

-- Pixel Maps
ALTER TABLE pixel_maps REPLICA IDENTITY FULL;

-- Corporate Mic Plots
ALTER TABLE corporate_mic_plots REPLICA IDENTITY FULL;

-- Theater Mic Plots
ALTER TABLE theater_mic_plots REPLICA IDENTITY FULL;

-- =====================================================
-- SET REPLICA IDENTITY FOR COLLABORATION TABLES
-- =====================================================

-- Document Locks (for presence indicators)
ALTER TABLE document_locks REPLICA IDENTITY FULL;

-- Document Activity (for activity feeds)
ALTER TABLE document_activity REPLICA IDENTITY FULL;

-- Pending Saves (for sync status)
ALTER TABLE pending_saves REPLICA IDENTITY FULL;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE patch_sheets IS 'Patch sheet documents - Real-time enabled';
COMMENT ON TABLE stage_plots IS 'Stage plot documents - Real-time enabled';
COMMENT ON TABLE technical_riders IS 'Technical rider documents - Real-time enabled';
COMMENT ON TABLE run_of_shows IS 'Run of show documents - Real-time enabled';
COMMENT ON TABLE production_schedules IS 'Production schedule documents - Real-time enabled';
COMMENT ON TABLE pixel_maps IS 'Pixel map documents - Real-time enabled';
COMMENT ON TABLE corporate_mic_plots IS 'Corporate mic plot documents - Real-time enabled';
COMMENT ON TABLE theater_mic_plots IS 'Theater mic plot documents - Real-time enabled';

-- =====================================================
-- NOTES FOR DEVELOPERS
-- =====================================================

/*
  ## Enabling Realtime in Supabase Dashboard

  After running this migration, you may need to enable Realtime for these
  tables in the Supabase Dashboard:

  1. Go to Database > Replication
  2. Enable replication for each table:
     - patch_sheets
     - stage_plots
     - technical_riders
     - run_of_shows
     - production_schedules
     - pixel_maps
     - corporate_mic_plots
     - theater_mic_plots
     - document_locks
     - document_activity
     - pending_saves

  3. Configure which events to publish:
     - INSERT: New documents created
     - UPDATE: Documents modified
     - DELETE: Documents removed (soft delete in app, but good to track)

  ## Real-time Subscription Patterns

  ### Subscribe to a specific document
  ```typescript
  supabase
    .channel(`document:${documentId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'patch_sheets',
      filter: `id=eq.${documentId}`
    }, handleUpdate)
    .subscribe();
  ```

  ### Subscribe to document locks (show who's editing)
  ```typescript
  supabase
    .channel(`locks:${documentId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'document_locks',
      filter: `document_id=eq.${documentId}`
    }, handleLockChange)
    .subscribe();
  ```

  ### Subscribe to user's documents
  ```typescript
  supabase
    .channel('my-documents')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'patch_sheets',
      filter: `user_id=eq.${userId}`
    }, handleChange)
    .subscribe();
  ```

  ## Performance Optimization

  If WAL size becomes an issue:

  1. Use REPLICA IDENTITY DEFAULT instead of FULL
     (only tracks primary key changes)

  2. Use REPLICA IDENTITY USING INDEX <index_name>
     (tracks specific columns via index)

  3. Increase WAL retention settings in Supabase dashboard

  4. Use filtered subscriptions to reduce payload size
*/
