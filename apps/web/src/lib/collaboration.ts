/**
 * Collaboration utilities for real-time document editing.
 * Manages Supabase Realtime Broadcast and Presence channels.
 */

import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  CollaborationChannels,
  CollaborationSetupOptions,
  PresenceUser,
  BroadcastPayload,
  ConnectionStatus,
} from "@/types/collaboration";

/**
 * User colors for presence cursors and highlights.
 * Rotate through these for different users.
 */
const USER_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
];

/**
 * Get a consistent color for a user based on their ID.
 *
 * @param userId - The user's ID
 * @returns Hex color code
 */
export const getUserColor = (userId: string): string => {
  // Simple hash function to get consistent color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
};

/**
 * Setup Broadcast channel for real-time field updates.
 *
 * @param channelName - Unique channel name
 * @param onMessage - Callback for received messages
 * @returns Promise resolving to RealtimeChannel
 */
export const setupBroadcastChannel = async (
  channelName: string,
  onMessage: (payload: BroadcastPayload) => void,
): Promise<RealtimeChannel> => {
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: {
        self: false, // Don't receive our own broadcasts
        ack: false, // Don't wait for acknowledgment
      },
    },
  });

  // Listen for broadcast events
  channel.on("broadcast", { event: "update" }, ({ payload }) => {
    console.log("[Collaboration] Received broadcast:", payload);
    onMessage(payload as BroadcastPayload);
  });

  // Subscribe to the channel
  await channel.subscribe((subscriptionStatus) => {
    if (subscriptionStatus === "SUBSCRIBED") {
      console.log(`[Collaboration] Subscribed to broadcast channel: ${channelName}`);
    } else if (subscriptionStatus === "CHANNEL_ERROR") {
      console.error(`[Collaboration] Error subscribing to channel: ${channelName}`);
    } else if (subscriptionStatus === "TIMED_OUT") {
      console.warn(`[Collaboration] Subscription timed out: ${channelName}`);
    }
  });

  return channel;
};

/**
 * Setup Presence channel for user tracking.
 *
 * @param channelName - Unique channel name
 * @param user - Current user information
 * @param onPresenceChange - Callback for presence changes
 * @returns Promise resolving to RealtimeChannel
 */
export const setupPresenceChannel = async (
  channelName: string,
  user: { userId: string; email: string; name?: string },
  onPresenceChange: (users: PresenceUser[]) => void,
): Promise<RealtimeChannel> => {
  const channel = supabase.channel(channelName, {
    config: {
      presence: {
        key: user.userId,
      },
    },
  });

  // Track presence state
  channel.on("presence", { event: "sync" }, () => {
    const state = channel.presenceState();
    const users = parsePresenceState(state);
    console.log(`[Collaboration] Presence sync: ${users.length} users`);
    onPresenceChange(users);
  });

  channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
    console.log(`[Collaboration] User joined: ${key}`, newPresences);
    const state = channel.presenceState();
    const users = parsePresenceState(state);
    onPresenceChange(users);
  });

  channel.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
    console.log(`[Collaboration] User left: ${key}`, leftPresences);
    const state = channel.presenceState();
    const users = parsePresenceState(state);
    onPresenceChange(users);
  });

  // Subscribe and track this user's presence
  await channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      console.log(`[Collaboration] Subscribed to presence channel: ${channelName}`);

      // Track this user's presence
      const presenceData: Omit<PresenceUser, "userId"> = {
        email: user.email,
        name: user.name,
        color: getUserColor(user.userId),
        lastActive: new Date().toISOString(),
      };

      await channel.track(presenceData);
    }
  });

  return channel;
};

/**
 * Parse Supabase presence state into PresenceUser array.
 *
 * @param state - Raw presence state from Supabase
 * @returns Array of presence users
 */
const parsePresenceState = (state: Record<string, any[]>): PresenceUser[] => {
  const users: PresenceUser[] = [];

  for (const [userId, presences] of Object.entries(state)) {
    // Each user can have multiple presence records (multi-tab)
    // We take the most recent one
    if (presences.length > 0) {
      const latest = presences[presences.length - 1];
      users.push({
        userId,
        email: latest.email,
        name: latest.name,
        color: latest.color,
        editingField: latest.editingField,
        cursorPosition: latest.cursorPosition,
        lastActive: latest.lastActive,
      });
    }
  }

  return users;
};

/**
 * Broadcast a field update to all connected users.
 *
 * @param channel - The broadcast channel
 * @param payload - The broadcast payload
 * @returns Promise resolving when broadcast is sent
 */
