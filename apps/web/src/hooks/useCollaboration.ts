/**
 * React hook for real-time collaboration.
 * Manages Broadcast and Presence channels for collaborative document editing.
 */

import { useEffect, useCallback, useState, useMemo } from "react";
import { setupCollaboration, cleanupCollaboration, broadcastUpdate } from "@/lib/collaboration";
import type {
  CollaborationChannels,
  PresenceUser,
  BroadcastPayload,
  DocumentType,
  ConnectionStatus,
} from "@/types/collaboration";

interface UseCollaborationOptions {
  /** Document ID to collaborate on */
  documentId: string;
  /** Document type */
  documentType: DocumentType;
  /** Current user ID */
  userId: string;
  /** Current user email */
  userEmail: string;
  /** Current user name (optional) */
  userName?: string;
  /** Callback when remote update is received */
  onRemoteUpdate?: (payload: BroadcastPayload) => void;
  /** Whether collaboration is enabled */
  enabled?: boolean;
}

interface UseCollaborationResult {
  /** Active users in the document */
  activeUsers: PresenceUser[];
  /** Connection status */
  status: ConnectionStatus;
  /** Broadcast an update to other users */
  broadcast: (payload: BroadcastPayload) => Promise<void>;
  /** Cleanup collaboration channels */
  cleanup: () => Promise<void>;
  /** Error message if connection failed */
  error: string | null;
  /** Whether collaboration is ready */
  isReady: boolean;
}

/**
 * Hook for real-time collaboration features.
 *
 * @example
 * ```tsx
 * const { activeUsers, broadcast, status } = useCollaboration({
 *   documentId: patchSheet.id,
 *   documentType: 'patch_sheets',
 *   userId: user.id,
 *   userEmail: user.email,
 *   userName: user.user_metadata?.name,
 *   onRemoteUpdate: (payload) => {
 *     if (payload.type === 'field_update') {
 *       setPatchSheet(prev => ({
 *         ...prev,
 *         [payload.field!]: payload.value
 *       }));
 *     }
 *   },
 * });
 * ```
 */
export const useCollaboration = ({
  documentId,
  documentType,
  userId,
  userEmail,
  userName,
  onRemoteUpdate,
  enabled = true,
}: UseCollaborationOptions): UseCollaborationResult => {
  const [channels, setChannels] = useState<CollaborationChannels | null>(null);
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);

  /**
   * Setup collaboration channels.
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let mounted = true;

    const setup = async () => {
      try {
        setStatus("connecting");

        const collaborationChannels = await setupCollaboration({
          documentId,
          documentType,
          user: {
            userId,
            email: userEmail,
            name: userName,
          },
          onRemoteUpdate: (payload) => {
            if (!mounted) return;
            onRemoteUpdate?.(payload);
          },
          onPresenceChange: (users) => {
            if (!mounted) return;
            // Filter out current user
            const otherUsers = users.filter((u) => u.userId !== userId);

            // Only update if users have actually changed (avoid unnecessary re-renders)
            setActiveUsers((prevUsers) => {
              // Compare user IDs to detect changes
              const prevUserIds = prevUsers
                .map((u) => u.userId)
                .sort()
                .join(",");
              const newUserIds = otherUsers
                .map((u) => u.userId)
                .sort()
                .join(",");

              // If same users, return previous reference
              if (prevUserIds === newUserIds) {
                return prevUsers;
              }

              return otherUsers;
            });
          },
          onStatusChange: (newStatus) => {
            if (!mounted) return;
            setStatus(newStatus);
          },
        });

        if (!mounted) {
          // Component unmounted during setup, cleanup
          await cleanupCollaboration(collaborationChannels);
          return;
        }

        setChannels(collaborationChannels);
        setStatus(collaborationChannels.status);
        setError(collaborationChannels.error || null);

        console.log(`[useCollaboration] Setup complete for ${documentType}/${documentId}`);
      } catch (err) {
        if (!mounted) return;

        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setStatus("error");
        setError(errorMessage);
        console.error("[useCollaboration] Setup failed:", err);
      }
    };

    setup();

    return () => {
      mounted = false;
      if (channels) {
        cleanupCollaboration(channels).catch((err) => {
          console.error("[useCollaboration] Cleanup error:", err);
        });
      }
    };

    // Note: onRemoteUpdate is intentionally not in deps to prevent re-subscription on callback changes
  }, [documentId, documentType, userId, userEmail, userName, enabled]);

  /**
   * Broadcast a message to other users.
   */
  const broadcast = useCallback(
    async (payload: BroadcastPayload) => {
      if (!channels?.broadcast) {
        console.warn("[useCollaboration] Cannot broadcast: not connected");
        return;
      }

      try {
        await broadcastUpdate(channels.broadcast, payload);
      } catch (err) {
        console.error("[useCollaboration] Broadcast failed:", err);
        throw err;
      }
    },
    [channels],
  );

  /**
   * Cleanup collaboration channels.
   */
  const cleanup = useCallback(async () => {
    if (channels) {
      await cleanupCollaboration(channels);
      setChannels(null);
      setActiveUsers([]);
      setStatus("disconnected");
    }
  }, [channels]);

  const isReady = status === "connected" && channels !== null;

  // Memoize activeUsers to ensure stable reference when the array content is the same
  const memoizedActiveUsers = useMemo(() => activeUsers, [activeUsers]);

  return {
    activeUsers: memoizedActiveUsers,
    status,
    broadcast,
    cleanup,
    error,
    isReady,
  };
};
