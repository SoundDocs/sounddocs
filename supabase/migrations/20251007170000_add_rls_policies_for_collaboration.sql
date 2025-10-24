/*
  # Add RLS Policies for Collaboration Tables

  This migration creates Row Level Security (RLS) policies for all
  collaboration-related tables:

  - History tables (version history)
  - document_activity (audit logs)
  - pending_saves (offline queue)
  - document_locks (editing locks)

  ## Security Model

  ### History Tables
  - Users can view history for documents they own
  - Users can view history for documents shared with them
  - No direct INSERT/UPDATE/DELETE (managed by triggers)

  ### Document Activity
  - Users can view activity for their own documents
  - Users can view activity for shared documents
  - System can INSERT activity (SECURITY DEFINER functions)

  ### Pending Saves
  - Users can only see/manage their own pending saves
  - Full CRUD access to own saves

  ### Document Locks
  - Users can see all locks (to show "currently editing")
  - Users can only create/update/delete their own locks
  - Expired locks visible for cleanup

  ## RLS Policies Follow SoundDocs Patterns

  - User ownership: auth.uid() = user_id
  - Shared access: JOIN with shared_links + user_claimed_shares
  - Authenticated users only (TO authenticated)
*/

-- =====================================================
-- ENABLE RLS ON ALL COLLABORATION TABLES
-- =====================================================

ALTER TABLE patch_sheet_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_plot_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_rider_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_of_show_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_schedule_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixel_map_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_mic_plot_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE theater_mic_plot_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE document_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_locks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HISTORY TABLE POLICIES
-- =====================================================

-- Patch Sheet History
CREATE POLICY "Users can view history for own patch sheets"
  ON patch_sheet_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patch_sheets ps
      WHERE ps.id = patch_sheet_history.patch_sheet_id
        AND ps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view history for shared patch sheets"
  ON patch_sheet_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patch_sheets ps
      JOIN shared_links sl ON sl.resource_id = ps.id AND sl.resource_type = 'patch_sheet'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE ps.id = patch_sheet_history.patch_sheet_id
        AND ucs.user_id = auth.uid()
    )
  );

-- Stage Plot History
CREATE POLICY "Users can view history for own stage plots"
  ON stage_plot_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stage_plots sp
      WHERE sp.id = stage_plot_history.stage_plot_id
        AND sp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view history for shared stage plots"
  ON stage_plot_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stage_plots sp
      JOIN shared_links sl ON sl.resource_id = sp.id AND sl.resource_type = 'stage_plot'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE sp.id = stage_plot_history.stage_plot_id
        AND ucs.user_id = auth.uid()
    )
  );

-- Technical Rider History
CREATE POLICY "Users can view history for own technical riders"
  ON technical_rider_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM technical_riders tr
      WHERE tr.id = technical_rider_history.technical_rider_id
        AND tr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view history for shared technical riders"
  ON technical_rider_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM technical_riders tr
      JOIN shared_links sl ON sl.resource_id = tr.id AND sl.resource_type = 'technical_rider'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE tr.id = technical_rider_history.technical_rider_id
        AND ucs.user_id = auth.uid()
    )
  );

-- Run of Show History
CREATE POLICY "Users can view history for own run of shows"
  ON run_of_show_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM run_of_shows ros
      WHERE ros.id = run_of_show_history.run_of_show_id
        AND ros.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view history for shared run of shows"
  ON run_of_show_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM run_of_shows ros
      JOIN shared_links sl ON sl.resource_id = ros.id AND sl.resource_type = 'run_of_show'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE ros.id = run_of_show_history.run_of_show_id
        AND ucs.user_id = auth.uid()
    )
  );

-- Production Schedule History
CREATE POLICY "Users can view history for own production schedules"
  ON production_schedule_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_schedules ps
      WHERE ps.id = production_schedule_history.production_schedule_id
        AND ps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view history for shared production schedules"
  ON production_schedule_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM production_schedules ps
      JOIN shared_links sl ON sl.resource_id = ps.id AND sl.resource_type = 'production_schedule'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE ps.id = production_schedule_history.production_schedule_id
        AND ucs.user_id = auth.uid()
    )
  );

