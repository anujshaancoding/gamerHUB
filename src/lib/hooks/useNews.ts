"use client";

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { NewsArticle, NewsFilters } from "@/types/news";

export const newsKeys = {
  all: ["news"] as const,
  articles: (filters?: NewsFilters) => ["news", "articles", filters || {}] as const,
  article: (id: string) => ["news", "article", id] as const,
  pending: (status?: string) => ["news", "pending", status || "approved"] as const,
};

const STALE_TIMES = {
  ARTICLES: 1000 * 60 * 3, // 3 minutes
  PENDING: 1000 * 30, // 30 seconds for admin
};

interface NewsResponse {
  posts: NewsArticle[];
  total: number;
  limit: number;
  offset: number;
}

interface PendingResponse {
  articles: NewsArticle[];
  total: number;
  limit: number;
  offset: number;
}

async function fetchNewsArticles(
  filters: NewsFilters,
  offset: number,
  limit: number
): Promise<NewsResponse> {
  const params = new URLSearchParams();
  params.set("source", "articles");
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  if (filters.game) params.set("game", filters.game);
  if (filters.category) params.set("category", filters.category);
  if (filters.region) params.set("region", filters.region);
  if (filters.search) params.set("search", filters.search);
  if (filters.featured) params.set("featured", "true");

  const response = await fetch(`/api/news?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to fetch news");
  return data;
}

async function fetchPendingArticles(
  status: string,
  offset: number,
  limit: number
): Promise<PendingResponse> {
  const params = new URLSearchParams();
  params.set("status", status);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const response = await fetch(`/api/news/pending?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to fetch pending news");
  return data;
}

export function useNewsArticles(filters: NewsFilters = {}, pageSize: number = 12) {
  return useInfiniteQuery({
    queryKey: newsKeys.articles(filters),
    queryFn: ({ pageParam = 0 }) => fetchNewsArticles(filters, pageParam, pageSize),
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.limit;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
    initialPageParam: 0,
    staleTime: STALE_TIMES.ARTICLES,
  });
}

export function usePendingNews(status: string = "approved", pageSize: number = 50) {
  return useQuery({
    queryKey: newsKeys.pending(status),
    queryFn: () => fetchPendingArticles(status, 0, pageSize),
    staleTime: STALE_TIMES.PENDING,
  });
}

export function useModerateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      articleId,
      action,
      rejectionReason,
    }: {
      articleId: string;
      action: "approve" | "reject" | "publish";
      rejectionReason?: string;
    }) => {
      const response = await fetch(`/api/news/${articleId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejection_reason: rejectionReason,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to moderate article");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
    },
  });
}

export function useTriggerNewsFetch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/news/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to trigger news fetch");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
    },
  });
}

export function useTriggerNewsProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/news/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to process news");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.all });
    },
  });
}
