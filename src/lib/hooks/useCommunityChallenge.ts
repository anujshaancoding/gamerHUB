"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { ChallengeWithProgress, ChallengeProgress } from "@/types/database";
import { queryKeys, STALE_TIMES } from "@/lib/query";

interface UseCommunityChallengesOptions {
  seasonId?: string;
  gameId?: string;
  periodType?: string;
  difficulty?: string;
  status?: string;
  limit?: number;
}

interface ChallengesResponse {
  challenges: ChallengeWithProgress[];
  total: number;
}

interface UseCommunityChallengesReturn {
  challenges: ChallengeWithProgress[];
  total: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

async function fetchChallenges(
  params: UseCommunityChallengesOptions & { offset: number }
): Promise<ChallengesResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", (params.limit || 20).toString());
  searchParams.set("offset", params.offset.toString());

  if (params.seasonId) searchParams.set("season_id", params.seasonId);
  if (params.gameId) searchParams.set("game_id", params.gameId);
  if (params.periodType) searchParams.set("period_type", params.periodType);
  if (params.difficulty) searchParams.set("difficulty", params.difficulty);
  if (params.status) searchParams.set("status", params.status);

  const response = await fetch(
    `/api/community-challenges?${searchParams.toString()}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch challenges");
  }

  return { challenges: data.challenges, total: data.total };
}

export function useCommunityChallenges(
  options: UseCommunityChallengesOptions = {}
): UseCommunityChallengesReturn {
  const limit = options.limit || 20;

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.communityChallenges({
      status: options.status,
      gameId: options.gameId,
    }),
    queryFn: ({ pageParam = 0 }) =>
      fetchChallenges({
        ...options,
        limit,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (acc, page) => acc + page.challenges.length,
        0
      );
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    staleTime: STALE_TIMES.TOURNAMENTS, // Similar update frequency
  });

  // Flatten all pages into a single array
  const challenges = data?.pages.flatMap((page) => page.challenges) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const loadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  return {
    challenges,
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

interface UseCommunityChallengeOptions {
  challengeId: string;
}

interface UseCommunityChallengeReturn {
  challenge: ChallengeWithProgress | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  joinChallenge: () => Promise<ChallengeProgress | null>;
  joining: boolean;
}

async function fetchChallenge(challengeId: string): Promise<ChallengeWithProgress> {
  const response = await fetch(`/api/community-challenges/${challengeId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch challenge");
  }

  return data.challenge;
}

export function useCommunityChallenge(
  options: UseCommunityChallengeOptions
): UseCommunityChallengeReturn {
  const queryClient = useQueryClient();

  const {
    data: challenge,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.communityChallenge(options.challengeId),
    queryFn: () => fetchChallenge(options.challengeId),
    staleTime: STALE_TIMES.TOURNAMENTS,
  });

  const joinMutation = useMutation({
    mutationFn: async (): Promise<ChallengeProgress> => {
      const response = await fetch(
        `/api/community-challenges/${options.challengeId}/join`,
        {
          method: "POST",
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join challenge");
      }

      return data.progress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.communityChallenge(options.challengeId),
      });
      queryClient.invalidateQueries({
        queryKey: ["community-challenges"],
      });
    },
  });

  const joinChallenge = async (): Promise<ChallengeProgress | null> => {
    try {
      const progress = await joinMutation.mutateAsync();
      return progress;
    } catch {
      return null;
    }
  };

  return {
    challenge: challenge ?? null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await refetch();
    },
    joinChallenge,
    joining: joinMutation.isPending,
  };
}
