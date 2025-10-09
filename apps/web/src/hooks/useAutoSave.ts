/**
 * React hook for auto-save functionality with debouncing and offline support.
 * Provides a simple interface for auto-saving document changes.
 */

import { useEffect, useRef, useCallback } from "react";
import { debounce, saveUpdate, handleOfflineSave, isOnline } from "@/lib/autoSave";
import type {
  DocumentUpdate,
  SaveStatus,
  AutoSaveConfig,
  DocumentType,
} from "@/types/collaboration";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface UseAutoSaveOptions<T = any> extends AutoSaveConfig {
  /** Document ID to save */
  documentId: string;
  /** Document type */
  documentType: DocumentType;
  /** User ID making the changes */
  userId: string;
  /** Document data to save */
  data: T;
  /** Callback when save completes */
  onSaveComplete?: (success: boolean, error?: string, changedFields?: string[]) => void;
  /** Callback before save */
  onBeforeSave?: (data: T) => boolean | Promise<boolean>;
  /** Optional share code for shared edit mode (bypasses RLS) */
  shareCode?: string;
}

interface UseAutoSaveResult {
  /** Current save status */
  saveStatus: SaveStatus;
  /** Timestamp of last successful save */
  lastSavedAt: string | null;
  /** Force immediate save */
  forceSave: () => Promise<void>;
  /** Error message if save failed */
  error: string | null;
  /** Whether auto-save is enabled */
  isEnabled: boolean;
  /** Enable/disable auto-save */
  setEnabled: (enabled: boolean) => void;
  /** Mark the next state change as a remote update to prevent triggering autosave */
  markAsRemoteUpdate: () => void;
}

/**
 * Hook for auto-saving document changes with debouncing.
 *
 * @example
 * ```tsx
 * const { saveStatus, lastSavedAt, forceSave } = useAutoSave({
 *   documentId: patchSheet.id,
 *   documentType: 'patch_sheets',
 *   userId: user.id,
 *   data: patchSheet,
 *   debounceMs: 2000,
 * });
 * ```
 */
