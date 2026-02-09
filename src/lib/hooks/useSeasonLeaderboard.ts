"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { LeaderboardEntry } from "@/types/database";
import { queryKeys, STALE_TIMES } from "@/lib/query";

interface UseSeasonLeaderboardOptions {
  seasonId?: string;
  gameId?: string;
  region?: string;
  limit?: number;
}

interface SeasonLeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  season_id: string | null;
}

async function fetchSeasonLeaderboard(
  params: UseSeasonLeaderboardOptions & { offset: number }
): Promise<SeasonLeaderboardResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", (params.limit || 50).toString());
  searchParams.set("offset", params.offset.toString());

  if (params.seasonId) searchParams.set("season_id", params.seasonId);
  if (params.gameId) searchParams.set("game_id", params.gameId);
  if (params.region) searchParams.set("region", params.region);

  const response = await fetch(`/api/leaderboards?${searchParams.toString()}`);

  if (!response.ok) {
    // Handle non-JSON error responses (like 404 HTML pages)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      throw new Error(data.error || "Failed to fetch leaderboard");
    }
    throw new Error(`Failed to fetch leaderboard: ${response.status}`);
  }

  const data = await response.json();

  return {
    entries: data.entries || [],
    total: data.total || 0,
    season_id: data.season_id || null,
  };
}

interface UseSeasonLeaderboardReturn {
  entries: LeaderboardEntry[];
  total: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  seasonId: string | null;
}

export function useSeasonLeaderboard(
  options: UseSeasonLeaderboardOptions = {}
): UseSeasonLeaderboardReturn {
  const limit = options.limit || 50;

  const queryKey = queryKeys.seasonLeaderboard({
    seasonId: options.seasonId,
    gameId: options.gameId,
    region: options.region,
    limit,
    offset: 0,
  });

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) =>
      fetchSeasonLeaderboard({
        ...options,
        limit,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + page.entries.length, 0);
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    staleTime: STALE_TIMES.LEADERBOARD,
  });

  // Flatten all pages into a single array
  const entries = data?.pages.flatMap((page) => page.entries) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const seasonId = data?.pages[0]?.season_id ?? null;

  const loadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  return {
    entries,
    total,
    loading: isLoading || isFetchingNextPage,
    error: error instanceof Error ? error.message : null,
    hasMore: hasNextPage ?? false,
    loadMore,
    refetch: async () => { await refetch(); },
    seasonId,
  };
}

interface UseMySeasonRankingOptions {
  seasonId?: string;
  gameId?: string;
}

interface UseMySeasonRankingReturn {
  rankings: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

async function fetchMyRanking(
  options: UseMySeasonRankingOptions
): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams();
  if (options.seasonId) params.set("season_id", options.seasonId);
  if (options.gameId) params.set("game_id", options.gameId);

  const response = await fetch(`/api/leaderboards/me?${params.toString()}`);

  if (!response.ok) {
    if (response.status === 401) {
      return [];
    }
    // Handle non-JSON error responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      throw new Error(data.error || "Failed to fetch ranking");
    }
    throw new Error(`Failed to fetch ranking: ${response.status}`);
  }

  const data = await response.json();
  return data.rankings || [];
}

export function useMySeasonRanking(
  options: UseMySeasonRankingOptions = {}
): UseMySeasonRankingReturn {
  const {
    data: rankings,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.myRanking({
      seasonId: options.seasonId,
      gameId: options.gameId,
    }),
    queryFn: () => fetchMyRanking(options),
    staleTime: STALE_TIMES.USER_PROGRESSION,
  });

  return {
    rankings: rankings ?? [],
    loading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => { await refetch(); },
  };
}
