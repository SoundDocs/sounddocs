/**
 * React hook for Supabase real-time subscriptions with automatic reconnection.
 * Handles network failures, timeouts, and connection errors with exponential backoff.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

interface UseRealtimeSubscriptionOptions<T> {
  /** Table name to subscribe to */
  table: string;
  /** Event type (INSERT, UPDATE, DELETE, or *) */
  event: "INSERT" | "UPDATE" | "DELETE" | "*";
  /** Filter expression (e.g., "id=eq.123") */
  filter?: string;
  /** Callback when update is received */
  onUpdate: (payload: any) => void;
  /** Whether subscription is enabled */
  enabled?: boolean;
  /** Maximum retry attempts before giving up (default: 10) */
  maxRetries?: number;
  /** Initial retry delay in ms (default: 1000) */
  initialRetryDelay?: number;
  /** Maximum retry delay in ms (default: 30000) */
  maxRetryDelay?: number;
}

interface UseRealtimeSubscriptionResult {
  /** Current connection status */
  status: ConnectionStatus;
  /** Current retry attempt (0 if connected) */
  retryCount: number;
  /** Error message if status is 'error' */
  error: string | null;
  /** Manually trigger reconnection */
  reconnect: () => void;
}

/**
 * Hook for Supabase real-time subscriptions with automatic reconnection.
 *
 * Features:
 * - Exponential backoff retry strategy
 * - Automatic reconnection on network failures
 * - Connection health monitoring
 * - Proper cleanup on unmount
 *
 * @example
 * ```tsx
 * const { status, retryCount } = useRealtimeSubscription({
 *   table: 'run_of_shows',
 *   event: 'UPDATE',
 *   filter: `id=eq.${showId}`,
 *   onUpdate: (payload) => {
 *     setShowData(payload.new);
 *   },
 * });
 * ```
 */
export const useRealtimeSubscription = <T = any>({
  table,
  event,
  filter,
  onUpdate,
  enabled = true,
  maxRetries = 10,
  initialRetryDelay = 1000,
  maxRetryDelay = 30000,
}: UseRealtimeSubscriptionOptions<T>): UseRealtimeSubscriptionResult => {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  /**
   * Calculate retry delay with exponential backoff.
   */
  const getRetryDelay = useCallback(
    (attempt: number): number => {
      const delay = Math.min(initialRetryDelay * Math.pow(2, attempt), maxRetryDelay);
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      return delay + jitter;
    },
    [initialRetryDelay, maxRetryDelay],
  );

  /**
   * Cleanup existing channel.
   */
  const cleanup = useCallback(async () => {
    if (channelRef.current) {
      try {
        await supabase.removeChannel(channelRef.current);
        console.log(`[Realtime] Removed channel for ${table}`);
      } catch (err) {
        console.error("[Realtime] Error removing channel:", err);
      }
      channelRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [table]);

  /**
   * Attempt to connect/reconnect to realtime channel.
   */
  const connect = useCallback(
    async (attempt: number = 0) => {
      if (!mountedRef.current) return;

      // Give up after max retries
      if (attempt >= maxRetries) {
        setStatus("error");
        setError(`Failed to connect after ${maxRetries} attempts. Please refresh the page.`);
        console.error(`[Realtime] Max retries (${maxRetries}) exceeded for ${table}`);
        return;
      }

      // Cleanup any existing channel first
      await cleanup();

      // Update status
      if (attempt === 0) {
        setStatus("connecting");
        setRetryCount(0);
        setError(null);
      } else {
        setStatus("reconnecting");
        setRetryCount(attempt);
      }

      console.log(
        `[Realtime] Connecting to ${table} (attempt ${attempt + 1}/${maxRetries})${filter ? ` with filter: ${filter}` : ""}`,
      );

      try {
        // Create channel with unique name
        const channelName = `public:${table}${filter ? `:${filter}` : ""}:${Date.now()}`;
        const channel = supabase.channel(channelName);

        // Setup postgres_changes listener
        channel.on(
          "postgres_changes",
          {
            event,
            schema: "public",
            table,
            ...(filter && { filter }),
          },
          (payload) => {
            if (mountedRef.current) {
              console.log(`[Realtime] Received ${event} event:`, payload);
              onUpdate(payload);
            }
          },
        );

        // Subscribe with status callback
        channel.subscribe((subscriptionStatus, err) => {
          if (!mountedRef.current) return;

          console.log(`[Realtime] Subscription status: ${subscriptionStatus}`, err || "");

          if (subscriptionStatus === "SUBSCRIBED") {
            setStatus("connected");
            setRetryCount(0);
            setError(null);
            console.log(`[Realtime] Successfully subscribed to ${table}`);
          } else if (subscriptionStatus === "CHANNEL_ERROR") {
            console.error(`[Realtime] Channel error for ${table}:`, err);
            // Schedule reconnection
            const delay = getRetryDelay(attempt);
            console.log(`[Realtime] Retrying in ${Math.round(delay / 1000)}s...`);
            retryTimeoutRef.current = setTimeout(() => {
              connect(attempt + 1);
            }, delay);
          } else if (subscriptionStatus === "TIMED_OUT") {
            console.warn(`[Realtime] Subscription timed out for ${table}`);
            // Schedule reconnection
            const delay = getRetryDelay(attempt);
            console.log(`[Realtime] Retrying in ${Math.round(delay / 1000)}s...`);
            retryTimeoutRef.current = setTimeout(() => {
              connect(attempt + 1);
            }, delay);
          }
        });

        channelRef.current = channel;
      } catch (err) {
        console.error(`[Realtime] Error setting up channel for ${table}:`, err);
        // Schedule reconnection
        const delay = getRetryDelay(attempt);
        console.log(`[Realtime] Retrying in ${Math.round(delay / 1000)}s...`);
        retryTimeoutRef.current = setTimeout(() => {
          connect(attempt + 1);
        }, delay);
      }
    },
    [table, event, filter, onUpdate, maxRetries, getRetryDelay, cleanup],
  );

  /**
   * Manually trigger reconnection.
   */
  const reconnect = useCallback(() => {
    console.log(`[Realtime] Manual reconnect triggered for ${table}`);
    connect(0);
  }, [connect, table]);

  /**
   * Setup subscription on mount and when dependencies change.
   */
  useEffect(() => {
    if (!enabled) {
      setStatus("disconnected");
      return;
    }

    mountedRef.current = true;
    connect(0);

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [enabled, connect, cleanup]);

  return {
    status,
    retryCount,
    error,
    reconnect,
  };
};
