"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES } from "@/lib/query";

interface Title {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  rarity: string;
  color: string | null;
}

interface ProfileFrame {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string;
  rarity: string;
}

interface ProfileTheme {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  primary_color: string;
  secondary_color: string | null;
  accent_color: string | null;
  background_gradient: Record<string, string> | null;
  rarity: string;
}

interface UserProgression {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  current_level_xp: number;
  xp_to_next_level: number;
  prestige_level: number;
  active_title_id: string | null;
  active_frame_id: string | null;
  active_theme_id: string | null;
  showcase_badges: string[];
  stats: {
    matches_played: number;
    matches_won: number;
    challenges_completed: number;
    quests_completed: number;
    current_win_streak: number;
    best_win_streak: number;
  };
  active_title: Title | null;
  active_frame: ProfileFrame | null;
  active_theme: ProfileTheme | null;
  created_at: string;
  updated_at: string;
}

async function fetchProgressionData(userId?: string): Promise<UserProgression> {
  const endpoint = userId ? `/api/progression/${userId}` : "/api/progression";
  const response = await fetch(endpoint);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch progression");
  }

  return data.progression;
}

export function useProgression(userId?: string) {
  const queryClient = useQueryClient();

  const {
    data: progression,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.progression(userId),
    queryFn: () => fetchProgressionData(userId),
    staleTime: STALE_TIMES.USER_PROGRESSION,
  });

  // Realtime subscription disabled — user_progression table was removed
  // in 999_cleanup_and_focus.sql.  Subscribing to a missing table causes
  // the WebSocket to reconnect in a loop, spamming the
  // dev console.  Data is still fetched via React Query above.

  const equipTitleMutation = useMutation({
    mutationFn: async (titleId: string | null) => {
      const response = await fetch("/api/titles/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title_id: titleId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progression(userId) });
    },
  });

  const equipFrameMutation = useMutation({
    mutationFn: async (frameId: string | null) => {
      const response = await fetch("/api/frames/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame_id: frameId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progression(userId) });
    },
  });

  const equipThemeMutation = useMutation({
    mutationFn: async (themeId: string | null) => {
      const response = await fetch("/api/themes/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme_id: themeId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progression(userId) });
    },
  });

  const updateShowcaseBadgesMutation = useMutation({
    mutationFn: async (badgeIds: string[]) => {
      const response = await fetch("/api/progression", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showcase_badges: badgeIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progression(userId) });
    },
  });

  const equipTitle = async (titleId: string | null) => {
    try {
      await equipTitleMutation.mutateAsync(titleId);
      return { success: true };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Failed to equip title") };
    }
  };

  const equipFrame = async (frameId: string | null) => {
    try {
      await equipFrameMutation.mutateAsync(frameId);
      return { success: true };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Failed to equip frame") };
    }
  };

  const equipTheme = async (themeId: string | null) => {
    try {
      await equipThemeMutation.mutateAsync(themeId);
      return { success: true };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Failed to equip theme") };
    }
  };

  const updateShowcaseBadges = async (badgeIds: string[]) => {
    try {
      await updateShowcaseBadgesMutation.mutateAsync(badgeIds);
      return { success: true };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Failed to update badges") };
    }
  };

  // Calculate progress percentage
  const progressPercentage = progression
    ? Math.round(
        (progression.current_level_xp / progression.xp_to_next_level) * 100
      )
    : 0;

  return {
    progression: progression ?? null,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    equipTitle,
    equipFrame,
    equipTheme,
    updateShowcaseBadges,
    progressPercentage,
  };
}
