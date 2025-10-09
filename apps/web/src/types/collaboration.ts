/**
 * TypeScript type definitions for real-time collaboration and auto-save features.
 * These types support Google Docs-style collaboration with presence tracking,
 * version history, and offline queue management.
 */

import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Represents the current save status of a document.
 * - 'idle': No changes pending
 * - 'typing': User is actively making changes
 * - 'saving': Changes are being persisted to the database
 * - 'saved': Changes have been successfully saved
 * - 'error': An error occurred during save
 * - 'offline': Network is unavailable, changes queued locally
 */
export type SaveStatus = "idle" | "typing" | "saving" | "saved" | "error" | "offline";

/**
 * Represents a user's presence state in a collaborative session.
 */
export interface PresenceUser {
  /** Unique user ID from Supabase Auth */
  userId: string;
  /** User's email address */
  email: string;
  /** User's display name (if available) */
  name?: string;
  /** Hex color code for user's cursor/highlight (e.g., '#3B82F6') */
  color: string;
  /** Field currently being edited by the user */
  editingField?: string;
  /** Cursor position within the field (for text inputs) */
  cursorPosition?: number;
  /** Timestamp of last activity (ISO 8601) */
  lastActive: string;
}

/**
 * Payload structure for broadcast messages sent via Supabase Realtime.
 */
export interface BroadcastPayload<T = any> {
  /** Type of broadcast event */
  type: "field_update" | "cursor_move" | "selection_change" | "sync_request";
  /** ID of the user sending the broadcast */
  userId: string;
  /** Field name being updated */
  field?: string;
  /** New value for the field */
  value?: T;
  /** Additional metadata for the update */
  metadata?: {
    /** Cursor position after the update */
    cursorPosition?: number;
    /** Selected range (for text selections) */
    selectionRange?: { start: number; end: number };
    /** Timestamp of the change */
    timestamp: string;
  };
}

/**
 * Represents a single document update for optimistic UI and conflict resolution.
 */
export interface DocumentUpdate<T = any> {
  /** Unique ID for this update (UUID) */
  id: string;
  /** ID of the document being updated */
  documentId: string;
  /** Type of the document (e.g., 'patch_sheets', 'stage_plots') */
  documentType: DocumentType;
  /** Field being updated */
  field: string;
  /** New value */
  value: T;
  /** Previous value (for rollback) */
  previousValue?: T;
  /** User who made the change */
  userId: string;
  /** Timestamp of the update (ISO 8601) */
  timestamp: string;
  /** Version number for optimistic concurrency control */
  version: number;
  /** Whether this update has been persisted */
  persisted: boolean;
  /** Whether this update is pending retry */
  retrying?: boolean;
  /** Number of retry attempts */
  retryCount?: number;
  /** Optional share code for shared edit mode (bypasses RLS) */
  shareCode?: string;
}

/**
 * Supported document types for collaboration.
 */
export type DocumentType =
  | "patch_sheets"
  | "stage_plots"
  | "technical_riders"
  | "production_schedules"
  | "run_of_shows"
  | "pixel_maps"
  | "corporate_mic_plots"
  | "theater_mic_plots"
  | "comms_planners"
  | "input_lists"
  | "output_lists"
  | "rf_coordinators";

/**
 * Conflict resolution strategy for handling concurrent edits.
 */
export type ConflictResolution = "local_wins" | "remote_wins" | "merge" | "manual";

/**
 * Represents a conflict between local and remote changes.
 */
export interface DocumentConflict<T = any> {
  /** Field where the conflict occurred */
  field: string;
  /** Local (unsynced) value */
  localValue: T;
  /** Remote (server) value */
  remoteValue: T;
  /** Timestamp of local change */
  localTimestamp: string;
  /** Timestamp of remote change */
  remoteTimestamp: string;
  /** Suggested resolution strategy */
  resolution: ConflictResolution;
}

/**
 * Version history entry for a document.
 */
export interface VersionHistory {
  /** Unique version ID */
  id: string;
  /** Document ID this version belongs to */
  documentId: string;
  /** Document type */
  documentType: DocumentType;
  /** User who created this version */
  userId: string;
  /** User's email */
  userEmail: string;
  /** Snapshot of document state at this version */
  snapshot: Record<string, any>;
  /** Fields changed in this version */
  changedFields: string[];
  /** Timestamp of version creation (ISO 8601) */
  createdAt: string;
  /** Optional description of changes */
  description?: string;
}

/**
 * Configuration for auto-save behavior.
 */
export interface AutoSaveConfig {
  /** Debounce delay in milliseconds (default: 1500) */
  debounceMs?: number;
  /** Enable auto-save (default: true) */
  enabled?: boolean;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial retry delay in milliseconds (default: 1000) */
  retryDelayMs?: number;
  /** Enable version history snapshots (default: false) */
  enableVersioning?: boolean;
  /** Minimum time between version snapshots in milliseconds (default: 300000 = 5 minutes) */
  versionIntervalMs?: number;
}

/**
 * Result of a save operation.
 */
export interface SaveResult {
  /** Whether the save was successful */
  success: boolean;
  /** Error message if save failed */
  error?: string;
  /** Version number after save */
  version?: number;
  /** Timestamp of save */
  timestamp?: string;
  /** Whether a conflict was detected */
  conflict?: DocumentConflict;
}

/**
 * Item queued for offline persistence.
 */
export interface QueuedSave {
  /** Unique queue item ID */
  id: string;
  /** Document update to be saved */
  update: DocumentUpdate;
  /** Timestamp when queued (ISO 8601) */
  queuedAt: string;
  /** Number of save attempts */
  attempts: number;
  /** Last error message (if any) */
  lastError?: string;
  /** Timestamp of last attempt */
  lastAttempt?: string;
}

/**
 * Connection status for Supabase Realtime.
 */
export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

/**
 * Collaboration channel manager state.
 */
export interface CollaborationChannels {
  /** Broadcast channel for real-time updates */
  broadcast: RealtimeChannel | null;
  /** Presence channel for user tracking */
  presence: RealtimeChannel | null;
  /** Connection status */
  status: ConnectionStatus;
  /** Error message if connection failed */
  error?: string;
}

/**
 * Options for setting up collaboration channels.
 */
export interface CollaborationSetupOptions {
  /** Document ID to collaborate on */
  documentId: string;
  /** Document type */
  documentType: DocumentType;
  /** Current user information */
  user: {
    userId: string;
    email: string;
    name?: string;
  };
  /** Callback when remote update is received */
  onRemoteUpdate?: (payload: BroadcastPayload) => void;
  /** Callback when presence changes */
  onPresenceChange?: (users: PresenceUser[]) => void;
  /** Callback when connection status changes */
  onStatusChange?: (status: ConnectionStatus) => void;
}

/**
 * Document snapshot for version comparison.
 */
export interface DocumentSnapshot {
  /** Document ID */
  documentId: string;
  /** Document type */
  documentType: DocumentType;
  /** Complete document data */
  data: Record<string, any>;
  /** Version number */
  version: number;
  /** Snapshot timestamp */
  timestamp: string;
}
