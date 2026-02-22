"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { BlogPost, BlogCategory, BlogStatus } from "@/types/blog";

export interface AdminBlogFilters {
  status?: BlogStatus | "";
  category?: BlogCategory | "";
  search?: string;
  page?: number;
  limit?: number;
}

const adminBlogKeys = {
  all: ["admin", "blog"] as const,
  list: (filters: AdminBlogFilters) =>
    ["admin", "blog", "list", filters] as const,
};

export function useAdminBlogPosts(filters: AdminBlogFilters = {}) {
  const { page = 1, limit = 20, ...rest } = filters;
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: adminBlogKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (rest.status) params.set("status", rest.status);
      if (rest.category) params.set("category", rest.category);
      if (rest.search) params.set("search", rest.search);
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const response = await fetch(`/api/admin/blog?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to fetch posts");
      return json as { posts: BlogPost[]; total: number };
    },
    staleTime: 1000 * 30,
  });

  return {
    posts: data?.posts || [],
    total: data?.total || 0,
    totalPages: Math.ceil((data?.total || 0) / limit),
    page,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

export function useAdminBlogAction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      slug,
      updates,
    }: {
      slug: string;
      updates: Record<string, unknown>;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminBlogKeys.all });
      queryClient.invalidateQueries({ queryKey: ["blog"] });
    },
  });

  return {
    updatePost: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useAdminBlogDelete() {
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
      queryClient.invalidateQueries({ queryKey: adminBlogKeys.all });
      queryClient.invalidateQueries({ queryKey: ["blog"] });
    },
  });

  return {
    deletePost: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
