"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { NewsArticle, GameSlug, NewsCategory, NewsRegion, NewsStatus } from "@/types/news";

export interface AdminNewsFilters {
  status?: NewsStatus | "";
  game?: GameSlug | "";
  category?: NewsCategory | "";
  region?: NewsRegion | "";
  search?: string;
  type?: "manual" | "fetched" | "";
  page?: number;
  limit?: number;
}

const adminNewsKeys = {
  all: ["admin", "news"] as const,
  list: (filters: AdminNewsFilters) =>
    ["admin", "news", "list", filters] as const,
};

// Public-facing news query key (used by community page)
const communityNewsKey = ["community-news"] as const;

export function useAdminNewsArticles(filters: AdminNewsFilters = {}) {
  const { page = 1, limit = 20, ...rest } = filters;
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: adminNewsKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (rest.status) params.set("status", rest.status);
      if (rest.game) params.set("game", rest.game);
      if (rest.category) params.set("category", rest.category);
      if (rest.region) params.set("region", rest.region);
      if (rest.type) params.set("type", rest.type);
      if (rest.search) params.set("search", rest.search);
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const response = await fetch(`/api/admin/news?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to fetch news");
      return json as { articles: NewsArticle[]; total: number };
    },
    staleTime: 1000 * 30,
  });

  return {
    articles: data?.articles || [],
    total: data?.total || 0,
    totalPages: Math.ceil((data?.total || 0) / limit),
    page,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

export function useAdminNewsAction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Record<string, unknown>;
    }) => {
      const response = await fetch("/api/admin/news", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update article");
      return data.article as NewsArticle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminNewsKeys.all });
      queryClient.invalidateQueries({ queryKey: communityNewsKey });
    },
  });

  return {
    updateArticle: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

export function useAdminNewsDelete() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/news?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete article");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminNewsKeys.all });
      queryClient.invalidateQueries({ queryKey: communityNewsKey });
    },
  });

  return {
    deleteArticle: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}

export function useAdminNewsFetch() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/news/fetch", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch news");
      return data as {
        success: boolean;
        sourcesProcessed: number;
        totalFound: number;
        totalNew: number;
        totalRemoved?: number;
        errors?: string[];
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminNewsKeys.all });
    },
  });

  return {
    fetchNews: mutation.mutateAsync,
    isFetching: mutation.isPending,
  };
}

export function useAdminNewsCreate() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (article: Record<string, unknown>) => {
      const response = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create article");
      return data.article as NewsArticle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminNewsKeys.all });
    },
  });

  return {
    createArticle: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}
