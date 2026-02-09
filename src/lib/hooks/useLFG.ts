"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import type {
  LFGPost,
  LFGApplication,
  LFGFilters,
  CreateLFGPostInput,
  ApplyToLFGInput,
  GameRole,
} from "@/types/lfg";

// Query keys
export const lfgKeys = {
  all: ["lfg"] as const,
  posts: (filters?: LFGFilters) => ["lfg", "posts", filters || {}] as const,
  post: (id: string) => ["lfg", "post", id] as const,
  myPosts: (userId: string) => ["lfg", "my-posts", userId] as const,
  matchingCount: (filters: Record<string, unknown>) =>
    ["lfg", "matching-count", filters] as const,
  gameRoles: (gameId: string) => ["games", "roles", gameId] as const,
};

// Stale times
const STALE_TIMES = {
  POSTS: 1000 * 30, // 30 seconds - LFG posts change frequently
  POST_DETAIL: 1000 * 15, // 15 seconds
  MATCHING_COUNT: 1000 * 10, // 10 seconds
  GAME_ROLES: 1000 * 60 * 60, // 1 hour - roles rarely change
};

interface LFGPostsResponse {
  posts: LFGPost[];
  total: number;
  limit: number;
  offset: number;
}

// Fetch LFG posts with filters
async function fetchLFGPosts(
  filters: LFGFilters & { offset: number; limit: number }
): Promise<LFGPostsResponse> {
  const params = new URLSearchParams();

  if (filters.game) params.set("game", filters.game);
  if (filters.gameMode) params.set("gameMode", filters.gameMode);
  if (filters.role) params.set("role", filters.role);
  if (filters.minRating) params.set("minRating", String(filters.minRating));
  if (filters.maxRating) params.set("maxRating", String(filters.maxRating));
  if (filters.includeUnranked !== undefined)
    params.set("includeUnranked", String(filters.includeUnranked));
  if (filters.region) params.set("region", filters.region);
  if (filters.language) params.set("language", filters.language);
  if (filters.hasSlots) params.set("hasSlots", "true");
  params.set("limit", String(filters.limit));
  params.set("offset", String(filters.offset));

  const response = await fetch(`/api/lfg?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch LFG posts");
  }

  return data;
}

// Hook: List LFG posts with infinite scroll
export function useLFGPosts(filters: LFGFilters = {}, limit = 20) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: loading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: lfgKeys.posts(filters),
    queryFn: ({ pageParam = 0 }) =>
      fetchLFGPosts({ ...filters, offset: pageParam, limit }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (acc, page) => acc + page.posts.length,
        0
      );
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    staleTime: STALE_TIMES.POSTS,
    refetchInterval: STALE_TIMES.POSTS, // Auto-refresh
  });

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return {
    posts,
    loading: loading || isFetchingNextPage,
    error: error instanceof Error ? error.message : null,
    total,
    hasMore: hasNextPage ?? false,
    refetch: () => refetch(),
    loadMore,
  };
}

// Hook: Single LFG post with applications
export function useLFGPost(id: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: lfgKeys.post(id),
    queryFn: async () => {
      const response = await fetch(`/api/lfg/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch post");
      return data.post as LFGPost;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.POST_DETAIL,
    refetchInterval: STALE_TIMES.POST_DETAIL,
  });

  return {
    post: data,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

// Hook: Current user's LFG posts
export function useMyLFGPosts(userId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: lfgKeys.myPosts(userId),
    queryFn: async () => {
      const response = await fetch(`/api/lfg?creatorId=${userId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch posts");
      return data.posts as LFGPost[];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.POST_DETAIL,
  });

  return {
    posts: data || [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

// Hook: Create LFG post
export function useCreateLFGPost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreateLFGPostInput) => {
      const response = await fetch("/api/lfg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create post");
      return data.post as LFGPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lfgKeys.all });
    },
  });

  return {
    createPost: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

// Hook: Update LFG post
export function useUpdateLFGPost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreateLFGPostInput> & { status?: string };
    }) => {
      const response = await fetch(`/api/lfg/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update post");
      return data.post as LFGPost;
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: lfgKeys.all });
      queryClient.setQueryData(lfgKeys.post(post.id), post);
    },
  });

  return {
    updatePost: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

// Hook: Delete/Cancel LFG post
export function useDeleteLFGPost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/lfg/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete post");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lfgKeys.all });
    },
  });

  return {
    deletePost: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

// Hook: Apply to LFG post
export function useApplyToLFG() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: ApplyToLFGInput) => {
      const response = await fetch(`/api/lfg/${input.post_id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to apply");
      return data.application as LFGApplication;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: lfgKeys.post(variables.post_id),
      });
    },
  });

  return {
    apply: mutation.mutateAsync,
    isApplying: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

// Hook: Withdraw application
export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/lfg/${postId}/apply`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to withdraw");
      }
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: lfgKeys.post(postId) });
    },
  });

  return {
    withdraw: mutation.mutateAsync,
    isWithdrawing: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

// Hook: Respond to application (accept/decline)
export function useRespondToApplication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      postId,
      applicationId,
      status,
    }: {
      postId: string;
      applicationId: string;
      status: "accepted" | "declined";
    }) => {
      const response = await fetch(
        `/api/lfg/${postId}/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to respond to application");
      return data.application as LFGApplication;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: lfgKeys.post(variables.postId),
      });
      queryClient.invalidateQueries({ queryKey: lfgKeys.all });
    },
  });

  return {
    respond: mutation.mutateAsync,
    isResponding: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

// Hook: Get matching players count
export function useMatchingPlayersCount(filters: {
  game: string;
  role?: string;
  minRating?: number;
  maxRating?: number;
  region?: string;
}) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: lfgKeys.matchingCount(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("game", filters.game);
      if (filters.role) params.set("role", filters.role);
      if (filters.minRating)
        params.set("minRating", String(filters.minRating));
      if (filters.maxRating)
        params.set("maxRating", String(filters.maxRating));
      if (filters.region) params.set("region", filters.region);

      const response = await fetch(`/api/lfg/matching-count?${params}`);
      const data = await response.json();
      return { count: data.count || 0, total: data.total || 0 };
    },
    enabled: !!filters.game,
    staleTime: STALE_TIMES.MATCHING_COUNT,
    refetchInterval: STALE_TIMES.MATCHING_COUNT,
  });

  return {
    count: data?.count ?? 0,
    total: data?.total ?? 0,
    loading: isLoading,
    refetch,
  };
}

// Hook: Get game roles
export function useGameRoles(gameIdOrSlug: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: lfgKeys.gameRoles(gameIdOrSlug),
    queryFn: async () => {
      const response = await fetch(`/api/games/${gameIdOrSlug}/roles`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch roles");
      return data.roles as GameRole[];
    },
    enabled: !!gameIdOrSlug,
    staleTime: STALE_TIMES.GAME_ROLES,
  });

  return {
    roles: data || [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
}
