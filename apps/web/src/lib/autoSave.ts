/**
 * Auto-save utilities with debouncing, retry logic, and version conflict detection.
 * Provides core functionality for saving document changes with offline support.
 */

import { supabase } from "@/lib/supabase";
import { enqueueUpdate, dequeueUpdate, updateQueuedItem } from "@/lib/offlineQueue";
import { updateSharedResource, type ResourceType } from "@/lib/shareUtils";
import type {
  DocumentUpdate,
  DocumentType,
  SaveResult,
  AutoSaveConfig,
} from "@/types/collaboration";

const DEFAULT_CONFIG: Required<AutoSaveConfig> = {
  debounceMs: 1500,
  enabled: true,
  maxRetries: 3,
  retryDelayMs: 1000,
  enableVersioning: false,
  versionIntervalMs: 300000, // 5 minutes
};

/**
 * Get the correct timestamp field name for a given document type.
 * Most tables use 'last_edited', only a few use 'updated_at'.
 */
const getTimestampFieldName = (documentType: DocumentType): string => {
  switch (documentType) {
    case "patch_sheets":
    case "stage_plots":
    case "pixel_maps":
    case "corporate_mic_plots":
    case "theater_mic_plots":
    case "production_schedules":
    case "run_of_shows":
    case "technical_riders":
      return "last_edited";
    default:
      // Fallback to updated_at for any tables not explicitly listed
      // This should be verified on a case-by-case basis
      return "updated_at";
  }
};

/**
 * Map document type (plural table name) to resource type (singular).
 * Used for converting between auto-save system and share utils.
 */
const mapDocumentTypeToResourceType = (documentType: DocumentType): ResourceType => {
  switch (documentType) {
    case "patch_sheets": {
      return "patch_sheet";
    }
    case "stage_plots": {
      return "stage_plot";
    }
    case "production_schedules": {
      return "production_schedule";
    }
    case "run_of_shows": {
      return "run_of_show";
    }
    case "corporate_mic_plots": {
      return "corporate_mic_plot";
    }
    case "theater_mic_plots": {
      return "theater_mic_plot";
    }
    case "technical_riders": {
      return "technical_rider";
    }
    default: {
      // Fallback: try to remove trailing 's'
      const singular = documentType.endsWith("s") ? documentType.slice(0, -1) : documentType;
      console.warn(
        `[AutoSave] Unmapped document type: ${documentType}, using fallback: ${singular}`,
      );
      return singular as ResourceType;
    }
  }
};

/**
 * Create a debounced function that delays execution until after a wait period.
 *
 * @param func - Function to debounce
 * @param waitMs - Milliseconds to wait before executing
 * @returns Debounced function with cancel method
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  waitMs: number,
): {
  (...args: Parameters<T>): void;
  cancel: () => void;
} => {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, waitMs);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
};

/**
 * Save a document update to Supabase.
 *
 * @param update - The document update to save
 * @returns Promise resolving to save result
 */
