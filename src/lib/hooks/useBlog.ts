"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import type {
  BlogPost,
  BlogComment,
  BlogAuthor,
  BlogFilters,
  CreateBlogPostInput,
  UpdateBlogPostInput,
  CreateBlogCommentInput,
} from "@/types/blog";

// Query keys
export const blogKeys = {
  all: ["blog"] as const,
  posts: (filters?: BlogFilters) => ["blog", "posts", filters || {}] as const,
  post: (slug: string) => ["blog", "post", slug] as const,
  myPosts: (status?: string) => ["blog", "my-posts", status || "all"] as const,
  comments: (postSlug: string) => ["blog", "comments", postSlug] as const,
  authors: (verified?: boolean) => ["blog", "authors", verified] as const,
  myAuthor: ["blog", "my-author"] as const,
};

// Stale times
const STALE_TIMES = {
  POSTS: 1000 * 60 * 2, // 2 minutes
  POST_DETAIL: 1000 * 60 * 1, // 1 minute
  COMMENTS: 1000 * 30, // 30 seconds
  AUTHORS: 1000 * 60 * 10, // 10 minutes
};

interface BlogPostsResponse {
  posts: BlogPost[];
  total: number;
  limit: number;
  offset: number;
}

// Fetch blog posts with filters
async function fetchBlogPosts(
  filters: BlogFilters & { offset: number; limit: number }
): Promise<BlogPostsResponse> {
  const params = new URLSearchParams();

  if (filters.game) params.set("game", filters.game);
  if (filters.category) params.set("category", filters.category);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.author) params.set("author", filters.author);
  if (filters.featured) params.set("featured", "true");
  if (filters.search) params.set("search", filters.search);
  params.set("limit", String(filters.limit));
  params.set("offset", String(filters.offset));

  const response = await fetch(`/api/blog?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch posts");
  }

  return data;
}

// Hook: List blog posts with infinite scroll
export function useBlogPosts(filters: BlogFilters = {}, limit = 20) {
  const {
    data,
    isLoading: loading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: blogKeys.posts(filters),
    queryFn: ({ pageParam = 0 }) =>
      fetchBlogPosts({ ...filters, offset: pageParam, limit }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (acc, page) => acc + page.posts.length,
        0
      );
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    staleTime: STALE_TIMES.POSTS,
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

// Hook: Single blog post by slug
export function useBlogPost(slug: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: blogKeys.post(slug),
    queryFn: async () => {
      const response = await fetch(`/api/blog/${slug}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch post");
      return data.post as BlogPost;
    },
    enabled: !!slug,
    staleTime: STALE_TIMES.POST_DETAIL,
  });

  return {
    post: data,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

// Hook: Current user's posts
export function useMyBlogPosts(status?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: blogKeys.myPosts(status),
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const response = await fetch(`/api/blog/my-posts${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch posts");
      return {
        posts: data.posts as BlogPost[],
        author: data.author as BlogAuthor | null,
      };
    },
    staleTime: STALE_TIMES.POST_DETAIL,
  });

  return {
    posts: data?.posts || [],
    author: data?.author,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

// Hook: Create blog post
export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreateBlogPostInput) => {
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create post");
      return data.post as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
  });

  return {
    createPost: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

// Hook: Update blog post
export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      slug,
      updates,
    }: {
      slug: string;
      updates: UpdateBlogPostInput;
    }) => {
      const response = await fetch(`/api/blog/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update post");
      return data.post as BlogPost;
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
      queryClient.setQueryData(blogKeys.post(post.slug), post);
    },
  });

  return {
    updatePost: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

// Hook: Delete blog post
export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (slug: string) => {
      const response = await fetch(`/api/blog/${slug}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete post");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
  });

  return {
    deletePost: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

// Hook: Like/Unlike blog post
export function useLikeBlogPost() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (slug: string) => {
      const response = await fetch(`/api/blog/${slug}/like`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to toggle like");
      return data.liked as boolean;
    },
    onSuccess: (_, slug) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.post(slug) });
    },
  });

  return {
    toggleLike: mutation.mutateAsync,
    isLiking: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

// Hook: Get blog comments
export function useBlogComments(postSlug: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: blogKeys.comments(postSlug),
    queryFn: async () => {
      const response = await fetch(`/api/blog/${postSlug}/comments`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch comments");
      return {
        comments: data.comments as BlogComment[],
        allowComments: data.allow_comments as boolean,
      };
    },
    enabled: !!postSlug,
    staleTime: STALE_TIMES.COMMENTS,
  });

  return {
    comments: data?.comments || [],
    allowComments: data?.allowComments ?? true,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

// Hook: Add comment
export function useAddBlogComment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreateBlogCommentInput) => {
      const response = await fetch(`/api/blog/${input.post_id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to create comment");
      return data.comment as BlogComment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: blogKeys.comments(variables.post_id),
      });
      queryClient.invalidateQueries({
        queryKey: blogKeys.post(variables.post_id),
      });
    },
  });

  return {
    addComment: mutation.mutateAsync,
    isAdding: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

// Hook: Get blog authors
export function useBlogAuthors(verified?: boolean) {
  const { data, isLoading, error } = useQuery({
    queryKey: blogKeys.authors(verified),
    queryFn: async () => {
      const params = verified ? "?verified=true" : "";
      const response = await fetch(`/api/blog/authors${params}`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch authors");
      return data.authors as BlogAuthor[];
    },
    staleTime: STALE_TIMES.AUTHORS,
  });

  return {
    authors: data || [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
}

// Hook: Apply to become author
export function useApplyAsAuthor() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (bio?: string) => {
      const response = await fetch("/api/blog/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to apply");
      return data.author as BlogAuthor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.myAuthor });
      queryClient.invalidateQueries({ queryKey: blogKeys.authors() });
    },
  });

  return {
    apply: mutation.mutateAsync,
    isApplying: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}
