"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/provider";
import type { UserActivityDay } from "@/types/database";

interface ActivityData {
  days: UserActivityDay[];
  totalHoursOnline: number;
  averageDailyMinutes: number;
  longestStreak: number;
  currentStreak: number;
  activeDaysCount: number;
}

async function fetchActivityData(userId: string): Promise<ActivityData> {
  const response = await fetch(`/api/activity/${userId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to fetch activity");
  return data;
}

export function useActivity(userId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.activity(userId),
    queryFn: () => fetchActivityData(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId,
  });

  return {
    activity: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