export const saveUpdate = async (update: DocumentUpdate): Promise<SaveResult> => {
  try {
    const { documentId, documentType, field, value, version, shareCode } = update;

    console.log(`[AutoSave] Saving update for ${documentType}/${documentId}`, {
      field,
      expectedVersion: version,
      valueType: typeof value,
      isSharedEdit: !!shareCode,
    });

    // If we have a shareCode, use the shared resource update path (bypasses RLS)
    if (shareCode) {
      console.log(`[AutoSave] Using shared resource path with shareCode: ${shareCode}`);

      const resourceType = mapDocumentTypeToResourceType(documentType);
      const updateData = { [field]: value };

      try {
        const data = await updateSharedResource(shareCode, resourceType, updateData);

        console.log(`[AutoSave] Shared resource save successful for ${documentType}/${documentId}`);

        return {
          success: true,
          version: data?.version,
          timestamp: data?.last_edited || data?.updated_at || new Date().toISOString(),
        };
      } catch (sharedError) {
        console.error(`[AutoSave] Shared resource save failed:`, sharedError);
        return {
          success: false,
          error:
            sharedError instanceof Error ? sharedError.message : "Failed to save shared resource",
        };
      }
    }

    // Standard authenticated user path
    // Determine the correct timestamp field name for this table
    const timestampField = getTimestampFieldName(documentType);

    // Build the update object
    const updateData: Record<string, any> = {
      [field]: value,
      [timestampField]: new Date().toISOString(),
    };

    // Query WITHOUT version check in WHERE clause
    // IMPORTANT: The database has a trigger that auto-increments the version on every UPDATE.
    // We don't need to add .eq("version", version) because:
    // 1. The trigger will increment the version automatically
    // 2. Adding a version check would conflict with the trigger's increment
    // 3. For true optimistic locking, we'd need to check version BEFORE the trigger runs
    //    which isn't possible with the current trigger design
    console.log(`[AutoSave] Saving with current version ${version}, database will auto-increment`);

    const { data, error } = await supabase
      .from(documentType)
      .update(updateData)
      .eq("id", documentId)
      .select(`version, ${timestampField}`)
      .single();

    if (error) {
      console.error(`[AutoSave] Failed to save ${documentType}/${documentId}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`[AutoSave] Save successful for ${documentType}/${documentId}`, {
      returnedVersion: data?.version,
      expectedVersion: version,
    });

    const returnedTimestamp =
      data?.[timestampField] || data?.updated_at || new Date().toISOString();
    return {
      success: true,
      version: data?.version,
      timestamp: returnedTimestamp,
    };
  } catch (error) {
    console.error("[AutoSave] Unexpected error during save:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Save multiple updates in a batch.
 *
 * @param updates - Array of document updates to save
 * @returns Promise resolving to array of save results
 */
export const saveBatch = async (updates: DocumentUpdate[]): Promise<SaveResult[]> => {
  // Group updates by document
  const groupedByDoc = updates.reduce(
    (acc, update) => {
      const key = `${update.documentType}:${update.documentId}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(update);
      return acc;
    },
    {} as Record<string, DocumentUpdate[]>,
  );

  // Save each document's updates
  const results: SaveResult[] = [];
  for (const docUpdates of Object.values(groupedByDoc)) {
    if (docUpdates.length === 0) continue;

    const firstUpdate = docUpdates[0];
    const timestampField = getTimestampFieldName(firstUpdate.documentType);
    const combinedData: Record<string, any> = {
      [timestampField]: new Date().toISOString(),
    };

    // Combine all field updates for this document
    docUpdates.forEach((update) => {
      combinedData[update.field] = update.value;
    });

    try {
      const { data, error } = await supabase
        .from(firstUpdate.documentType)
        .update(combinedData)
        .eq("id", firstUpdate.documentId)
        .select(`version, ${timestampField}`)
        .single();

      if (error) {
        // All updates for this document failed
        docUpdates.forEach(() => {
          results.push({
            success: false,
            error: error.message,
          });
        });
      } else {
        // All updates for this document succeeded
        const returnedTimestamp =
          data?.[timestampField] || data?.updated_at || new Date().toISOString();
        docUpdates.forEach(() => {
          results.push({
            success: true,
            version: data?.version,
            timestamp: returnedTimestamp,
          });
        });
      }
    } catch (error) {
      docUpdates.forEach(() => {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    }
  }

  return results;
};

/**
 * Retry a failed save with exponential backoff.
 *
 * @param update - The document update to retry
 * @param queueId - The offline queue item ID (if queued)
 * @param config - Auto-save configuration
 * @returns Promise resolving to save result
 */
export const retrySave = async (
  update: DocumentUpdate,
  queueId?: string,
  config: AutoSaveConfig = {},
): Promise<SaveResult> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { maxRetries, retryDelayMs } = finalConfig;

  let lastError = "";
  let attempts = update.retryCount || 0;

  while (attempts < maxRetries) {
    attempts++;

    // Exponential backoff
    const delay = retryDelayMs * Math.pow(2, attempts - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));

    console.log(
      `[AutoSave] Retry attempt ${attempts}/${maxRetries} for ${update.documentType}/${update.documentId}`,
    );

    const result = await saveUpdate(update);

    if (result.success) {
      // Success! Remove from queue if it was queued
      if (queueId) {
        await dequeueUpdate(queueId);
      }
      return result;
    }

    lastError = result.error || "Unknown error";

    // Update queue item with attempt count
    if (queueId) {
      await updateQueuedItem(queueId, attempts, lastError);
    }
  }

  console.error(
    `[AutoSave] Max retries (${maxRetries}) exceeded for ${update.documentType}/${update.documentId}`,
  );

  return {
    success: false,
    error: `Max retries exceeded. Last error: ${lastError}`,
  };
};

/**
 * Handle offline save by queueing the update.
 *
 * @param update - The document update to queue
 * @returns Promise resolving to queue item ID
 */
export const handleOfflineSave = async (update: DocumentUpdate): Promise<string> => {
  try {
    const queueId = await enqueueUpdate(update);
    console.log(
      `[AutoSave] Queued update for offline sync: ${update.documentType}/${update.documentId}`,
    );
    return queueId;
  } catch (error) {
    console.error("[AutoSave] Failed to queue offline update:", error);
    throw error;
  }
};

/**
 * Check if the browser is currently online.
 *
 * @returns Boolean indicating online status
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Create a version history snapshot for a document.
 *
 * @param documentId - The document ID
 * @param documentType - The document type
 * @param userId - The user making the change
 * @param userEmail - The user's email
 * @param snapshot - The document data snapshot
 * @param changedFields - Fields changed in this version
 * @param description - Optional description of changes
 * @returns Promise resolving to version history ID
 */
export const createVersionSnapshot = async (
  documentId: string,
  documentType: DocumentType,
  userId: string,
  userEmail: string,
  snapshot: Record<string, any>,
  changedFields: string[],
  description?: string,
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("document_history")
      .insert({
        document_id: documentId,
        document_type: documentType,
        user_id: userId,
        user_email: userEmail,
        snapshot,
        changed_fields: changedFields,
        description,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[AutoSave] Failed to create version snapshot:", error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error("[AutoSave] Unexpected error creating version snapshot:", error);
    return null;
  }
};

/**
 * Get the latest version number for a document.
 *
 * @param documentId - The document ID
 * @param documentType - The document type
 * @returns Promise resolving to version number or null
 */
export const getLatestVersion = async (
  documentId: string,
  documentType: DocumentType,
): Promise<number | null> => {
  try {
    const { data, error } = await supabase
      .from(documentType)
      .select("version")
      .eq("id", documentId)
      .single();

    if (error) {
      console.error("[AutoSave] Failed to get latest version:", error);
      return null;
    }

    return data?.version ?? null;
  } catch (error) {
    console.error("[AutoSave] Unexpected error getting latest version:", error);
    return null;
  }
};

/**
 * Detect if a version conflict exists.
 *
 * @param documentId - The document ID
 * @param documentType - The document type
 * @param expectedVersion - The version we expect
 * @returns Promise resolving to boolean indicating conflict
 */
export const hasVersionConflict = async (
  documentId: string,
  documentType: DocumentType,
  expectedVersion: number,
): Promise<boolean> => {
  const currentVersion = await getLatestVersion(documentId, documentType);

  if (currentVersion === null) {
    return false; // Can't determine, assume no conflict
  }

  return currentVersion !== expectedVersion;
};
