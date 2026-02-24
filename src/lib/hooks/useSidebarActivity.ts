"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES } from "@/lib/query/provider";
import type { SidebarActivityItem } from "@/types/sidebar-activity";

async function fetchSidebarActivity(limit: number): Promise<SidebarActivityItem[]> {
  const res = await fetch(`/api/sidebar-activity?limit=${limit}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch activity");
  return data.items;
}

export function useSidebarActivity(limit = 15) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.sidebarActivity,
    queryFn: () => fetchSidebarActivity(limit),
    staleTime: STALE_TIMES.SIDEBAR_ACTIVITY,
    refetchOnWindowFocus: false,
  });

  return {
    items: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
