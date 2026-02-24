"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { STALE_TIMES } from "@/lib/query/provider";

interface CommentAuthor {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

interface NewsComment {
  id: string;
  article_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  status: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author: CommentAuthor;
  replies: NewsComment[];
  user_has_liked: boolean;
}

const newsCommentKeys = {
  all: ["news-comments"] as const,
  article: (articleId: string) => ["news-comments", articleId] as const,
};

export function useNewsComments(articleId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: newsCommentKeys.article(articleId),
    queryFn: async () => {
      const response = await fetch(`/api/news/${articleId}/comments`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch comments");
      return {
        comments: data.comments as NewsComment[],
        allowComments: data.allow_comments as boolean,
      };
    },
    enabled: !!articleId,
    staleTime: STALE_TIMES.BLOG_COMMENTS,
  });

  return {
    comments: data?.comments || [],
    allowComments: data?.allowComments ?? true,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

export function useAddNewsComment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: {
      article_id: string;
      content: string;
      parent_id?: string | null;
    }) => {
      const response = await fetch(`/api/news/${input.article_id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to create comment");
      return data.comment as NewsComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsCommentKeys.all });
    },
  });

  return {
    addComment: mutation.mutateAsync,
    isAdding: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

export function useLikeNewsComment(articleId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/news/${articleId}/comments/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to toggle comment like");
      return data.liked as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsCommentKeys.all });
    },
  });

  return {
    toggleCommentLike: mutation.mutateAsync,
    isLikingComment: mutation.isPending,
  };
}
