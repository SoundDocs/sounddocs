/**
 * Offline queue management using IndexedDB via localforage.
 * Queues document saves when offline and syncs when connection is restored.
 */

import localforage from "localforage";
import type { QueuedSave, DocumentUpdate } from "@/types/collaboration";

const QUEUE_STORE_NAME = "offline-saves-queue";
const MAX_QUEUE_SIZE = 1000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Initialize the offline queue store.
 */
const queueStore = localforage.createInstance({
  name: "sounddocs-collaboration",
  storeName: QUEUE_STORE_NAME,
  description: "Offline save queue for collaborative editing",
});

/**
 * Add a document update to the offline queue.
 *
 * @param update - The document update to queue
 * @returns Promise resolving to the queued item ID
 * @throws Error if queue is full or storage quota exceeded
 */
export const enqueueUpdate = async (update: DocumentUpdate): Promise<string> => {
  try {
    const queuedItem: QueuedSave = {
      id: crypto.randomUUID(),
      update,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    };

    // Check queue size before adding
    const currentQueue = await getAllQueuedUpdates();
    if (currentQueue.length >= MAX_QUEUE_SIZE) {
      // Remove oldest items to make room
      const sorted = currentQueue.sort(
        (a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime(),
      );
      const toRemove = sorted.slice(0, currentQueue.length - MAX_QUEUE_SIZE + 1);
      await Promise.all(toRemove.map((item) => queueStore.removeItem(item.id)));
    }

    await queueStore.setItem(queuedItem.id, queuedItem);
    console.log(`[OfflineQueue] Enqueued update ${queuedItem.id} for ${update.documentType}`);

    return queuedItem.id;
  } catch (error) {
    console.error("[OfflineQueue] Failed to enqueue update:", error);
    throw new Error("Failed to queue update for offline sync");
  }
};

/**
 * Remove an update from the queue.
 *
 * @param id - The queued item ID to remove
 * @returns Promise resolving when item is removed
 */
export const dequeueUpdate = async (id: string): Promise<void> => {
  try {
    await queueStore.removeItem(id);
    console.log(`[OfflineQueue] Dequeued update ${id}`);
  } catch (error) {
    console.error(`[OfflineQueue] Failed to dequeue update ${id}:`, error);
    throw error;
  }
};

/**
 * Get all queued updates.
 *
 * @returns Promise resolving to array of queued saves
 */
export const getAllQueuedUpdates = async (): Promise<QueuedSave[]> => {
  try {
    const keys = await queueStore.keys();
    const items = await Promise.all(keys.map((key) => queueStore.getItem<QueuedSave>(key)));

    return items.filter((item): item is QueuedSave => item !== null);
  } catch (error) {
    console.error("[OfflineQueue] Failed to get queued updates:", error);
    return [];
  }
};

/**
 * Get queued updates for a specific document.
 *
 * @param documentId - The document ID to filter by
 * @returns Promise resolving to array of queued saves for the document
 */
export const getQueuedUpdatesForDocument = async (documentId: string): Promise<QueuedSave[]> => {
  const allUpdates = await getAllQueuedUpdates();
  return allUpdates.filter((item) => item.update.documentId === documentId);
};

/**
 * Update a queued item's attempt count and error.
 *
 * @param id - The queued item ID
 * @param attempts - New attempt count
 * @param error - Error message from last attempt
 * @returns Promise resolving when item is updated
 */
export const updateQueuedItem = async (
  id: string,
  attempts: number,
  error?: string,
): Promise<void> => {
  try {
    const item = await queueStore.getItem<QueuedSave>(id);
    if (!item) {
      throw new Error(`Queued item ${id} not found`);
    }

    const updated: QueuedSave = {
      ...item,
      attempts,
      lastError: error,
      lastAttempt: new Date().toISOString(),
    };

    await queueStore.setItem(id, updated);
  } catch (error) {
    console.error(`[OfflineQueue] Failed to update queued item ${id}:`, error);
    throw error;
  }
};

/**
 * Clear all queued updates.
 *
 * @returns Promise resolving when queue is cleared
 */
export const clearQueue = async (): Promise<void> => {
  try {
    await queueStore.clear();
    console.log("[OfflineQueue] Cleared all queued updates");
  } catch (error) {
    console.error("[OfflineQueue] Failed to clear queue:", error);
    throw error;
  }
};

/**
 * Clear queued updates for a specific document.
 *
 * @param documentId - The document ID to clear updates for
 * @returns Promise resolving to number of items removed
 */
export const clearQueueForDocument = async (documentId: string): Promise<number> => {
  try {
    const items = await getQueuedUpdatesForDocument(documentId);
    await Promise.all(items.map((item) => dequeueUpdate(item.id)));
    console.log(`[OfflineQueue] Cleared ${items.length} updates for document ${documentId}`);
    return items.length;
  } catch (error) {
    console.error(`[OfflineQueue] Failed to clear queue for document ${documentId}:`, error);
    throw error;
  }
};

/**
 * Remove stale items from the queue (older than MAX_AGE_MS).
 *
 * @returns Promise resolving to number of items removed
 */
export const pruneStaleItems = async (): Promise<number> => {
  try {
    const allItems = await getAllQueuedUpdates();
    const now = Date.now();
    const staleItems = allItems.filter(
      (item) => now - new Date(item.queuedAt).getTime() > MAX_AGE_MS,
    );

    await Promise.all(staleItems.map((item) => dequeueUpdate(item.id)));
    console.log(`[OfflineQueue] Pruned ${staleItems.length} stale items`);

    return staleItems.length;
  } catch (error) {
    console.error("[OfflineQueue] Failed to prune stale items:", error);
    return 0;
  }
};

/**
 * Get queue statistics.
 *
 * @returns Promise resolving to queue statistics
 */
export const getQueueStats = async (): Promise<{
  totalItems: number;
  oldestItem: string | null;
  newestItem: string | null;
  documentCounts: Record<string, number>;
}> => {
  try {
    const items = await getAllQueuedUpdates();

    if (items.length === 0) {
      return {
        totalItems: 0,
        oldestItem: null,
        newestItem: null,
        documentCounts: {},
      };
    }

    const sorted = items.sort(
      (a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime(),
    );

    const documentCounts: Record<string, number> = {};
    items.forEach((item) => {
      const key = item.update.documentId;
      documentCounts[key] = (documentCounts[key] || 0) + 1;
    });

    return {
      totalItems: items.length,
      oldestItem: sorted[0].queuedAt,
      newestItem: sorted[sorted.length - 1].queuedAt,
      documentCounts,
    };
  } catch (error) {
    console.error("[OfflineQueue] Failed to get queue stats:", error);
    return {
      totalItems: 0,
      oldestItem: null,
      newestItem: null,
      documentCounts: {},
    };
  }
};

/**
 * Check if IndexedDB is available.
 *
 * @returns Promise resolving to boolean indicating availability
 */
export const isIndexedDBAvailable = async (): Promise<boolean> => {
  try {
    await queueStore.ready();
    return true;
  } catch (error) {
    console.error("[OfflineQueue] IndexedDB not available:", error);
    return false;
  }
};
