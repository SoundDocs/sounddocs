/**
 * React hook for presence tracking in collaborative editing.
 * Tracks cursor position, editing field, and user activity.
 */

import { useEffect, useCallback, useRef } from "react";
import { updatePresence } from "@/lib/collaboration";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { PresenceUser } from "@/types/collaboration";

interface UsePresenceOptions {
  /** Presence channel from useCollaboration */
  channel: RealtimeChannel | null;
  /** Current user ID */
  userId: string;
  /** Throttle interval for cursor updates (ms) */
  throttleMs?: number;
}

interface PresenceState {
  /** Field currently being edited */
  editingField: string | null;
  /** Cursor position in the field */
  cursorPosition: number | null;
}

interface UsePresenceResult {
  /** Update editing field */
  setEditingField: (field: string | null) => void;
  /** Update cursor position */
  setCursorPosition: (field: string, position: number) => void;
  /** Update both field and cursor */
  updatePresenceState: (field: string | null, position: number | null) => void;
  /** Current presence state */
  presenceState: PresenceState;
}

/**
 * Hook for tracking user presence (cursor position, editing field).
 *
 * @example
 * ```tsx
 * const { channel } = useCollaboration({ ... });
 * const { setEditingField, setCursorPosition } = usePresence({
 *   channel,
 *   userId: user.id,
 *   throttleMs: 100,
 * });
 *
 * // In input handler
 * const handleFocus = (field: string) => {
 *   setEditingField(field);
 * };
 *
 * const handleSelectionChange = (field: string, position: number) => {
 *   setCursorPosition(field, position);
 * };
 * ```
 */
export const usePresence = ({
  channel,
  throttleMs = 100,
}: UsePresenceOptions): UsePresenceResult => {
  const presenceStateRef = useRef<PresenceState>({
    editingField: null,
    cursorPosition: null,
  });

  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<PresenceState | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Send presence update to channel.
   */
  const sendPresenceUpdate = useCallback(
    async (updates: Partial<Omit<PresenceUser, "userId">>) => {
      if (!channel) {
        return;
      }

      try {
        await updatePresence(channel, updates);
      } catch (error) {
        console.error("[usePresence] Failed to update presence:", error);
      }
    },
    [channel],
  );

  /**
   * Throttled presence update.
   */
  const throttledUpdate = useCallback(
    (field: string | null, position: number | null) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;

      // Update internal state immediately
      presenceStateRef.current = {
        editingField: field,
        cursorPosition: position,
      };

      // If throttle period has passed, send update immediately
      if (timeSinceLastUpdate >= throttleMs) {
        lastUpdateRef.current = now;
        pendingUpdateRef.current = null;

        sendPresenceUpdate({
          editingField: field || undefined,
          cursorPosition: position || undefined,
        });
      } else {
        // Store pending update and schedule it
        pendingUpdateRef.current = {
          editingField: field,
          cursorPosition: position,
        };

        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
          if (pendingUpdateRef.current) {
            lastUpdateRef.current = Date.now();
            sendPresenceUpdate({
              editingField: pendingUpdateRef.current.editingField || undefined,
              cursorPosition: pendingUpdateRef.current.cursorPosition || undefined,
            });
            pendingUpdateRef.current = null;
          }
        }, throttleMs - timeSinceLastUpdate);
      }
    },
    [throttleMs, sendPresenceUpdate],
  );

  /**
   * Set the field currently being edited.
   */
  const setEditingField = useCallback(
    (field: string | null) => {
      throttledUpdate(field, presenceStateRef.current.cursorPosition);
    },
    [throttledUpdate],
  );

  /**
   * Set cursor position in a field.
   */
  const setCursorPosition = useCallback(
    (field: string, position: number) => {
      throttledUpdate(field, position);
    },
    [throttledUpdate],
  );

  /**
   * Update both field and cursor position.
   */
  const updatePresenceState = useCallback(
    (field: string | null, position: number | null) => {
      throttledUpdate(field, position);
    },
    [throttledUpdate],
  );

  /**
   * Clear presence when field is blurred.
   */
  useEffect(() => {
    const handleBlur = () => {
      // Clear editing field when window loses focus
      throttledUpdate(null, null);
    };

    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [throttledUpdate]);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Send final presence update clearing state
      if (channel) {
        updatePresence(channel, {
          editingField: undefined,
          cursorPosition: undefined,
        }).catch((err) => {
          console.error("[usePresence] Cleanup presence update failed:", err);
        });
      }
    };
  }, [channel]);

  return {
    setEditingField,
    setCursorPosition,
    updatePresenceState,
    presenceState: presenceStateRef.current,
  };
};

/**
 * Helper hook to track cursor position in a text input/textarea.
 *
 * @example
 * ```tsx
 * const inputRef = useRef<HTMLInputElement>(null);
 * const { setCursorPosition } = usePresence({ ... });
 *
 * useInputCursorTracking(inputRef, 'field_name', setCursorPosition);
 * ```
 */
export const useInputCursorTracking = (
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>,
  fieldName: string,
  onCursorMove: (field: string, position: number) => void,
): void => {
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleSelectionChange = () => {
      const position = input.selectionStart || 0;
      onCursorMove(fieldName, position);
    };

    // Track cursor position changes
    input.addEventListener("keyup", handleSelectionChange);
    input.addEventListener("mouseup", handleSelectionChange);
    input.addEventListener("focus", handleSelectionChange);

    return () => {
      input.removeEventListener("keyup", handleSelectionChange);
      input.removeEventListener("mouseup", handleSelectionChange);
      input.removeEventListener("focus", handleSelectionChange);
    };
  }, [inputRef, fieldName, onCursorMove]);
};
