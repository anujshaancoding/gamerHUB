"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { SeasonWithDetails, Season } from "@/types/database";
import { queryKeys, STALE_TIMES } from "@/lib/query";

interface UseSeasonOptions {
  seasonId?: string;
}

interface UseSeasonReturn {
  season: SeasonWithDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

async function fetchSeason(seasonId?: string): Promise<SeasonWithDetails> {
  const url = seasonId ? `/api/seasons/${seasonId}` : "/api/seasons/current";

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch season");
  }

  return data.season;
}

export function useSeason(options: UseSeasonOptions = {}): UseSeasonReturn {
  const {
    data: season,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: options.seasonId
      ? queryKeys.season(options.seasonId)
      : queryKeys.currentSeason,
    queryFn: () => fetchSeason(options.seasonId),
    staleTime: STALE_TIMES.SEASON,
  });

  return {
    season: season ?? null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await refetch();
    },
  };
}

interface UseSeasonsOptions {
  status?: string;
  gameId?: string;
  limit?: number;
}

interface SeasonsResponse {
  seasons: Season[];
  total: number;
}

interface UseSeasonsReturn {
  seasons: Season[];
  total: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

async function fetchSeasons(
  params: UseSeasonsOptions & { offset: number }
): Promise<SeasonsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", (params.limit || 10).toString());
  searchParams.set("offset", params.offset.toString());

  if (params.status) searchParams.set("status", params.status);
  if (params.gameId) searchParams.set("game_id", params.gameId);

  const response = await fetch(`/api/seasons?${searchParams.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch seasons");
  }

  return { seasons: data.seasons, total: data.total };
}

export function useSeasons(options: UseSeasonsOptions = {}): UseSeasonsReturn {
  const limit = options.limit || 10;

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["seasons", options],
    queryFn: ({ pageParam = 0 }) =>
      fetchSeasons({
        ...options,
        limit,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + page.seasons.length, 0);
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    staleTime: STALE_TIMES.SEASON,
  });

  // Flatten all pages into a single array
  const seasons = data?.pages.flatMap((page) => page.seasons) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const loadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  return {
    seasons,
    total,
    loading: isLoading || isFetchingNextPage,
    error: error instanceof Error ? error.message : null,
    hasMore: hasNextPage ?? false,
    loadMore,
    refetch: async () => {
      await refetch();
    },
  };
}
