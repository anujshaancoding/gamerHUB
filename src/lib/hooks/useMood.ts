"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  UserMood,
  GamingMood,
  MoodIntensity,
  SetMoodRequest,
  MoodHistoryEntry,
  MoodStatsResponse,
  MoodCompatibility,
} from "@/types/mood";
import { calculateMoodCompatibility, GAMING_MOODS } from "@/types/mood";

// Query keys
const MOOD_KEYS = {
  current: ["mood", "current"] as const,
  history: (days?: number) => ["mood", "history", days] as const,
  stats: ["mood", "stats"] as const,
  compatiblePlayers: (gameId?: string, mood?: GamingMood) =>
    ["mood", "compatible-players", gameId, mood] as const,
};

// Get current user's mood
export function useCurrentMood() {
  return useQuery({
    queryKey: MOOD_KEYS.current,
    queryFn: async () => {
      const response = await fetch("/api/mood");
      if (!response.ok) {
        throw new Error("Failed to fetch mood");
      }
      const data = await response.json();
      return data as { mood: UserMood | null; hasMood: boolean };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute to check expiry
  });
}

// Set mood mutation
export function useSetMood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SetMoodRequest) => {
      const response = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to set mood");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOOD_KEYS.current });
      queryClient.invalidateQueries({ queryKey: ["mood", "history"] });
    },
  });
}

// Update mood mutation
export function useUpdateMood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      intensity?: MoodIntensity;
      note?: string;
      extend_hours?: number;
    }) => {
      const response = await fetch("/api/mood", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update mood");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOOD_KEYS.current });
    },
  });
}

// Clear mood mutation
export function useClearMood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/mood", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to clear mood");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOOD_KEYS.current });
    },
  });
}

// Get mood history
export function useMoodHistory(days: number = 30, includeStats: boolean = false) {
  return useQuery({
    queryKey: [...MOOD_KEYS.history(days), includeStats],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: days.toString(),
        stats: includeStats.toString(),
      });
      const response = await fetch(`/api/mood/history?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch mood history");
      }
      return response.json() as Promise<{
        history: MoodHistoryEntry[];
        stats: MoodStatsResponse | null;
      }>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Update mood history entry (add outcome)
export function useUpdateMoodHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryId,
      outcome,
      duration_minutes,
    }: {
      entryId: string;
      outcome?: "good" | "neutral" | "bad";
      duration_minutes?: number;
    }) => {
      const response = await fetch(`/api/mood/history?id=${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, duration_minutes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update history");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood", "history"] });
    },
  });
}

// Find compatible players
export function useCompatiblePlayers(
  gameId?: string,
  targetMood?: GamingMood,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: MOOD_KEYS.compatiblePlayers(gameId, targetMood),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (gameId) params.set("game_id", gameId);
      if (targetMood) params.set("mood", targetMood);

      const response = await fetch(`/api/mood/compatible-players?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch compatible players");
      }
      return response.json();
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

// Helper hook to check compatibility with another player
export function useMoodCompatibility(
  otherMood?: GamingMood,
  otherIntensity?: MoodIntensity
): MoodCompatibility | null {
  const { data } = useCurrentMood();

  if (!data?.mood || !otherMood) {
    return null;
  }

  return calculateMoodCompatibility(
    data.mood.mood as GamingMood,
    data.mood.intensity as MoodIntensity,
    otherMood,
    otherIntensity || 3
  );
}

// Get mood info helper
export function useMoodInfo(mood?: GamingMood) {
  if (!mood) return null;
  return GAMING_MOODS[mood];
}

// Combined hook for mood page
export function useMoodPage() {
  const currentMood = useCurrentMood();
  const history = useMoodHistory(7, true);
  const setMood = useSetMood();
  const clearMood = useClearMood();
  const compatiblePlayers = useCompatiblePlayers(undefined, undefined, currentMood.data?.hasMood);

  return {
    currentMood: currentMood.data?.mood,
    hasMood: currentMood.data?.hasMood || false,
    isLoadingMood: currentMood.isLoading,
    history: history.data?.history || [],
    stats: history.data?.stats,
    isLoadingHistory: history.isLoading,
    compatiblePlayers: compatiblePlayers.data?.players || [],
    isLoadingPlayers: compatiblePlayers.isLoading,
    setMood,
    clearMood,
    refetch: () => {
      currentMood.refetch();
      history.refetch();
      compatiblePlayers.refetch();
    },
  };
}
