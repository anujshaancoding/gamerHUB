"use client";

import { useCallback, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";

interface WallPostProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_premium: boolean | null;
}

export interface WallPost {
  id: string;
  clan_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  is_pinned: boolean;
  reactions: Record<string, string[]>;
  created_at: string;
  updated_at: string;
  profile: WallPostProfile;
}

const WALL_PAGE_SIZE = 20;

export function useClanWall(clanId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["clan-wall", clanId];

  const {
    data,
    isLoading: loading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        limit: String(WALL_PAGE_SIZE),
        offset: String(pageParam),
      });
      const response = await fetch(
        `/api/clans/${clanId}/wall?${params.toString()}`
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch wall posts");
      }
      return response.json() as Promise<{
        posts: WallPost[];
        total: number;
        limit: number;
        offset: number;
      }>;
    },
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.limit;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
    initialPageParam: 0,
    enabled: !!clanId,
    staleTime: 1000 * 60, // 1 minute
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];
  const total = data?.pages[0]?.total || 0;

  const createPostMutation = useMutation({
    mutationFn: async ({
      content,
      image_url,
    }: {
      content: string;
      image_url?: string;
    }) => {
      const response = await fetch(`/api/clans/${clanId}/wall`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, image_url }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create post");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/clans/${clanId}/wall/${postId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete post");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleReaction = useCallback(
    async (postId: string, emoji: string) => {
      const response = await fetch(`/api/clans/${clanId}/wall/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: emoji }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to toggle reaction");
      }
      queryClient.invalidateQueries({ queryKey });
    },
    [clanId, queryClient, queryKey]
  );

  const togglePin = useCallback(
    async (postId: string, pinned: boolean) => {
      const response = await fetch(`/api/clans/${clanId}/wall/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: pinned }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to toggle pin");
      }
      queryClient.invalidateQueries({ queryKey });
    },
    [clanId, queryClient, queryKey]
  );

  return {
    posts,
    total,
    loading,
    error: error instanceof Error ? error.message : null,
    hasMore: !!hasNextPage,
    loadingMore: isFetchingNextPage,
    loadMore: () => fetchNextPage(),
    createPost: createPostMutation.mutateAsync,
    creatingPost: createPostMutation.isPending,
    deletePost: deletePostMutation.mutateAsync,
    toggleReaction,
    togglePin,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}
