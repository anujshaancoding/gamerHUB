"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/db/client-browser";
import { queryKeys, STALE_TIMES } from "@/lib/query";
import type {
  Clan,
  ClanMember,
  ClanGame,
  ClanAchievement,
  Game,
  Profile,
} from "@/types/database";

interface ClanWithDetails extends Clan {
  primary_game: Game | null;
  clan_members: (ClanMember & { profile: Profile })[];
  clan_games: (ClanGame & { game: Game })[];
  clan_achievements: ClanAchievement[];
  member_count: number;
}

async function fetchClanData(clanIdOrSlug: string): Promise<ClanWithDetails> {
  const db = createClient();

  // Try by ID first, then by slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    clanIdOrSlug
  );

  let query = db
    .from("clans")
    .select(
      `
      *,
      primary_game:games!clans_primary_game_id_fkey(*),
      clan_members(
        *,
        profile:profiles!clan_members_user_id_fkey(*)
      ),
      clan_games(
        *,
        game:games!clan_games_game_id_fkey(*)
      ),
      clan_achievements(*)
    `
    );

  if (isUUID) {
    query = query.eq("id", clanIdOrSlug);
  } else {
    query = query.eq("slug", clanIdOrSlug);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    throw new Error("Clan not found");
  }

  const clanData = data as unknown as ClanWithDetails;

  return {
    ...clanData,
    member_count: clanData.clan_members?.length || 0,
  };
}

export function useClan(clanIdOrSlug: string | null) {
  const queryClient = useQueryClient();

  const {
    data: clan,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.clan(clanIdOrSlug || ""),
    queryFn: () => fetchClanData(clanIdOrSlug!),
    enabled: !!clanIdOrSlug,
    staleTime: STALE_TIMES.CLAN_DETAILS,
  });

  const updateClanMutation = useMutation({
    mutationFn: async (updates: Partial<Clan>) => {
      if (!clan) throw new Error("No clan loaded");

      const response = await fetch(`/api/clans/${clan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update clan");
      }

      return data.clan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clan(clanIdOrSlug || "") });
      queryClient.invalidateQueries({ queryKey: ["clans"] });
    },
  });

  const deleteClanMutation = useMutation({
    mutationFn: async () => {
      if (!clan) throw new Error("No clan loaded");

      const response = await fetch(`/api/clans/${clan.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete clan");
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clans"] });
    },
  });

  const updateClan = async (updates: Partial<Clan>) => {
    try {
      const result = await updateClanMutation.mutateAsync(updates);
      return { data: result };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Failed to update clan") };
    }
  };

  const deleteClan = async () => {
    try {
      await deleteClanMutation.mutateAsync();
      return { success: true };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Failed to delete clan") };
    }
  };

  return {
    clan: clan ?? null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    updateClan,
    deleteClan,
  };
}
