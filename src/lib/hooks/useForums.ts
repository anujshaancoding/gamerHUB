"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";

// Types
interface Author {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level?: number;
  title?: string | null;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  game_id: string | null;
  parent_id: string | null;
  post_count: number;
  is_locked: boolean;
  display_order: number;
  subcategories?: Category[];
}

interface ForumPost {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  content: string;
  post_type: "discussion" | "question" | "guide" | "lfg" | "announcement";
  tags: string[];
  is_pinned: boolean;
  is_locked: boolean;
  is_solved: boolean;
  solved_reply_id: string | null;
  view_count: number;
  reply_count: number;
  vote_score: number;
  last_reply_at: string | null;
  created_at: string;
  updated_at: string;
  author: Author;
  last_reply_author?: Author | null;
  category?: Category;
  user_vote?: number | null;
}

interface ForumReply {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  vote_score: number;
  is_solution: boolean;
  created_at: string;
  updated_at: string;
  author: Author;
  user_vote?: number | null;
  children?: ForumReply[];
}

// Fetch categories
async function fetchCategories(): Promise<{ categories: Category[] }> {
  const res = await fetch("/api/forums/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

// Fetch posts
interface FetchPostsParams {
  categoryId?: string;
  category?: string;
  type?: string;
  sort?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

async function fetchPosts(
  params: FetchPostsParams
): Promise<{ posts: ForumPost[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params.category) searchParams.set("category", params.category);
  if (params.type) searchParams.set("type", params.type);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.search) searchParams.set("search", params.search);
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());

  const res = await fetch(`/api/forums/posts?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

// Fetch single post
async function fetchPost(postId: string): Promise<{ post: ForumPost }> {
  const res = await fetch(`/api/forums/posts/${postId}`);
  if (!res.ok) throw new Error("Failed to fetch post");
  return res.json();
}

// Fetch replies
async function fetchReplies(
  postId: string,
  params: { sort?: string; limit?: number; offset?: number }
): Promise<{ replies: ForumReply[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());

  const res = await fetch(`/api/forums/posts/${postId}/replies?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch replies");
  return res.json();
}

// Create post
async function createPost(data: {
  categoryId: string;
  title: string;
  content: string;
  postType?: string;
  tags?: string[];
}): Promise<{ postId: string; slug: string; categorySlug: string }> {
  const res = await fetch("/api/forums/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create post");
  }
  return res.json();
}

// Create reply
async function createReply(
  postId: string,
  data: { content: string; parentId?: string }
): Promise<{ reply: ForumReply }> {
  const res = await fetch(`/api/forums/posts/${postId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create reply");
  }
  return res.json();
}

// Vote on post
async function votePost(
  postId: string,
  voteType: 1 | -1
): Promise<{ score: number }> {
  const res = await fetch(`/api/forums/posts/${postId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voteType }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to vote");
  }
  return res.json();
}

// Vote on reply
async function voteReply(
  replyId: string,
  voteType: 1 | -1
): Promise<{ score: number }> {
  const res = await fetch(`/api/forums/replies/${replyId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voteType }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to vote");
  }
  return res.json();
}

// Mark reply as solution
async function markSolution(replyId: string): Promise<void> {
  const res = await fetch(`/api/forums/replies/${replyId}/solution`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to mark solution");
  }
}

// Delete post
async function deletePost(postId: string): Promise<void> {
  const res = await fetch(`/api/forums/posts/${postId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete post");
  }
}

// Hooks
export function useForumCategories() {
  return useQuery({
    queryKey: ["forum-categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useForumPosts(params: FetchPostsParams) {
  return useQuery({
    queryKey: ["forum-posts", params],
    queryFn: () => fetchPosts(params),
  });
}

export function useInfiniteForumPosts(params: Omit<FetchPostsParams, "offset">) {
  const limit = params.limit || 20;

  return useInfiniteQuery({
    queryKey: ["forum-posts-infinite", params],
    queryFn: ({ pageParam = 0 }) =>
      fetchPosts({ ...params, limit, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.flatMap((p) => p.posts).length;
      return totalFetched < lastPage.total ? totalFetched : undefined;
    },
  });
}

export function useForumPost(postId: string) {
  return useQuery({
    queryKey: ["forum-post", postId],
    queryFn: () => fetchPost(postId),
    enabled: !!postId,
  });
}

export function useForumReplies(
  postId: string,
  params: { sort?: string } = {}
) {
  return useQuery({
    queryKey: ["forum-replies", postId, params],
    queryFn: () => fetchReplies(postId, params),
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      queryClient.invalidateQueries({ queryKey: ["forum-categories"] });
    },
  });
}

export function useCreateReply(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { content: string; parentId?: string }) =>
      createReply(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-replies", postId] });
      queryClient.invalidateQueries({ queryKey: ["forum-post", postId] });
    },
  });
}

export function useVotePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, voteType }: { postId: string; voteType: 1 | -1 }) =>
      votePost(postId, voteType),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["forum-post", postId] });
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
    },
  });
}

export function useVoteReply(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ replyId, voteType }: { replyId: string; voteType: 1 | -1 }) =>
      voteReply(replyId, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-replies", postId] });
    },
  });
}

export function useMarkSolution(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markSolution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-replies", postId] });
      queryClient.invalidateQueries({ queryKey: ["forum-post", postId] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      queryClient.invalidateQueries({ queryKey: ["forum-categories"] });
    },
  });
}
