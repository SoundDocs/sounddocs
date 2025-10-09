/**
 * Zustand store for collaborative document editing.
 * Manages real-time collaboration, presence tracking, and auto-save state.
 */

import { create } from "zustand";
import {
  setupCollaboration,
  cleanupCollaboration,
  broadcastUpdate,
  updatePresence,
  handleReconnection,
} from "@/lib/collaboration";
import { saveUpdate, handleOfflineSave, isOnline, debounce } from "@/lib/autoSave";
import { getAllQueuedUpdates, dequeueUpdate, pruneStaleItems } from "@/lib/offlineQueue";
import type {
  CollaborationChannels,
  PresenceUser,
  BroadcastPayload,
  DocumentUpdate,
  SaveStatus,
  DocumentType,
  AutoSaveConfig,
  SaveResult,
} from "@/types/collaboration";

interface CollaborativeDocState {
  // Connection state
  channels: CollaborationChannels | null;
  connectionStatus: CollaborationChannels["status"];
  connectionError: string | null;

  // Document state
  documentId: string | null;
  documentType: DocumentType | null;
  documentVersion: number;
  documentData: Record<string, any>;

  // Presence tracking
  activeUsers: PresenceUser[];
  currentUserId: string | null;

  // Save state
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  pendingUpdates: DocumentUpdate[];
  saveError: string | null;

  // Auto-save configuration
  autoSaveConfig: AutoSaveConfig;

  // Actions
  setupCollaboration: (
    documentId: string,
    documentType: DocumentType,
    userId: string,
    userEmail: string,
    userName?: string,
  ) => Promise<void>;
  cleanup: () => Promise<void>;
  updateField: <T = any>(field: string, value: T, userId: string) => Promise<void>;
  updateCursor: (field: string, position: number) => Promise<void>;
  forceSave: () => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
  handleRemoteUpdate: (payload: BroadcastPayload) => void;
  handlePresenceChange: (users: PresenceUser[]) => void;
  setAutoSaveConfig: (config: Partial<AutoSaveConfig>) => void;
  reconnect: () => Promise<void>;
}

/**
 * Collaborative document store.
 * Use this store for any document that needs real-time collaboration.
 */
