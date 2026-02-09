"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useIntegrations, useSyncStatus } from "@/lib/hooks/useIntegrations";
import {
  ConnectionCard,
  GameStatsCard,
  SyncStatus,
} from "@/components/integrations";
import { CocConnectCard } from "@/components/integrations/CocConnectCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Link2, Gamepad2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// Wrapper component for Suspense boundary
export default function ConnectionsSettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>}>
      <ConnectionsSettingsContent />
    </Suspense>
  );
}

function ConnectionsSettingsContent() {
  const searchParams = useSearchParams();
  const {
    connections,
    supportedGames,
    isLoading,
    isConnected,
    getConnection,
    getGameStats,
    getGamesForProvider,
    connect,
    disconnect,
    isDisconnecting,
    sync,
    isSyncing,
    connectCoc,
    isConnectingCoc,
    connectCocError,
  } = useIntegrations();

  // Get sync status for all connections
  const { data: syncStatusData } = useSyncStatus();

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "riot_connected") {
      toast.success("Riot Games account connected successfully!");
    } else if (success === "steam_connected") {
      toast.success("Steam account connected successfully!");
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        riot_auth_failed: "Failed to authenticate with Riot Games",
        steam_verification_failed: "Failed to verify Steam account",
        session_expired: "Session expired. Please try again.",
        invalid_state: "Invalid request. Please try again.",
        storage_failed: "Failed to save connection. Please try again.",
        callback_failed: "Connection failed. Please try again.",
        missing_params: "Invalid callback. Please try again.",
      };
      toast.error(errorMessages[error] || "An error occurred");
    }
  }, [searchParams]);

  const handleSync = (gameId: string) => {
    sync(gameId, {
      onSuccess: () => {
        toast.success(`${gameId} stats synced successfully!`);
      },
      onError: () => {
        toast.error(`Failed to sync ${gameId} stats`);
      },
    });
  };

  const handleSyncAll = () => {
    // Sync all connected games
    const riotConnection = getConnection("riot");
    const steamConnection = getConnection("steam");
    const supercellConnection = getConnection("supercell");

    if (riotConnection) {
      sync("valorant");
    }
    if (steamConnection) {
      sync("cs2");
    }
    if (supercellConnection) {
      sync("coc");
    }

    toast.info("Syncing all connected games...");
  };

  const handleConnectCoc = (playerTag: string) => {
    connectCoc(playerTag, {
      onSuccess: () => {
        toast.success("Clash of Clans account connected successfully!");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to connect Clash of Clans account");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const riotConnection = getConnection("riot");
  const steamConnection = getConnection("steam");
  const supercellConnection = getConnection("supercell");
  const hasAnyConnection =
    isConnected("riot") || isConnected("steam") || isConnected("supercell");

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <Link2 className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Game Connections</h1>
            <p className="text-sm text-zinc-400">
              Connect your gaming accounts to sync stats and achievements
            </p>
          </div>
        </div>

        {hasAnyConnection && (
          <Button
            onClick={handleSyncAll}
            disabled={isSyncing}
            variant="outline"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync All
          </Button>
        )}
      </div>

      {/* Connection Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Platforms</h2>

        <ConnectionCard
          provider="riot"
          isConnected={!!isConnected("riot")}
          username={riotConnection?.provider_username}
          avatarUrl={riotConnection?.provider_avatar_url || undefined}
          connectedAt={riotConnection?.connected_at}
          lastSynced={riotConnection?.last_synced_at || undefined}
          onConnect={() => connect("riot")}
          onDisconnect={() => disconnect("riot")}
          isDisconnecting={isDisconnecting}
        />

        <ConnectionCard
          provider="steam"
          isConnected={!!isConnected("steam")}
          username={steamConnection?.provider_username}
          avatarUrl={steamConnection?.provider_avatar_url || undefined}
          connectedAt={steamConnection?.connected_at}
          lastSynced={steamConnection?.last_synced_at || undefined}
          onConnect={() => connect("steam")}
          onDisconnect={() => disconnect("steam")}
          isDisconnecting={isDisconnecting}
        />

        <CocConnectCard
          isConnected={!!isConnected("supercell")}
          username={supercellConnection?.provider_username}
          connectedAt={supercellConnection?.connected_at}
          lastSynced={supercellConnection?.last_synced_at || undefined}
          metadata={supercellConnection?.metadata}
          onConnect={handleConnectCoc}
          onDisconnect={() => disconnect("supercell")}
          isConnecting={isConnectingCoc}
          isDisconnecting={isDisconnecting}
          error={connectCocError}
        />
      </div>

      {/* Game Stats */}
      {hasAnyConnection && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Game Stats
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Riot Games */}
            {isConnected("riot") && (
              <>
                {getGamesForProvider("riot").map((game) => {
                  const stats = getGameStats(game.id);
                  return (
                    <GameStatsCard
                      key={game.id}
                      gameId={game.id}
                      gameName={game.name}
                      stats={(stats?.stats as Record<string, unknown>) || {}}
                      rankInfo={(stats?.rank_info as Record<string, unknown>) || {}}
                      statFields={game.stat_fields}
                      syncedAt={stats?.synced_at || null}
                      onSync={() => handleSync(game.id)}
                      isSyncing={isSyncing}
                    />
                  );
                })}
              </>
            )}

            {/* Steam */}
            {isConnected("steam") && (
              <>
                {getGamesForProvider("steam").map((game) => {
                  const stats = getGameStats(game.id);
                  return (
                    <GameStatsCard
                      key={game.id}
                      gameId={game.id}
                      gameName={game.name}
                      stats={(stats?.stats as Record<string, unknown>) || {}}
                      rankInfo={(stats?.rank_info as Record<string, unknown>) || {}}
                      statFields={game.stat_fields}
                      syncedAt={stats?.synced_at || null}
                      onSync={() => handleSync(game.id)}
                      isSyncing={isSyncing}
                    />
                  );
                })}
              </>
            )}

            {/* Supercell (Clash of Clans) */}
            {isConnected("supercell") && (
              <>
                {getGamesForProvider("supercell").map((game) => {
                  const stats = getGameStats(game.id);
                  return (
                    <GameStatsCard
                      key={game.id}
                      gameId={game.id}
                      gameName={game.name}
                      stats={(stats?.stats as Record<string, unknown>) || {}}
                      rankInfo={(stats?.rank_info as Record<string, unknown>) || {}}
                      statFields={game.stat_fields}
                      syncedAt={stats?.synced_at || null}
                      onSync={() => handleSync(game.id)}
                      isSyncing={isSyncing}
                    />
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* Sync Status */}
      {syncStatusData && syncStatusData.jobs.length > 0 && (
        <SyncStatus
          jobs={syncStatusData.jobs}
          isSyncing={syncStatusData.isSyncing}
          activeSyncJob={syncStatusData.activeSyncJob}
        />
      )}

      {/* Empty State */}
      {!hasAnyConnection && (
        <Card className="p-8 text-center bg-zinc-900/50 border-zinc-800">
          <Link2 className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            No Accounts Connected
          </h2>
          <p className="text-zinc-400 mb-4">
            Connect your Riot Games, Steam, or Clash of Clans account to sync
            your game stats and display them on your profile.
          </p>
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => connect("riot")}
              className="bg-red-600 hover:bg-red-700"
            >
              Connect Riot Games
            </Button>
            <Button
              onClick={() => connect("steam")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Connect Steam
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
