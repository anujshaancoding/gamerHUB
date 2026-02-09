"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type IntegrationProvider = "riot" | "steam" | "supercell";

interface GameStats {
  id: string;
  game_id: string;
  game_mode: string;
  season: string;
  stats: Record<string, unknown>;
  rank_info: Record<string, unknown>;
  synced_at: string;
}

interface GameConnection {
  id: string;
  provider: IntegrationProvider;
  provider_user_id: string;
  provider_username: string;
  provider_avatar_url: string | null;
  connected_at: string;
  last_synced_at: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  game_stats: GameStats[];
}

interface SupportedGame {
  id: string;
  name: string;
  provider: IntegrationProvider;
  icon_url: string | null;
  banner_url: string | null;
  description: string;
  stat_fields: { key: string; label: string }[];
  rank_system: { tiers: string[] };
  is_active: boolean;
  display_order: number;
}

interface IntegrationsResponse {
  connections: GameConnection[];
  supportedGames: SupportedGame[];
}

interface SyncJob {
  id: string;
  user_id: string;
  connection_id: string;
  sync_type: string;
  status: "pending" | "syncing" | "completed" | "failed";
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  stats_synced: number;
  matches_synced: number;
  created_at: string;
}

interface SyncStatusResponse {
  jobs: SyncJob[];
  isSyncing: boolean;
  activeSyncJob: SyncJob | null;
}

// Fetch all integrations
async function fetchIntegrations(): Promise<IntegrationsResponse> {
  const res = await fetch("/api/integrations");
  if (!res.ok) throw new Error("Failed to fetch integrations");
  return res.json();
}

// Disconnect a provider
async function disconnectProvider(provider: string): Promise<void> {
  const res = await fetch(`/api/integrations/${provider}/disconnect`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to disconnect");
}

// Sync a game
async function syncGame(
  gameId: string
): Promise<{ success: boolean; stats: Record<string, unknown> }> {
  const res = await fetch(`/api/integrations/sync/${gameId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to sync");
  return res.json();
}

// Connect CoC account (POST-based, not OAuth redirect)
async function connectCocAccount(
  playerTag: string
): Promise<{ success: boolean; player: Record<string, unknown> }> {
  const res = await fetch("/api/integrations/coc/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerTag }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to connect Clash of Clans account");
  }
  return res.json();
}

// Fetch sync status
async function fetchSyncStatus(
  connectionId?: string
): Promise<SyncStatusResponse> {
  const params = connectionId ? `?connectionId=${connectionId}` : "";
  const res = await fetch(`/api/integrations/status${params}`);
  if (!res.ok) throw new Error("Failed to fetch sync status");
  return res.json();
}

export function useIntegrations() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["integrations"],
    queryFn: fetchIntegrations,
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["sync-status"] });
    },
  });

  const connectCocMutation = useMutation({
    mutationFn: connectCocAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });

  // Helper to check if a provider is connected
  const isConnected = (provider: IntegrationProvider) => {
    return data?.connections.some(
      (c) => c.provider === provider && c.is_active
    );
  };

  // Helper to get connection for a provider
  const getConnection = (provider: IntegrationProvider) => {
    return data?.connections.find((c) => c.provider === provider && c.is_active);
  };

  // Helper to get stats for a specific game
  const getGameStats = (gameId: string) => {
    for (const connection of data?.connections || []) {
      const stats = connection.game_stats.find((s) => s.game_id === gameId);
      if (stats) return stats;
    }
    return null;
  };

  // Helper to get games for a provider
  const getGamesForProvider = (provider: IntegrationProvider) => {
    return (
      data?.supportedGames.filter((g) => g.provider === provider) || []
    );
  };

  // Connect to a provider (OAuth redirect for riot/steam, skip for supercell)
  const connect = (provider: IntegrationProvider) => {
    if (provider === "supercell") {
      // CoC uses POST-based connection via connectCoc mutation
      return;
    }
    window.location.href = `/api/integrations/${provider}/connect`;
  };

  return {
    connections: data?.connections || [],
    supportedGames: data?.supportedGames || [],
    isLoading,
    error,
    refetch,

    // Connection helpers
    isConnected,
    getConnection,
    getGameStats,
    getGamesForProvider,

    // Actions
    connect,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,

    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,

    // CoC-specific (POST-based connect)
    connectCoc: connectCocMutation.mutate,
    isConnectingCoc: connectCocMutation.isPending,
    connectCocError: connectCocMutation.error,
  };
}

export function useSyncStatus(connectionId?: string) {
  return useQuery({
    queryKey: ["sync-status", connectionId],
    queryFn: () => fetchSyncStatus(connectionId),
    refetchInterval: (query) => {
      // Poll every 2 seconds while syncing
      return query.state.data?.isSyncing ? 2000 : false;
    },
  });
}

// Hook for getting stats for a specific user (public profiles)
export function useUserGameStats(userId: string, gameId?: string) {
  return useQuery({
    queryKey: ["user-game-stats", userId, gameId],
    queryFn: async () => {
      const params = gameId ? `?gameId=${gameId}` : "";
      const res = await fetch(`/api/users/${userId}/game-stats${params}`);
      if (!res.ok) throw new Error("Failed to fetch user game stats");
      return res.json();
    },
    enabled: !!userId,
  });
}
