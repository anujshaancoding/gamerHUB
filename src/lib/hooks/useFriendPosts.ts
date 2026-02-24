"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys for friend posts — single source of truth
export const friendPostKeys = {
  all: ["friend-posts"] as const,
  list: (isGuest: boolean) => ["friend-posts", "list", { isGuest }] as const,
  liked: (postId: string) => ["friend-posts", "liked", postId] as const,
  bookmarked: (postId: string) => ["friend-posts", "bookmarked", postId] as const,
  comments: (postId: string) => ["friend-posts", "comments", postId] as const,
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

// ============================================
// COMMENTS
// ============================================

export interface FriendPostComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user?: {
    username: string;
    display_name: string;
    avatar_url: string;
    is_verified?: boolean;
  };
}

// Hook: Fetch comments for a friend post
export function useFriendPostComments(postId: string, enabled = true) {
  return useQuery({
    queryKey: friendPostKeys.comments(postId),
    queryFn: async () => {
      const response = await fetch(`/api/friend-posts/${postId}/comments`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch comments");
      return data.comments as FriendPostComment[];
    },
    enabled: !!postId && enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook: Add a comment to a friend post
export function useAddFriendPostComment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const response = await fetch(`/api/friend-posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add comment");
      return data as { comment_id: string; comments_count: number };
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: friendPostKeys.comments(variables.postId) });
      queryClient.invalidateQueries({ queryKey: friendPostKeys.all });
    },
  });

  return {
    addComment: mutation.mutateAsync,
    isAdding: mutation.isPending,
  };
}

// Hook: Delete a comment
export function useDeleteFriendPostComment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ postId, commentId }: { postId: string; commentId: string }) => {
      const response = await fetch(`/api/friend-posts/${postId}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete comment");
      return data as { deleted: boolean; comments_count: number };
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: friendPostKeys.comments(variables.postId) });
      queryClient.invalidateQueries({ queryKey: friendPostKeys.all });
    },
  });

  return {
    deleteComment: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}

// ============================================
// BOOKMARKS
// ============================================

// Hook: Check if user has bookmarked a friend post
export function useFriendPostBookmarked(postId: string, userId?: string) {
  return useQuery({
    queryKey: friendPostKeys.bookmarked(postId),
    queryFn: async () => {
      const response = await fetch(`/api/friend-posts/${postId}/bookmark`);
      const data = await response.json();
      return data.bookmarked as boolean;
    },
    enabled: !!postId && !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook: Toggle bookmark on a friend post
export function useBookmarkFriendPost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/friend-posts/${postId}/bookmark`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to toggle bookmark");
      return data as { bookmarked: boolean };
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: friendPostKeys.bookmarked(postId) });
      const previousBookmarked = queryClient.getQueryData<boolean>(friendPostKeys.bookmarked(postId));
      queryClient.setQueryData(friendPostKeys.bookmarked(postId), !previousBookmarked);
      return { previousBookmarked };
    },
    onError: (_err, postId, context) => {
      if (context?.previousBookmarked !== undefined) {
        queryClient.setQueryData(friendPostKeys.bookmarked(postId), context.previousBookmarked);
      }
    },
    onSettled: (_data, _error, postId) => {
      queryClient.invalidateQueries({ queryKey: friendPostKeys.bookmarked(postId) });
    },
  });

  return {
    toggleBookmark: mutation.mutateAsync,
    isBookmarking: mutation.isPending,
  };
}
