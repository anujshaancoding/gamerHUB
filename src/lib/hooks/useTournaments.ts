"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type {
  TournamentWithDetails,
  TournamentStatus,
  TournamentFormat,
} from "@/types/database";
import { queryKeys, STALE_TIMES } from "@/lib/query";

interface UseTournamentsOptions {
  status?: TournamentStatus;
  gameId?: string;
  organizerClanId?: string;
  search?: string;
  limit?: number;
}

interface TournamentsResponse {
  tournaments: TournamentWithDetails[];
  total: number;
}

async function fetchTournaments(
  params: UseTournamentsOptions & { offset: number }
): Promise<TournamentsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", (params.limit || 20).toString());
  searchParams.set("offset", params.offset.toString());

  if (params.status) searchParams.set("status", params.status);
  if (params.gameId) searchParams.set("game_id", params.gameId);
  if (params.organizerClanId) searchParams.set("organizer_clan_id", params.organizerClanId);
  if (params.search) searchParams.set("search", params.search);

  const response = await fetch(`/api/tournaments?${searchParams.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch tournaments");
  }

  return { tournaments: data.tournaments, total: data.total };
}

export function useTournaments(options: UseTournamentsOptions = {}) {
  const queryClient = useQueryClient();
  const { status, gameId, organizerClanId, search, limit = 20 } = options;

  const queryKey = queryKeys.tournaments({
    status,
    gameId,
    search,
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
      fetchTournaments({
        status,
        gameId,
        organizerClanId,
        search,
        limit,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + page.tournaments.length, 0);
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    staleTime: STALE_TIMES.TOURNAMENTS,
  });

  // Flatten all pages into a single array
  const tournaments = data?.pages.flatMap((page) => page.tournaments) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const createTournamentMutation = useMutation({
    mutationFn: async (tournamentData: {
      name: string;
      description?: string;
      banner_url?: string;
      organizer_clan_id?: string;
      game_id?: string;
      format?: TournamentFormat;
      team_size?: number;
      max_teams?: number;
      min_teams?: number;
      registration_start: string;
      registration_end: string;
      start_date: string;
      prize_pool?: {
        total: number;
        currency: string;
        distribution: { place: number; amount: number; percentage: number }[];
      };
      rules?: string;
      settings?: Record<string, unknown>;
    }) => {
      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tournamentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create tournament");
      }

      return data.tournament;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });

  const createTournament = async (
    tournamentData: Parameters<typeof createTournamentMutation.mutateAsync>[0]
  ): Promise<{ data?: TournamentWithDetails; error?: string }> => {
    try {
      const tournament = await createTournamentMutation.mutateAsync(tournamentData);
      return { data: tournament };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to create tournament" };
    }
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return {
    tournaments,
    loading: loading || isFetchingNextPage,
    error: error instanceof Error ? error.message : null,
    total,
    hasMore: hasNextPage ?? false,
    refetch: () => refetch(),
    loadMore,
    createTournament,
  };
}
