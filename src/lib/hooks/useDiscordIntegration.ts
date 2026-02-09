import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  DiscordConnectionStatus,
  UpdateDiscordSettingsRequest,
  CrosspostRequest,
  ImportFriendsResponse,
  DiscordFriend,
  DiscordWebhook,
} from "@/types/discord";

// Query keys
const DISCORD_KEYS = {
  status: ["discord", "status"] as const,
  friends: ["discord", "friends"] as const,
  webhooks: ["discord", "webhooks"] as const,
  crossposts: ["discord", "crossposts"] as const,
};

// Fetch Discord connection status
async function fetchDiscordStatus(): Promise<DiscordConnectionStatus> {
  const response = await fetch("/api/integrations/discord/settings");
  if (!response.ok) {
    throw new Error("Failed to fetch Discord status");
  }
  return response.json();
}

// Update Discord settings
async function updateDiscordSettings(
  settings: UpdateDiscordSettingsRequest
): Promise<DiscordConnectionStatus> {
  const response = await fetch("/api/integrations/discord/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw new Error("Failed to update Discord settings");
  }
  return response.json();
}

// Disconnect Discord
async function disconnectDiscord(): Promise<void> {
  const response = await fetch("/api/integrations/discord/settings", {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to disconnect Discord");
  }
}

// Fetch Discord friends
async function fetchDiscordFriends(): Promise<{
  friends: DiscordFriend[];
  total: number;
  matched_count: number;
}> {
  const response = await fetch("/api/integrations/discord/friends");
  if (!response.ok) {
    throw new Error("Failed to fetch Discord friends");
  }
  return response.json();
}

// Import Discord friends
async function importDiscordFriends(): Promise<ImportFriendsResponse> {
  const response = await fetch("/api/integrations/discord/friends", {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to import Discord friends");
  }
  return response.json();
}

// Send friend invite
async function sendFriendInvite(friendId: string): Promise<void> {
  const response = await fetch("/api/integrations/discord/friends", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ friend_id: friendId }),
  });
  if (!response.ok) {
    throw new Error("Failed to send invite");
  }
}

// Fetch webhooks
async function fetchWebhooks(): Promise<{ webhooks: DiscordWebhook[] }> {
  const response = await fetch("/api/integrations/discord/webhooks");
  if (!response.ok) {
    throw new Error("Failed to fetch webhooks");
  }
  return response.json();
}

// Add webhook
async function addWebhook(data: {
  webhook_url: string;
  guild_id: string;
  guild_name: string;
  channel_id: string;
  channel_name: string;
}): Promise<{ webhook: DiscordWebhook }> {
  const response = await fetch("/api/integrations/discord/webhooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add webhook");
  }
  return response.json();
}

// Update webhook
async function updateWebhookSettings(
  webhookId: string,
  settings: Partial<{
    is_active: boolean;
    post_lfg: boolean;
    post_tournaments: boolean;
    post_clan_recruitment: boolean;
  }>
): Promise<{ webhook: DiscordWebhook }> {
  const response = await fetch("/api/integrations/discord/webhooks", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ webhook_id: webhookId, ...settings }),
  });
  if (!response.ok) {
    throw new Error("Failed to update webhook");
  }
  return response.json();
}

// Delete webhook
async function deleteWebhookById(webhookId: string): Promise<void> {
  const response = await fetch(
    `/api/integrations/discord/webhooks?id=${webhookId}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    throw new Error("Failed to delete webhook");
  }
}

// Crosspost content
async function crosspostContent(
  data: CrosspostRequest
): Promise<{ success: boolean; crosspost_id?: string }> {
  const response = await fetch("/api/integrations/discord/crosspost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to crosspost");
  }
  return response.json();
}

// Main hook
export function useDiscordIntegration() {
  const queryClient = useQueryClient();

  // Status query
  const statusQuery = useQuery({
    queryKey: DISCORD_KEYS.status,
    queryFn: fetchDiscordStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Friends query (only if connected)
  const friendsQuery = useQuery({
    queryKey: DISCORD_KEYS.friends,
    queryFn: fetchDiscordFriends,
    enabled: statusQuery.data?.connected ?? false,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Webhooks query (only if connected)
  const webhooksQuery = useQuery({
    queryKey: DISCORD_KEYS.webhooks,
    queryFn: fetchWebhooks,
    enabled: statusQuery.data?.connected ?? false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: updateDiscordSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(DISCORD_KEYS.status, data);
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: disconnectDiscord,
    onSuccess: () => {
      queryClient.setQueryData(DISCORD_KEYS.status, {
        connected: false,
        discord_username: null,
        discord_avatar_url: null,
        settings: {},
      });
      queryClient.invalidateQueries({ queryKey: DISCORD_KEYS.friends });
      queryClient.invalidateQueries({ queryKey: DISCORD_KEYS.webhooks });
    },
  });

  // Import friends mutation
  const importFriendsMutation = useMutation({
    mutationFn: importDiscordFriends,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCORD_KEYS.friends });
    },
  });

  // Send invite mutation
  const sendInviteMutation = useMutation({
    mutationFn: sendFriendInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCORD_KEYS.friends });
    },
  });

  // Add webhook mutation
  const addWebhookMutation = useMutation({
    mutationFn: addWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCORD_KEYS.webhooks });
    },
  });

  // Update webhook mutation
  const updateWebhookMutation = useMutation({
    mutationFn: ({
      webhookId,
      settings,
    }: {
      webhookId: string;
      settings: Parameters<typeof updateWebhookSettings>[1];
    }) => updateWebhookSettings(webhookId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCORD_KEYS.webhooks });
    },
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: deleteWebhookById,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCORD_KEYS.webhooks });
    },
  });

  // Crosspost mutation
  const crosspostMutation = useMutation({
    mutationFn: crosspostContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCORD_KEYS.crossposts });
    },
  });

  return {
    // Status
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isConnecting: false, // Used for UI state when redirecting

    // Settings
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending,

    // Disconnect
    disconnect: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,

    // Friends
    friends: friendsQuery.data?.friends,
    isLoadingFriends: friendsQuery.isLoading,
    importFriends: importFriendsMutation.mutateAsync,
    isImporting: importFriendsMutation.isPending,
    sendInvite: sendInviteMutation.mutateAsync,

    // Webhooks
    webhooks: webhooksQuery.data?.webhooks,
    isLoadingWebhooks: webhooksQuery.isLoading,
    addWebhook: addWebhookMutation.mutateAsync,
    isAddingWebhook: addWebhookMutation.isPending,
    updateWebhook: (
      webhookId: string,
      settings: Parameters<typeof updateWebhookSettings>[1]
    ) => updateWebhookMutation.mutateAsync({ webhookId, settings }),
    deleteWebhook: deleteWebhookMutation.mutateAsync,

    // Crosspost
    crosspost: crosspostMutation.mutateAsync,
    isCrossposting: crosspostMutation.isPending,

    // Errors
    statusError: statusQuery.error,
    friendsError: friendsQuery.error,
  };
}

// Simpler hook for just checking connection status
export function useDiscordStatus() {
  const query = useQuery({
    queryKey: DISCORD_KEYS.status,
    queryFn: fetchDiscordStatus,
    staleTime: 1000 * 60 * 5,
  });

  return {
    isConnected: query.data?.connected ?? false,
    username: query.data?.discord_username,
    avatarUrl: query.data?.discord_avatar_url,
    isLoading: query.isLoading,
  };
}
