"use client";

import { useQuery } from "@tanstack/react-query";

export interface DailyPageView {
  date: string;
  total_views: number;
  unique_visitors: number;
}

export interface TopPage {
  path: string;
  view_count: number;
  unique_count: number;
}

export interface AnalyticsSummary {
  todayViews: number;
  todayUnique: number;
  yesterdayViews: number;
  totalViews: number;
  avgDailyViews: number;
}

export interface AnalyticsData {
  daily: DailyPageView[];
  topPages: TopPage[];
  summary: AnalyticsSummary;
}

const adminAnalyticsKeys = {
  all: ["admin", "analytics"] as const,
  range: (range: number) => ["admin", "analytics", range] as const,
};

export function useAdminAnalytics(range: number = 30) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: adminAnalyticsKeys.range(range),
    queryFn: async () => {
      const response = await fetch(`/api/admin/analytics?range=${range}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to fetch analytics");
      return json as AnalyticsData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    daily: data?.daily || [],
    topPages: data?.topPages || [],
    summary: data?.summary || {
      todayViews: 0,
      todayUnique: 0,
      yesterdayViews: 0,
      totalViews: 0,
      avgDailyViews: 0,
    },
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
