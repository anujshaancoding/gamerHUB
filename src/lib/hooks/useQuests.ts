"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys, STALE_TIMES } from "@/lib/query";

interface QuestDefinition {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  quest_type: "daily" | "weekly" | "special";
  requirements: Record<string, unknown>;
  xp_reward: number;
  bonus_rewards: Record<string, unknown>;
  game_id: string | null;
}

interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  status: "active" | "completed" | "expired" | "claimed";
  progress: { current: number; target: number };
  assigned_at: string;
  expires_at: string;
  completed_at: string | null;
  claimed_at: string | null;
  period_type: string;
  period_key: string;
  quest: QuestDefinition;
}

interface QuestResets {
  daily: string;
  weekly: string;
}

interface QuestsResponse {
  daily: UserQuest[];
  weekly: UserQuest[];
  resets: QuestResets | null;
}

async function fetchQuestsData(): Promise<QuestsResponse> {
  const response = await fetch("/api/quests/active");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch quests");
  }

  return {
    daily: data.daily || [],
    weekly: data.weekly || [],
    resets: data.resets || null,
  };
}

// Create supabase client outside hook to avoid re-creation on render
const supabase = createClient();

export function useQuests() {
  const queryClient = useQueryClient();
  const lastRefetchRef = useRef<number>(0);

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.activeQuests,
    queryFn: fetchQuestsData,
    staleTime: STALE_TIMES.USER_QUESTS,
  });

  const dailyQuests = data?.daily ?? [];
  const weeklyQuests = data?.weekly ?? [];
  const resets = data?.resets ?? null;

  // Throttled refetch for realtime updates (max once per 3 seconds)
  const throttledRefetch = useCallback(() => {
    const now = Date.now();
    if (now - lastRefetchRef.current > 3000) {
      lastRefetchRef.current = now;
      refetch();
    }
  }, [refetch]);

  // Subscribe to quest updates with throttling
  useEffect(() => {
    const channel = supabase
      .channel("user_quests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_quests" },
        () => throttledRefetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [throttledRefetch]);

  const claimQuestMutation = useMutation({
    mutationFn: async (userQuestId: string) => {
      const response = await fetch(`/api/quests/${userQuestId}/claim`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim quest");
      }

      return data.rewards;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeQuests });
      queryClient.invalidateQueries({ queryKey: ["progression"] });
    },
  });

  const assignQuestsMutation = useMutation({
    mutationFn: async (questType: "daily" | "weekly") => {
      const response = await fetch("/api/quests/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quest_type: questType }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeQuests });
    },
  });

  const claimQuest = async (userQuestId: string) => {
    try {
      const rewards = await claimQuestMutation.mutateAsync(userQuestId);
      return { data: rewards };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Failed to claim quest") };
    }
  };

  const assignQuests = async (questType: "daily" | "weekly") => {
    try {
      await assignQuestsMutation.mutateAsync(questType);
      return { success: true };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Failed to assign quests") };
    }
  };

  // Calculate time until reset
  const getTimeUntilReset = (type: "daily" | "weekly"): number => {
    if (!resets) return 0;
    const resetTime = new Date(type === "daily" ? resets.daily : resets.weekly);
    return Math.max(0, resetTime.getTime() - Date.now());
  };

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  // Completed counts
  const dailyCompleted = dailyQuests.filter(
    (q) => q.status === "completed" || q.status === "claimed"
  ).length;
  const weeklyCompleted = weeklyQuests.filter(
    (q) => q.status === "completed" || q.status === "claimed"
  ).length;

  // Claimable quests
  const claimableQuests = [...dailyQuests, ...weeklyQuests].filter(
    (q) => q.status === "completed"
  );

  // Total XP available from claimable quests
  const claimableXP = claimableQuests.reduce(
    (total, q) => total + (q.quest?.xp_reward || 0),
    0
  );

  return {
    dailyQuests,
    weeklyQuests,
    resets,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    claimQuest,
    assignQuests,
    getTimeUntilReset,
    formatTimeRemaining,
    dailyCompleted,
    weeklyCompleted,
    dailyTotal: dailyQuests.length,
    weeklyTotal: weeklyQuests.length,
    claimableQuests,
    claimableXP,
  };
}
