"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys for friend posts — single source of truth
export const friendPostKeys = {
  all: ["friend-posts"] as const,
  list: (isGuest: boolean) => ["friend-posts", "list", { isGuest }] as const,
  liked: (postId: string) => ["friend-posts", "liked", postId] as const,
};

// Hook: Check if user has liked a friend post
export function useFriendPostLiked(postId: string, userId?: string) {
  return useQuery({
    queryKey: friendPostKeys.liked(postId),
    queryFn: async () => {
      const response = await fetch(`/api/friend-posts/${postId}/like`);
      const data = await response.json();
      return data.liked as boolean;
    },
    enabled: !!postId && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes (server is source of truth)
  });
}

// Hook: Toggle like on a friend post (with optimistic update)
export function useLikeFriendPost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/friend-posts/${postId}/like`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to toggle like");
      return data as { liked: boolean; likes_count: number };
    },
    onMutate: async (postId) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: friendPostKeys.liked(postId) });
      await queryClient.cancelQueries({ queryKey: friendPostKeys.all });

      // Snapshot previous liked state for rollback
      const previousLiked = queryClient.getQueryData<boolean>(friendPostKeys.liked(postId));

      // Optimistically toggle the liked state
      queryClient.setQueryData(friendPostKeys.liked(postId), !previousLiked);

      return { previousLiked };
    },
    onError: (_err, postId, context) => {
      // Rollback on failure
      if (context?.previousLiked !== undefined) {
        queryClient.setQueryData(friendPostKeys.liked(postId), context.previousLiked);
      }
    },
    onSettled: (_data, _error, postId) => {
      // Always refetch to ensure server truth
      queryClient.invalidateQueries({ queryKey: friendPostKeys.liked(postId) });
      queryClient.invalidateQueries({ queryKey: friendPostKeys.all });
    },
  });

  return {
    toggleLike: mutation.mutateAsync,
    isLiking: mutation.isPending,
  };
}