export const useAutoSave = <T extends Record<string, any>>({
  documentId,
  documentType,
  userId,
  data,
  onSaveComplete,
  onBeforeSave,
  debounceMs = 1500,
  enabled: initialEnabled = true,
  shareCode,
}: UseAutoSaveOptions<T>): UseAutoSaveResult => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setEnabled] = useState(initialEnabled);

  const previousDataRef = useRef<T>(data);
  const versionRef = useRef(0);
  const debouncedSaveRef = useRef<ReturnType<typeof debounce> | null>(null);
  const isMountedRef = useRef(true);
  const isInitialMountRef = useRef(true);
  const versionLoadedRef = useRef(false);
  // Track stringified data to prevent effect from running on reference-only changes
  const dataStringRef = useRef<string>(JSON.stringify(data));
  // Track when we're applying a remote update to skip change detection
  // Use a counter instead of boolean to handle React Strict Mode double-renders
  const remoteUpdateCounterRef = useRef(0);

  /**
   * Load the current version from the database when the hook initializes.
   * This ensures we start with the correct version number for optimistic concurrency control.
   */
  useEffect(() => {
    const loadVersion = async () => {
      // Skip if already loaded
      if (versionLoadedRef.current) return;

      // CRITICAL: Skip if documentId is empty or invalid
      // This prevents "invalid input syntax for type uuid" errors on initial mount
      if (!documentId || documentId.trim() === "") {
        console.log("[useAutoSave] Skipping version load - documentId is empty");
        return;
      }

      // Basic UUID validation (36 characters with hyphens)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(documentId)) {
        console.warn(
          "[useAutoSave] Skipping version load - documentId is not a valid UUID:",
          documentId,
        );
        return;
      }

      try {
        console.log("[useAutoSave] Loading current version for", documentType, documentId);
        const { data: doc, error } = await supabase
          .from(documentType)
          .select("version")
          .eq("id", documentId)
          .single();

        if (error) {
          console.error("[useAutoSave] Failed to load version:", error);
          // Keep default version of 0 if fetch fails
          return;
        }

        if (doc && doc.version !== undefined) {
          versionRef.current = doc.version;
          console.log("[useAutoSave] Loaded version:", doc.version);
        } else {
          console.log("[useAutoSave] No version found, using default 0");
        }

        versionLoadedRef.current = true;
      } catch (err) {
        console.error("[useAutoSave] Error loading version:", err);
      }
    };

    loadVersion();
  }, [documentId, documentType]);

  /**
   * Sync the enabled prop with internal state when it changes.
   */
  useEffect(() => {
    console.log("[useAutoSave] Enabled prop changed:", initialEnabled);
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  /**
   * Perform the actual save operation.
   */
  const performSave = useCallback(
    async (dataToSave: T) => {
      if (!isMountedRef.current) return;

      console.log("[useAutoSave] performSave called", {
        documentId: (dataToSave as any)?.id,
        mounted: isMountedRef.current,
      });

      // Call onBeforeSave hook if provided
      if (onBeforeSave) {
        const shouldContinue = await onBeforeSave(dataToSave);
        if (!shouldContinue) {
          console.log("[useAutoSave] Save cancelled by onBeforeSave");
          setSaveStatus("idle");
          return;
        }
      }

      console.log("[useAutoSave] Setting status to 'saving'");
      setSaveStatus("saving");
      setError(null);

      try {
        // Create updates for all changed fields
        const updates: DocumentUpdate[] = [];
        const changedFields = Object.keys(dataToSave).filter(
          (key) => dataToSave[key] !== previousDataRef.current[key],
        );

        console.log("[useAutoSave] Creating updates for changed fields:", changedFields);

        for (const field of changedFields) {
          updates.push({
            id: crypto.randomUUID(),
            documentId,
            documentType,
            field,
            value: dataToSave[field],
            previousValue: previousDataRef.current[field],
            userId,
            timestamp: new Date().toISOString(),
            version: versionRef.current,
            persisted: false,
            shareCode, // Pass shareCode to each update
          });
        }

        console.log("[useAutoSave] Created", updates.length, "updates");

        // If offline, queue the updates
        if (!isOnline()) {
          console.log("[useAutoSave] Offline - queueing updates");
          for (const update of updates) {
            await handleOfflineSave(update);
          }
          setSaveStatus("offline");
          onSaveComplete?.(true);
          return;
        }

        console.log("[useAutoSave] Saving updates to database...");

        // Save each update
        let allSuccess = true;
        let lastError = "";

        for (const update of updates) {
          console.log("[useAutoSave] Saving update for field:", update.field, {
            version: update.version,
            documentId: update.documentId,
          });
          const result = await saveUpdate(update);
          console.log("[useAutoSave] Save result:", result);

          // If successful, update our local version to match what the database returned
          if (result.success && result.version !== undefined) {
            console.log(
              "[useAutoSave] Updating local version from",
              versionRef.current,
              "to",
              result.version,
            );
            versionRef.current = result.version;
          }

          if (!result.success) {
            allSuccess = false;
            lastError = result.error || "Unknown error";
            break;
          }
        }

        if (allSuccess) {
          if (!isMountedRef.current) return;

          const now = new Date().toISOString();
          setSaveStatus("saved");
          setLastSavedAt(now);
          setError(null);
          previousDataRef.current = dataToSave;
          // Note: versionRef is already updated in the loop above when we get the result

          // Call completion callback with list of changed fields
          const changedFields = updates.map((u) => u.field);
          onSaveComplete?.(true, undefined, changedFields);

          // Reset to idle after a delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setSaveStatus("idle");
            }
          }, 2000);
        } else {
          if (!isMountedRef.current) return;

          setSaveStatus("error");
          setError(lastError);
          onSaveComplete?.(false, lastError);
        }
      } catch (err) {
        if (!isMountedRef.current) return;

        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setSaveStatus("error");
        setError(errorMessage);
        onSaveComplete?.(false, errorMessage);
      }
    },
    [documentId, documentType, userId, onBeforeSave, onSaveComplete, shareCode],
  );

  /**
   * Force immediate save.
   */
  const forceSave = useCallback(async () => {
    // Cancel any pending debounced save
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current.cancel();
    }

    await performSave(data);
  }, [data, performSave]);

  /**
   * Perform save with pre-computed field updates
   */
  const performSaveDirectly = useCallback(
    async (payload: {
      documentId: string;
      documentType: string;
      userId: string;
      fieldUpdates: Array<{ field: string; value: any; previousValue: any }>;
    }) => {
      if (!isMountedRef.current) return;

      console.log(
        "[useAutoSave] performSaveDirectly called with",
        payload.fieldUpdates.length,
        "updates",
      );
      setSaveStatus("saving");
      setError(null);

      try {
        // Create DocumentUpdate objects
        const updates: DocumentUpdate[] = payload.fieldUpdates.map((fu) => ({
          id: crypto.randomUUID(),
          documentId: payload.documentId,
          documentType: payload.documentType,
          field: fu.field,
          value: fu.value,
          previousValue: fu.previousValue,
          userId: payload.userId,
          timestamp: new Date().toISOString(),
          version: versionRef.current,
          persisted: false,
          shareCode, // Pass shareCode to each update
        }));

        console.log("[useAutoSave] Saving", updates.length, "updates to database");

        // Save each update
        let allSuccess = true;
        let lastError = "";

        for (const update of updates) {
          console.log("[useAutoSave] Saving field:", update.field, {
            version: update.version,
            documentId: update.documentId,
          });
          const result = await saveUpdate(update);
          console.log("[useAutoSave] Result:", result);

          // If successful, update our local version to match what the database returned
          if (result.success && result.version !== undefined) {
            console.log(
              "[useAutoSave] Updating local version from",
              versionRef.current,
              "to",
              result.version,
            );
            versionRef.current = result.version;
          }

          if (!result.success) {
            allSuccess = false;
            lastError = result.error || "Unknown error";
            break;
          }
        }

        if (allSuccess) {
          if (!isMountedRef.current) return;

          const now = new Date().toISOString();
          setSaveStatus("saved");
          setLastSavedAt(now);
          setError(null);
          // Note: versionRef is already updated in the loop above when we get the result

          // Call completion callback with list of changed fields
          const changedFields = updates.map((u) => u.field);
          onSaveComplete?.(true, undefined, changedFields);

          // Reset to idle after a delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setSaveStatus("idle");
            }
          }, 2000);
        } else {
          if (!isMountedRef.current) return;

          setSaveStatus("error");
          setError(lastError);
          onSaveComplete?.(false, lastError);
        }
      } catch (err) {
        if (!isMountedRef.current) return;

        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setSaveStatus("error");
        setError(errorMessage);
        onSaveComplete?.(false, errorMessage);
      }
    },
    [documentId, documentType, userId, onSaveComplete, shareCode],
  );

  /**
   * Keep a stable ref to performSave to avoid stale closures.
   */
  const performSaveRef = useRef(performSave);
  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  /**
   * Keep a stable ref to performSaveDirectly to avoid recreating debounced function.
   */
  const performSaveDirectlyRef = useRef(performSaveDirectly);
  useEffect(() => {
    performSaveDirectlyRef.current = performSaveDirectly;
  }, [performSaveDirectly]);

  /**
   * Create debounced save function once.
   * CRITICAL: Only recreate when debounceMs changes, not when performSaveDirectly changes.
   * This prevents cancellation of pending saves on every re-render.
   */
  useEffect(() => {
    console.log("[useAutoSave] Creating debounced save function");
    debouncedSaveRef.current = debounce(
      (payload: {
        documentId: string;
        documentType: string;
        userId: string;
        fieldUpdates: Array<{ field: string; value: any; previousValue: any }>;
      }) => {
        console.log(
          "[useAutoSave] Debounced save executing with",
          payload.fieldUpdates.length,
          "field updates",
        );
        console.log(
          "[useAutoSave] performSaveDirectlyRef.current exists:",
          !!performSaveDirectlyRef.current,
        );
        console.log("[useAutoSave] isMountedRef.current:", isMountedRef.current);

        if (!isMountedRef.current) {
          console.log("[useAutoSave] Component unmounted, skipping save");
          return;
        }

        // Call performSaveDirectly via ref to always use the latest version
        performSaveDirectlyRef.current(payload);
      },
      debounceMs,
    );

    return () => {
      console.log("[useAutoSave] Cleaning up debounced save");
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.cancel();
      }
    };
  }, [debounceMs]); // Only recreate if debounceMs changes

  /**
   * Monitor data changes and trigger debounced save.
   * IMPORTANT: This effect compares stringified data to avoid running on reference-only changes.
   * React state updates often create new object references even when the content is identical.
   */
  useEffect(() => {
    if (!isEnabled) {
      console.log("[useAutoSave] Auto-save is disabled");
      return;
    }

    // Skip if data is null or empty
    if (!data || Object.keys(data).length === 0) {
      console.log("[useAutoSave] No data to save");
      return;
    }

    // Skip initial mount - just initialize the ref
    if (isInitialMountRef.current) {
      console.log("[useAutoSave] Initial mount, skipping change detection");
      previousDataRef.current = data;
      dataStringRef.current = JSON.stringify(data);
      isInitialMountRef.current = false;
      return;
    }

    // Compare stringified data to avoid running on reference-only changes
    // This prevents infinite loops when state updates create new object references
    // without actually changing the data content
    const currentDataString = JSON.stringify(data);

    // CRITICAL: Skip change detection if this is a remote update
    // Remote updates should NOT trigger saves
    // Use a counter that decrements - this handles React Strict Mode double-renders
    if (remoteUpdateCounterRef.current > 0) {
      console.log(
        `[useAutoSave] Skipping change detection - applying remote update (counter: ${remoteUpdateCounterRef.current})`,
      );
      // Decrement counter
      remoteUpdateCounterRef.current--;
      // Update refs immediately to prevent subsequent renders from detecting change
      previousDataRef.current = data;
      dataStringRef.current = currentDataString;
      return;
    }

    if (currentDataString === dataStringRef.current) {
      // No actual data change, skip this render
      console.log("[useAutoSave] No data change detected (reference-only change)");
      return;
    }

    // Update the string ref for next comparison
    dataStringRef.current = currentDataString;

    // Check if data has changed (with deep equality for arrays/objects)
    const changedKeys: string[] = [];
    const hasChanged = Object.keys(data).some((key) => {
      const currentValue = data[key];
      const previousValue = previousDataRef.current?.[key];

      // Use deep equality for arrays and objects
      let isChanged: boolean;
      if (Array.isArray(currentValue) && Array.isArray(previousValue)) {
        isChanged = JSON.stringify(currentValue) !== JSON.stringify(previousValue);
      } else if (
        typeof currentValue === "object" &&
        currentValue !== null &&
        typeof previousValue === "object" &&
        previousValue !== null &&
        !Array.isArray(currentValue)
      ) {
        isChanged = JSON.stringify(currentValue) !== JSON.stringify(previousValue);
      } else {
        isChanged = currentValue !== previousValue;
      }

      if (isChanged) {
        changedKeys.push(key);
        console.log(`[useAutoSave] Field "${key}" changed:`, {
          previous: previousValue,
          current: currentValue,
        });
      }
      return isChanged;
    });

    console.log("[useAutoSave] Data change check:", {
      hasChanged,
      changedKeys,
      isEnabled,
      documentId: (data as any)?.id,
      dataKeys: Object.keys(data).length,
    });

    // DEBUG: Log the actual values of changed fields
    if (hasChanged && changedKeys.length > 0) {
      changedKeys.forEach((key) => {
        const currentValue = data[key];
        const previousValue = previousDataRef.current?.[key];
        console.log(`[useAutoSave] Field "${key}" changed:`, {
          currentType: Array.isArray(currentValue)
            ? `Array[${currentValue.length}]`
            : typeof currentValue,
          previousType: Array.isArray(previousValue)
            ? `Array[${previousValue?.length}]`
            : typeof previousValue,
          currentValuePreview:
            typeof currentValue === "object"
              ? JSON.stringify(currentValue).slice(0, 200)
              : currentValue,
          previousValuePreview:
            typeof previousValue === "object"
              ? JSON.stringify(previousValue).slice(0, 200)
              : previousValue,
          areReferencesEqual: currentValue === previousValue,
          areValuesDeepEqual:
            typeof currentValue === "object" && typeof previousValue === "object"
              ? JSON.stringify(currentValue) === JSON.stringify(previousValue)
              : currentValue === previousValue,
        });
      });
    }

    if (hasChanged) {
      console.log("[useAutoSave] Change detected, setting status to typing");
      console.log("[useAutoSave] Changed fields:", changedKeys);
      setSaveStatus("typing");

      // Create the field updates now, before updating previousDataRef
      const fieldUpdates: Array<{ field: string; value: any; previousValue: any }> = [];
      for (const key of changedKeys) {
        fieldUpdates.push({
          field: key,
          value: data[key],
          previousValue: previousDataRef.current?.[key],
        });
      }

      console.log(
        "[useAutoSave] Created field updates:",
        fieldUpdates.map((u) => u.field),
      );

      // CRITICAL: Do NOT update previousDataRef here!
      // It will be updated in performSaveDirectly after the save succeeds.
      // Updating it here causes the debounced save to detect "no changes" when it finally executes.

      // Pass the field updates to performSave
      debouncedSaveRef.current?.({ documentId, documentType, userId, fieldUpdates });
    }
  }, [data, isEnabled, documentId, documentType, userId]);

  /**
   * Handle beforeunload event to warn about unsaved changes.
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === "typing" || saveStatus === "saving") {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveStatus]);

  /**
   * Track mounted state and cleanup on unmount.
   */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.cancel();
      }
    };
  }, []);

  // Expose method to mark incoming changes as remote updates
  // This prevents remote updates from triggering autosave
  const markAsRemoteUpdate = useCallback(() => {
    console.log("[useAutoSave] Marking next state change as remote update");
    // Set counter to 2 to handle React Strict Mode double-renders
    // In Strict Mode, effects run twice, so we need to skip 2 effect runs
    // In production, only 1 effect run occurs, but setting to 2 is safe
    remoteUpdateCounterRef.current = 2;
  }, []);

  return {
    saveStatus,
    lastSavedAt,
    forceSave,
    error,
    isEnabled,
    setEnabled,
    markAsRemoteUpdate,
  };
};