export const useCollaborativeDocStore = create<CollaborativeDocState>((set, get) => {
  // Debounced save function - created once and reused
  let debouncedSave: ReturnType<typeof debounce> | null = null;

  return {
    // Initial state
    channels: null,
    connectionStatus: "disconnected",
    connectionError: null,
    documentId: null,
    documentType: null,
    documentVersion: 0,
    documentData: {},
    activeUsers: [],
    currentUserId: null,
    saveStatus: "idle",
    lastSavedAt: null,
    pendingUpdates: [],
    saveError: null,
    autoSaveConfig: {
      debounceMs: 1500,
      enabled: true,
      maxRetries: 3,
      retryDelayMs: 1000,
      enableVersioning: false,
      versionIntervalMs: 300000,
    },

    /**
     * Setup collaboration for a document.
     */
    setupCollaboration: async (documentId, documentType, userId, userEmail, userName) => {
      const state = get();

      // Cleanup existing channels if any
      if (state.channels) {
        await get().cleanup();
      }

      set({
        documentId,
        documentType,
        currentUserId: userId,
        connectionStatus: "connecting",
        connectionError: null,
      });

      try {
        const channels = await setupCollaboration({
          documentId,
          documentType,
          user: {
            userId,
            email: userEmail,
            name: userName,
          },
          onRemoteUpdate: (payload) => {
            get().handleRemoteUpdate(payload);
          },
          onPresenceChange: (users) => {
            get().handlePresenceChange(users);
          },
          onStatusChange: (status) => {
            set({ connectionStatus: status });
          },
        });

        set({
          channels,
          connectionStatus: channels.status,
          connectionError: channels.error,
        });

        // Sync offline queue after successful connection
        await get().syncOfflineQueue();

        console.log(`[CollaborativeDocStore] Setup complete for ${documentType}/${documentId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        set({
          connectionStatus: "error",
          connectionError: errorMessage,
        });
        console.error("[CollaborativeDocStore] Setup failed:", error);
      }
    },

    /**
     * Cleanup collaboration channels and reset state.
     */
    cleanup: async () => {
      const state = get();

      // Cancel any pending debounced saves
      if (debouncedSave) {
        debouncedSave.cancel();
        debouncedSave = null;
      }

      if (state.channels) {
        await cleanupCollaboration(state.channels);
      }

      set({
        channels: null,
        connectionStatus: "disconnected",
        connectionError: null,
        documentId: null,
        documentType: null,
        activeUsers: [],
        saveStatus: "idle",
        pendingUpdates: [],
      });

      console.log("[CollaborativeDocStore] Cleanup complete");
    },

    /**
     * Update a field with optimistic UI and auto-save.
     */
    updateField: async (field, value, userId) => {
      const state = get();
      const { documentId, documentType, channels, autoSaveConfig } = state;

      if (!documentId || !documentType) {
        console.error("[CollaborativeDocStore] Cannot update: document not initialized");
        return;
      }

      // Optimistic update
      set((state) => ({
        documentData: { ...state.documentData, [field]: value },
        saveStatus: "typing",
        saveError: null,
      }));

      // Create update object
      const update: DocumentUpdate = {
        id: crypto.randomUUID(),
        documentId,
        documentType,
        field,
        value,
        previousValue: state.documentData[field],
        userId,
        timestamp: new Date().toISOString(),
        version: state.documentVersion,
        persisted: false,
      };

      // Add to pending updates
      set((state) => ({
        pendingUpdates: [...state.pendingUpdates, update],
      }));

      // Broadcast to other users
      if (channels?.broadcast) {
        try {
          await broadcastUpdate(channels.broadcast, {
            type: "field_update",
            userId,
            field,
            value,
            metadata: {
              timestamp: update.timestamp,
            },
          });
        } catch (error) {
          console.error("[CollaborativeDocStore] Failed to broadcast update:", error);
        }
      }

      // Setup debounced save if needed
      if (autoSaveConfig.enabled && !debouncedSave) {
        debouncedSave = debounce(async () => {
          await get().forceSave();
        }, autoSaveConfig.debounceMs || 1500);
      }

      // Trigger debounced save
      if (debouncedSave) {
        debouncedSave();
      }
    },

    /**
     * Update cursor position for presence tracking.
     */
    updateCursor: async (field, position) => {
      const state = get();
      const { channels } = state;

      if (channels?.presence) {
        try {
          await updatePresence(channels.presence, {
            editingField: field,
            cursorPosition: position,
          });
        } catch (error) {
          console.error("[CollaborativeDocStore] Failed to update cursor:", error);
        }
      }
    },

    /**
     * Force immediate save of pending updates.
     */
    forceSave: async () => {
      const state = get();
      const { pendingUpdates } = state;

      if (pendingUpdates.length === 0) {
        return;
      }

      set({ saveStatus: "saving", saveError: null });

      // Check if online
      if (!isOnline()) {
        console.warn("[CollaborativeDocStore] Offline - queueing updates");

        // Queue all pending updates
        for (const update of pendingUpdates) {
          try {
            await handleOfflineSave(update);
          } catch (error) {
            console.error("[CollaborativeDocStore] Failed to queue update:", error);
          }
        }

        set({
          saveStatus: "offline",
          pendingUpdates: [],
        });
        return;
      }

      // Save updates
      const results: SaveResult[] = [];
      for (const update of pendingUpdates) {
        const result = await saveUpdate(update);
        results.push(result);
      }

      // Check if all saves succeeded
      const allSucceeded = results.every((r) => r.success);
      const anyFailed = results.some((r) => !r.success);

      if (allSucceeded) {
        set({
          saveStatus: "saved",
          lastSavedAt: new Date().toISOString(),
          pendingUpdates: [],
          saveError: null,
        });

        // Reset to idle after a short delay
        setTimeout(() => {
          if (get().saveStatus === "saved") {
            set({ saveStatus: "idle" });
          }
        }, 2000);
      } else if (anyFailed) {
        const failedResults = results.filter((r) => !r.success);
        const errorMessage = failedResults[0]?.error || "Failed to save some updates";

        // If conflict detected, handle it
        if (failedResults.some((r) => r.conflict)) {
          console.warn("[CollaborativeDocStore] Version conflict detected");
          // In production, you'd want to show a UI to resolve conflicts
        }

        // Keep failed updates in pending
        const failedUpdates = pendingUpdates.filter((_, i) => !results[i]?.success);

        set({
          saveStatus: "error",
          saveError: errorMessage,
          pendingUpdates: failedUpdates,
        });
      }
    },

    /**
     * Sync offline queue when connection is restored.
     */
    syncOfflineQueue: async () => {
      const state = get();
      const { documentId } = state;

      if (!documentId) {
        return;
      }

      try {
        // Prune stale items first
        await pruneStaleItems();

        // Get queued updates for this document
        const queuedItems = await getAllQueuedUpdates();
        const relevantItems = queuedItems.filter((item) => item.update.documentId === documentId);

        if (relevantItems.length === 0) {
          return;
        }

        console.log(`[CollaborativeDocStore] Syncing ${relevantItems.length} offline updates`);

        // Process each queued item
        for (const item of relevantItems) {
          const result = await saveUpdate(item.update);

          if (result.success) {
            await dequeueUpdate(item.id);
          } else {
            console.error(
              `[CollaborativeDocStore] Failed to sync queued update ${item.id}:`,
              result.error,
            );
          }
        }

        console.log("[CollaborativeDocStore] Offline queue sync complete");
      } catch (error) {
        console.error("[CollaborativeDocStore] Failed to sync offline queue:", error);
      }
    },

    /**
     * Handle remote updates from other users.
     */
    handleRemoteUpdate: (payload) => {
      const state = get();
      const { field, value, userId } = payload;

      // Ignore updates from current user (shouldn't happen, but safety check)
      if (userId === state.currentUserId) {
        return;
      }

      if (payload.type === "field_update" && field !== undefined) {
        console.log(`[CollaborativeDocStore] Received remote update for ${field}`);

        // Apply remote update
        set((state) => ({
          documentData: { ...state.documentData, [field]: value },
        }));
      } else if (payload.type === "sync_request") {
        console.log("[CollaborativeDocStore] Received sync request");
        // Another user is requesting sync - broadcast current state
        // In production, you'd broadcast the current document state here
      }
    },

    /**
     * Handle presence changes.
     */
    handlePresenceChange: (users) => {
      const state = get();

      // Filter out current user
      const otherUsers = users.filter((u) => u.userId !== state.currentUserId);

      set({ activeUsers: otherUsers });

      console.log(`[CollaborativeDocStore] Active users: ${otherUsers.length}`);
    },

    /**
     * Update auto-save configuration.
     */
    setAutoSaveConfig: (config) => {
      set((state) => ({
        autoSaveConfig: { ...state.autoSaveConfig, ...config },
      }));

      // Recreate debounced save with new config
      if (debouncedSave) {
        debouncedSave.cancel();
      }

      const newConfig = { ...get().autoSaveConfig, ...config };
      if (newConfig.enabled) {
        debouncedSave = debounce(async () => {
          await get().forceSave();
        }, newConfig.debounceMs || 1500);
      }
    },

    /**
     * Reconnect after network disruption.
     */
    reconnect: async () => {
      const state = get();
      const { channels, currentUserId, activeUsers } = state;
      const { documentId, documentType } = state;

      if (!channels || !documentId || !documentType || !currentUserId) {
        console.error("[CollaborativeDocStore] Cannot reconnect: missing state");
        return;
      }

      // Get current user info from active users (or reconstruct)
      const currentUserInfo = activeUsers.find((u) => u.userId === currentUserId) || {
        userId: currentUserId,
        email: "",
        name: "",
      };

      set({ connectionStatus: "connecting" });

      try {
        const newChannels = await handleReconnection(channels, {
          documentId,
          documentType,
          user: {
            userId: currentUserId,
            email: currentUserInfo.email,
            name: currentUserInfo.name,
          },
          onRemoteUpdate: (payload) => {
            get().handleRemoteUpdate(payload);
          },
          onPresenceChange: (users) => {
            get().handlePresenceChange(users);
          },
          onStatusChange: (status) => {
            set({ connectionStatus: status });
          },
        });

        set({
          channels: newChannels,
          connectionStatus: newChannels.status,
          connectionError: newChannels.error,
        });

        // Sync offline queue after reconnection
        await get().syncOfflineQueue();

        console.log("[CollaborativeDocStore] Reconnection successful");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        set({
          connectionStatus: "error",
          connectionError: errorMessage,
        });
        console.error("[CollaborativeDocStore] Reconnection failed:", error);
      }
    },
  };
});

/**
 * Selector hooks for specific state slices (optimized re-renders).
 */
export const useConnectionStatus = () =>
  useCollaborativeDocStore((state) => state.connectionStatus);

export const useSaveStatus = () => useCollaborativeDocStore((state) => state.saveStatus);

export const useLastSavedAt = () => useCollaborativeDocStore((state) => state.lastSavedAt);

export const useActiveUsers = () => useCollaborativeDocStore((state) => state.activeUsers);

export const useDocumentData = () => useCollaborativeDocStore((state) => state.documentData);

export const usePendingUpdates = () => useCollaborativeDocStore((state) => state.pendingUpdates);
