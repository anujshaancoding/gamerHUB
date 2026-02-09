"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { Clan, Game, ClanGame } from "@/types/database";
import { queryKeys, STALE_TIMES } from "@/lib/query";

interface ClanWithDetails extends Clan {
  primary_game: Game | null;
  clan_games: (ClanGame & { game: Game })[];
  member_count: number;
}

interface UseClansOptions {
  search?: string;
  game?: string;
  region?: string;
  recruiting?: boolean;
  limit?: number;
}

interface ClansResponse {
  clans: ClanWithDetails[];
  total: number;
}

async function fetchClans(
  params: UseClansOptions & { offset: number }
): Promise<ClansResponse> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.game) searchParams.set("game", params.game);
  if (params.region) searchParams.set("region", params.region);
  if (params.recruiting !== undefined) searchParams.set("recruiting", String(params.recruiting));
  searchParams.set("limit", String(params.limit || 20));
  searchParams.set("offset", String(params.offset));

  const response = await fetch(`/api/clans?${searchParams.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch clans");
  }

  return { clans: data.clans, total: data.total };
}

export function useClans(options: UseClansOptions = {}) {
  const queryClient = useQueryClient();
  const { search, game, region, recruiting, limit = 20 } = options;

  const queryKey = queryKeys.clans({
    search,
    game,
    region,
    recruiting,
    limit,
    offset: 0,
  });

  const {
    data,
    isLoading: loading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) =>
      fetchClans({
        search,
        game,
        region,
        recruiting,
        limit,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + page.clans.length, 0);
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    staleTime: STALE_TIMES.CLANS,
  });

  // Flatten all pages into a single array
  const clans = data?.pages.flatMap((page) => page.clans) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const createClanMutation = useMutation({
    mutationFn: async (clanData: {
      name: string;
      tag: string;
      description?: string;
      primary_game_id?: string;
      primary_game_slug?: string;
      custom_game_name?: string;
      region?: string;
      language?: string;
      is_public?: boolean;
      join_type?: "open" | "invite_only" | "closed";
    }) => {
      const response = await fetch("/api/clans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clanData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create clan");
      }

      return data.clan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clans"] });
    },
  });

  const createClan = async (
    clanData: Parameters<typeof createClanMutation.mutateAsync>[0]
  ) => {
    try {
      const clan = await createClanMutation.mutateAsync(clanData);
      return { data: clan };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Failed to create clan") };
    }
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return {
    clans,
    loading: loading || isFetchingNextPage,
    error: error instanceof Error ? error.message : null,
    total,
    hasMore: hasNextPage ?? false,
    refetch: () => refetch(),
    loadMore,
    createClan,
  };
}