-- Pixel Map History
CREATE POLICY "Users can view history for own pixel maps"
  ON pixel_map_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pixel_maps pm
      WHERE pm.id = pixel_map_history.pixel_map_id
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view history for shared pixel maps"
  ON pixel_map_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pixel_maps pm
      JOIN shared_links sl ON sl.resource_id = pm.id AND sl.resource_type = 'pixel_map'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE pm.id = pixel_map_history.pixel_map_id
        AND ucs.user_id = auth.uid()
    )
  );

-- Corporate Mic Plot History
CREATE POLICY "Users can view history for own corporate mic plots"
  ON corporate_mic_plot_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM corporate_mic_plots cmp
      WHERE cmp.id = corporate_mic_plot_history.corporate_mic_plot_id
        AND cmp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view history for shared corporate mic plots"
  ON corporate_mic_plot_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM corporate_mic_plots cmp
      JOIN shared_links sl ON sl.resource_id = cmp.id AND sl.resource_type = 'corporate_mic_plot'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE cmp.id = corporate_mic_plot_history.corporate_mic_plot_id
        AND ucs.user_id = auth.uid()
    )
  );

-- Theater Mic Plot History
CREATE POLICY "Users can view history for own theater mic plots"
  ON theater_mic_plot_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM theater_mic_plots tmp
      WHERE tmp.id = theater_mic_plot_history.theater_mic_plot_id
        AND tmp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view history for shared theater mic plots"
  ON theater_mic_plot_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM theater_mic_plots tmp
      JOIN shared_links sl ON sl.resource_id = tmp.id AND sl.resource_type = 'theater_mic_plot'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE tmp.id = theater_mic_plot_history.theater_mic_plot_id
        AND ucs.user_id = auth.uid()
    )
  );

-- =====================================================
-- DOCUMENT ACTIVITY POLICIES
-- =====================================================

/*
  Note: document_activity uses polymorphic design, so we need to check
  ownership across all document types dynamically. We'll create a
  helper function for this.
*/

