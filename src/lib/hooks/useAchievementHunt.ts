"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AchievementHunt,
  Achievement,
  CreateHuntRequest,
  HuntStatus,
} from "@/types/achievement-hunting";

// Query keys
const HUNT_KEYS = {
  hunts: (filters?: Record<string, unknown>) => ["achievement-hunts", filters] as const,
  hunt: (id: string) => ["achievement-hunt", id] as const,
  achievements: (gameId?: string) => ["achievements", gameId] as const,
};

// List hunts
export function useAchievementHunts(filters?: {
  game_id?: string;
  status?: HuntStatus;
  achievement_id?: string;
  my_hunts?: boolean;
}) {
  return useQuery({
    queryKey: HUNT_KEYS.hunts(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.set(key, String(value));
          }
        });
      }
      const response = await fetch(`/api/achievement-hunts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch hunts");
      return response.json() as Promise<{ hunts: AchievementHunt[] }>;
    },
  });
}

// Get single hunt
export function useAchievementHunt(id: string) {
  return useQuery({
    queryKey: HUNT_KEYS.hunt(id),
    queryFn: async () => {
      const response = await fetch(`/api/achievement-hunts/${id}`);
      if (!response.ok) throw new Error("Failed to fetch hunt");
      return response.json() as Promise<{
        hunt: AchievementHunt;
        isLeader: boolean;
        isMember: boolean;
      }>;
    },
    enabled: !!id,
  });
}

// List achievements for a game
export function useAchievements(gameId?: string) {
  return useQuery({
    queryKey: HUNT_KEYS.achievements(gameId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (gameId) params.set("game_id", gameId);
      const response = await fetch(`/api/achievements?${params}`);
      if (!response.ok) throw new Error("Failed to fetch achievements");
      return response.json() as Promise<{ achievements: Achievement[] }>;
    },
    enabled: !!gameId,
  });
}

// Create hunt
export function useCreateHunt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHuntRequest) => {
      const response = await fetch("/api/achievement-hunts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create hunt");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievement-hunts"] });
    },
  });
}

// Join hunt
export function useJoinHunt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      huntId,
      message,
    }: {
      huntId: string;
      message?: string;
    }) => {
      const response = await fetch(`/api/achievement-hunts/${huntId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join hunt");
      }
      return response.json();
    },
    onSuccess: (_, { huntId }) => {
      queryClient.invalidateQueries({ queryKey: HUNT_KEYS.hunt(huntId) });
      queryClient.invalidateQueries({ queryKey: ["achievement-hunts"] });
    },
  });
}

// Leave hunt
export function useLeaveHunt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (huntId: string) => {
      const response = await fetch(`/api/achievement-hunts/${huntId}/leave`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to leave hunt");
      }
      return response.json();
    },
    onSuccess: (_, huntId) => {
      queryClient.invalidateQueries({ queryKey: HUNT_KEYS.hunt(huntId) });
      queryClient.invalidateQueries({ queryKey: ["achievement-hunts"] });
    },
  });
}

// Mark ready
export function useToggleReady() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ huntId, ready }: { huntId: string; ready: boolean }) => {
      const response = await fetch(`/api/achievement-hunts/${huntId}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ready }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update ready status");
      }
      return response.json();
    },
    onSuccess: (_, { huntId }) => {
      queryClient.invalidateQueries({ queryKey: HUNT_KEYS.hunt(huntId) });
    },
  });
}

// Complete hunt
export function useCompleteHunt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (huntId: string) => {
      const response = await fetch(`/api/achievement-hunts/${huntId}/complete`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to complete hunt");
      }
      return response.json();
    },
    onSuccess: (_, huntId) => {
      queryClient.invalidateQueries({ queryKey: HUNT_KEYS.hunt(huntId) });
      queryClient.invalidateQueries({ queryKey: ["achievement-hunts"] });
    },
  });
}
