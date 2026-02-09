"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES } from "@/lib/query";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  total_xp?: number;
  xp?: number;
  active_title?: { name: string; color: string | null } | null;
  active_frame?: { image_url: string } | null;
  is_current_user: boolean;
}

interface UseLeaderboardOptions {
  type?: "xp" | "level";
  gameId?: string;
  region?: string;
  limit?: number;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  user_rank: LeaderboardEntry | null;
}

async function fetchLeaderboardData(
  options: UseLeaderboardOptions
): Promise<LeaderboardResponse> {
  const { type = "xp", gameId, region, limit = 100 } = options;

  const params = new URLSearchParams();
  params.set("type", type);
  params.set("limit", String(limit));
  if (gameId) params.set("game_id", gameId);
  if (region) params.set("region", region);

  const response = await fetch(`/api/leaderboard?${params}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch leaderboard");
  }

  return {
    entries: data.entries || [],
    user_rank: data.user_rank || null,
  };
}

export function useLeaderboard(options: UseLeaderboardOptions = {}) {
  const { type = "xp", gameId, region, limit = 100 } = options;

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.leaderboard({ type, gameId, region, limit }),
    queryFn: () => fetchLeaderboardData(options),
    staleTime: STALE_TIMES.LEADERBOARD,
  });

  const entries = data?.entries ?? [];
  const userRank = data?.user_rank ?? null;

  // Get top N entries
  const getTopEntries = (n: number) => entries.slice(0, n);

  // Check if user is in top N
  const isUserInTop = (n: number) =>
    entries.slice(0, n).some((e) => e.is_current_user);

  return {
    entries,
    userRank,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    getTopEntries,
    isUserInTop,
  };
}
