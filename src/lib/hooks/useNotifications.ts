"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export type NotificationType =
  | "match_reminder"
  | "tournament_start"
  | "clan_invite"
  | "friend_request"
  | "achievement_earned"
  | "level_up"
  | "battle_pass_reward"
  | "stream_live"
  | "forum_reply"
  | "direct_message"
  | "system_announcement";

export type NotificationChannel = "in_app" | "email" | "discord" | "push";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  icon?: string;
  image_url?: string;
  action_url?: string;
  action_label?: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  unread_count?: number;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  channels: NotificationChannel[];
  is_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  frequency: "instant" | "hourly_digest" | "daily_digest";
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DiscordConnection {
  id: string;
  user_id: string;
  discord_user_id: string;
  discord_username: string;
  discord_discriminator?: string;
  discord_avatar?: string;
  is_active: boolean;
  connected_at: string;
}

// Notification type display info
export const NOTIFICATION_TYPE_INFO: Record<NotificationType, { label: string; description: string; icon: string }> = {
  match_reminder: {
    label: "Match Reminders",
    description: "Get reminded before your scheduled matches",
    icon: "⚔️",
  },
  tournament_start: {
    label: "Tournament Updates",
    description: "Notifications about tournaments you're in",
    icon: "🏆",
  },
  clan_invite: {
    label: "Clan Invites",
    description: "When you receive a clan invitation",
    icon: "🤝",
  },
  friend_request: {
    label: "Friend Requests",
    description: "When someone sends you a friend request",
    icon: "👋",
  },
  achievement_earned: {
    label: "Achievements",
    description: "When you earn a new achievement",
    icon: "🎖️",
  },
  level_up: {
    label: "Level Up",
    description: "When you reach a new level",
    icon: "⬆️",
  },
  battle_pass_reward: {
    label: "Battle Pass Rewards",
    description: "When you unlock a battle pass reward",
    icon: "🎁",
  },
  stream_live: {
    label: "Streams Going Live",
    description: "When streamers you follow go live",
    icon: "🔴",
  },
  forum_reply: {
    label: "Forum Replies",
    description: "When someone replies to your posts",
    icon: "💬",
  },
  direct_message: {
    label: "Direct Messages",
    description: "When you receive a direct message",
    icon: "✉️",
  },
  system_announcement: {
    label: "System Announcements",
    description: "Important platform announcements",
    icon: "📢",
  },
};

// Channel display info
export const CHANNEL_INFO: Record<NotificationChannel, { label: string; icon: string }> = {
  in_app: { label: "In-App", icon: "🔔" },
  email: { label: "Email", icon: "📧" },
  discord: { label: "Discord", icon: "💬" },
  push: { label: "Push", icon: "📱" },
};

// API functions
async function fetchNotifications(params: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());
  if (params.unreadOnly) searchParams.set("unread_only", "true");

  const response = await fetch(`/api/notifications?${searchParams}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch notifications");
  }
  return response.json();
}

async function markAsRead(notificationIds?: string[]) {
  const response = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      notificationIds ? { notificationIds } : { markAllRead: true }
    ),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to mark as read");
  }
  return response.json();
}

async function archiveNotification(notificationId?: string) {
  const url = notificationId
    ? `/api/notifications?id=${notificationId}`
    : "/api/notifications";
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to archive notification");
  }
  return response.json();
}

async function fetchPreferences() {
  const response = await fetch("/api/notifications/preferences");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch preferences");
  }
  return response.json();
}

async function updatePreferences(preferences: Partial<NotificationPreference>[]) {
  const response = await fetch("/api/notifications/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preferences }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update preferences");
  }
  return response.json();
}

async function updateSinglePreference(
  notificationType: NotificationType,
  updates: Partial<NotificationPreference>
) {
  const response = await fetch("/api/notifications/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationType, ...updates }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update preference");
  }
  return response.json();
}

async function fetchDiscordConnection() {
  const response = await fetch("/api/discord/status");
  if (!response.ok) {
    if (response.status === 404) return null;
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch Discord connection");
  }
  return response.json();
}

async function disconnectDiscord() {
  const response = await fetch("/api/discord/disconnect", {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to disconnect Discord");
  }
  return response.json();
}

// Hooks
export function useNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
}) {
  return useQuery<{
    notifications: Notification[];
    unreadCount: number;
    hasMore: boolean;
  }>({
    queryKey: ["notifications", options],
    queryFn: () => fetchNotifications(options || {}),
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false, // Don't retry on failure (e.g., if table doesn't exist)
    staleTime: 1000 * 60, // Consider data stale after 1 minute
  });
}

export function useUnreadCount() {
  const { data } = useNotifications({ limit: 1 });
  return data?.unreadCount || 0;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds?: string[]) => markAsRead(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useArchiveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId?: string) => archiveNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery<{
    preferences: NotificationPreference[];
    discordConnected: boolean;
    discordUsername?: string;
  }>({
    queryKey: ["notification-preferences"],
    queryFn: fetchPreferences,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });
}

export function useUpdateSinglePreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationType,
      ...updates
    }: Partial<NotificationPreference> & { notificationType: NotificationType }) =>
      updateSinglePreference(notificationType, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });
}

export function useDiscordConnection() {
  return useQuery<DiscordConnection | null>({
    queryKey: ["discord-connection"],
    queryFn: fetchDiscordConnection,
    retry: false,
  });
}

export function useDisconnectDiscord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectDiscord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discord-connection"] });
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });
}

// Helper to get notification icon based on type
export function getNotificationIcon(type: NotificationType): string {
  return NOTIFICATION_TYPE_INFO[type]?.icon || "🔔";
}

// Helper to format notification time
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