export const broadcastUpdate = async (
  channel: RealtimeChannel,
  payload: BroadcastPayload,
): Promise<void> => {
  try {
    await channel.send({
      type: "broadcast",
      event: "update",
      payload,
    });
    console.log("[Collaboration] Broadcasted update:", payload.type);
  } catch (error) {
    console.error("[Collaboration] Failed to broadcast update:", error);
    throw error;
  }
};

/**
 * Update presence state (e.g., cursor position, editing field).
 *
 * @param channel - The presence channel
 * @param updates - Partial presence updates
 * @returns Promise resolving when presence is updated
 */
export const updatePresence = async (
  channel: RealtimeChannel,
  updates: Partial<Omit<PresenceUser, "userId">>,
): Promise<void> => {
  try {
    await channel.track({
      ...updates,
      lastActive: new Date().toISOString(),
    });
    console.log("[Collaboration] Updated presence:", updates);
  } catch (error) {
    console.error("[Collaboration] Failed to update presence:", error);
    throw error;
  }
};

/**
 * Setup complete collaboration infrastructure for a document.
 *
 * @param options - Collaboration setup options
 * @returns Promise resolving to collaboration channels
 */
export const setupCollaboration = async (
  options: CollaborationSetupOptions,
): Promise<CollaborationChannels> => {
  const { documentId, documentType, user, onRemoteUpdate, onPresenceChange, onStatusChange } =
    options;

  const channelName = `${documentType}:${documentId}`;
  let currentStatus: ConnectionStatus = "connecting";

  const updateStatus = (newStatus: ConnectionStatus, error?: string) => {
    currentStatus = newStatus;
    onStatusChange?.(newStatus);
    if (error) {
      console.error(`[Collaboration] Status changed to ${newStatus}:`, error);
    }
  };

  try {
    updateStatus("connecting");

    // Setup broadcast channel
    const broadcastChannel = await setupBroadcastChannel(`${channelName}:broadcast`, (payload) => {
      onRemoteUpdate?.(payload);
    });

    // Setup presence channel
    const presenceChannel = await setupPresenceChannel(`${channelName}:presence`, user, (users) => {
      onPresenceChange?.(users);
    });

    updateStatus("connected");

    return {
      broadcast: broadcastChannel,
      presence: presenceChannel,
      status: currentStatus,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    updateStatus("error", errorMessage);

    return {
      broadcast: null,
      presence: null,
      status: currentStatus,
      error: errorMessage,
    };
  }
};

/**
 * Cleanup collaboration channels.
 *
 * @param channels - The channels to cleanup
 * @returns Promise resolving when cleanup is complete
 */
export const cleanupCollaboration = async (channels: CollaborationChannels): Promise<void> => {
  try {
    if (channels.broadcast) {
      await supabase.removeChannel(channels.broadcast);
      console.log("[Collaboration] Removed broadcast channel");
    }

    if (channels.presence) {
      await supabase.removeChannel(channels.presence);
      console.log("[Collaboration] Removed presence channel");
    }
  } catch (error) {
    console.error("[Collaboration] Error during cleanup:", error);
    throw error;
  }
};

/**
 * Handle reconnection after network disruption.
 *
 * @param channels - The existing channels to reconnect
 * @param options - Original setup options
 * @returns Promise resolving to new channels
 */
export const handleReconnection = async (
  channels: CollaborationChannels,
  options: CollaborationSetupOptions,
): Promise<CollaborationChannels> => {
  console.log("[Collaboration] Handling reconnection...");

  // Cleanup old channels
  await cleanupCollaboration(channels);

  // Setup new channels
  const newChannels = await setupCollaboration(options);

  // Request sync from other clients
  if (newChannels.broadcast) {
    await broadcastUpdate(newChannels.broadcast, {
      type: "sync_request",
      userId: options.user.userId,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  return newChannels;
};

/**
 * Check if channels are healthy and connected.
 *
 * @param channels - The channels to check
 * @returns Boolean indicating if channels are healthy
 */
export const areChannelsHealthy = (channels: CollaborationChannels): boolean => {
  return (
    channels.status === "connected" && channels.broadcast !== null && channels.presence !== null
  );
};

/**
 * Get current presence users from a channel.
 *
 * @param channel - The presence channel
 * @returns Array of current presence users
 */
export const getCurrentPresenceUsers = (channel: RealtimeChannel): PresenceUser[] => {
  const state = channel.presenceState();
  return parsePresenceState(state);
};