CREATE OR REPLACE FUNCTION user_can_access_document(
  p_document_type TEXT,
  p_document_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns or has shared access to the document
  -- Each document type needs separate logic

  IF p_document_type = 'patch_sheet' THEN
    RETURN EXISTS (
      SELECT 1 FROM patch_sheets WHERE id = p_document_id AND user_id = p_user_id
      UNION
      SELECT 1 FROM patch_sheets ps
      JOIN shared_links sl ON sl.resource_id = ps.id AND sl.resource_type = 'patch_sheet'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE ps.id = p_document_id AND ucs.user_id = p_user_id
    );

  ELSIF p_document_type = 'stage_plot' THEN
    RETURN EXISTS (
      SELECT 1 FROM stage_plots WHERE id = p_document_id AND user_id = p_user_id
      UNION
      SELECT 1 FROM stage_plots sp
      JOIN shared_links sl ON sl.resource_id = sp.id AND sl.resource_type = 'stage_plot'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE sp.id = p_document_id AND ucs.user_id = p_user_id
    );

  ELSIF p_document_type = 'technical_rider' THEN
    RETURN EXISTS (
      SELECT 1 FROM technical_riders WHERE id = p_document_id AND user_id = p_user_id
      UNION
      SELECT 1 FROM technical_riders tr
      JOIN shared_links sl ON sl.resource_id = tr.id AND sl.resource_type = 'technical_rider'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE tr.id = p_document_id AND ucs.user_id = p_user_id
    );

  ELSIF p_document_type = 'run_of_show' THEN
    RETURN EXISTS (
      SELECT 1 FROM run_of_shows WHERE id = p_document_id AND user_id = p_user_id
      UNION
      SELECT 1 FROM run_of_shows ros
      JOIN shared_links sl ON sl.resource_id = ros.id AND sl.resource_type = 'run_of_show'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE ros.id = p_document_id AND ucs.user_id = p_user_id
    );

  ELSIF p_document_type = 'production_schedule' THEN
    RETURN EXISTS (
      SELECT 1 FROM production_schedules WHERE id = p_document_id AND user_id = p_user_id
      UNION
      SELECT 1 FROM production_schedules ps
      JOIN shared_links sl ON sl.resource_id = ps.id AND sl.resource_type = 'production_schedule'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE ps.id = p_document_id AND ucs.user_id = p_user_id
    );

  ELSIF p_document_type = 'pixel_map' THEN
    RETURN EXISTS (
      SELECT 1 FROM pixel_maps WHERE id = p_document_id AND user_id = p_user_id
      UNION
      SELECT 1 FROM pixel_maps pm
      JOIN shared_links sl ON sl.resource_id = pm.id AND sl.resource_type = 'pixel_map'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE pm.id = p_document_id AND ucs.user_id = p_user_id
    );

  ELSIF p_document_type = 'corporate_mic_plot' THEN
    RETURN EXISTS (
      SELECT 1 FROM corporate_mic_plots WHERE id = p_document_id AND user_id = p_user_id
      UNION
      SELECT 1 FROM corporate_mic_plots cmp
      JOIN shared_links sl ON sl.resource_id = cmp.id AND sl.resource_type = 'corporate_mic_plot'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE cmp.id = p_document_id AND ucs.user_id = p_user_id
    );

  ELSIF p_document_type = 'theater_mic_plot' THEN
    RETURN EXISTS (
      SELECT 1 FROM theater_mic_plots WHERE id = p_document_id AND user_id = p_user_id
      UNION
      SELECT 1 FROM theater_mic_plots tmp
      JOIN shared_links sl ON sl.resource_id = tmp.id AND sl.resource_type = 'theater_mic_plot'
      JOIN user_claimed_shares ucs ON ucs.shared_link_id = sl.id
      WHERE tmp.id = p_document_id AND ucs.user_id = p_user_id
    );

  ELSE
    -- Unknown document type
    RETURN FALSE;
  END IF;
END;
$$;

COMMENT ON FUNCTION user_can_access_document IS 'Check if user can access a document (owns or has shared access)';

-- Document Activity SELECT policy
CREATE POLICY "Users can view activity for accessible documents"
  ON document_activity FOR SELECT
  TO authenticated
  USING (
    user_can_access_document(document_type, document_id, auth.uid())
  );

-- =====================================================
-- PENDING SAVES POLICIES
-- =====================================================

CREATE POLICY "Users can view their own pending saves"
  ON pending_saves FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own pending saves"
  ON pending_saves FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pending saves"
  ON pending_saves FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own pending saves"
  ON pending_saves FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- DOCUMENT LOCKS POLICIES
-- =====================================================

-- Everyone can view locks (to show "currently editing" UI)
CREATE POLICY "Users can view all document locks"
  ON document_locks FOR SELECT
  TO authenticated
  USING (true);

-- Users can create locks for documents they can access
CREATE POLICY "Users can create locks for accessible documents"
  ON document_locks FOR INSERT
  TO authenticated
  WITH CHECK (
    locked_by = auth.uid()
    AND user_can_access_document(document_type, document_id, auth.uid())
  );

-- Users can update only their own locks
CREATE POLICY "Users can update their own locks"
  ON document_locks FOR UPDATE
  TO authenticated
  USING (locked_by = auth.uid())
  WITH CHECK (locked_by = auth.uid());

-- Users can delete only their own locks
CREATE POLICY "Users can delete their own locks"
  ON document_locks FOR DELETE
  TO authenticated
  USING (locked_by = auth.uid());

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view history for own patch sheets" ON patch_sheet_history IS 'Users can view version history for patch sheets they own';
COMMENT ON POLICY "Users can view history for shared patch sheets" ON patch_sheet_history IS 'Users can view version history for patch sheets shared with them';

COMMENT ON POLICY "Users can view activity for accessible documents" ON document_activity IS 'Users can view activity logs for documents they own or have shared access to';

COMMENT ON POLICY "Users can view their own pending saves" ON pending_saves IS 'Users can view their own queued saves';
COMMENT ON POLICY "Users can view all document locks" ON document_locks IS 'All users can see locks to show "currently editing" indicators';
