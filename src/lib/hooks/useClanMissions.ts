"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ClanMission {
  id: string;
  clan_id: string;
  title: string;
  description: string | null;
  goal_type: string;
  goal_target: number;
  current_progress: number;
  xp_reward: number;
  week_start: string;
  week_end: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export function useClanMissions(clanId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["clan-missions", clanId];

  const {
    data,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(
        `/api/clans/${clanId}/missions?week=current`
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch missions");
      }
      return response.json() as Promise<{
        missions: ClanMission[];
        week_start: string;
      }>;
    },
    enabled: !!clanId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const missions = data?.missions || [];
  const weekStart = data?.week_start || null;
  const activeMissions = missions.filter((m) => !m.is_completed);
  const completedMissions = missions.filter((m) => m.is_completed);

  const createMissionMutation = useMutation({
    mutationFn: async (mission: {
      title: string;
      description?: string;
      goal_type: string;
      goal_target: number;
      xp_reward?: number;
    }) => {
      const response = await fetch(`/api/clans/${clanId}/missions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mission),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create mission");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const contributeMutation = useMutation({
    mutationFn: async ({
      missionId,
      amount,
    }: {
      missionId: string;
      amount?: number;
    }) => {
      const response = await fetch(
        `/api/clans/${clanId}/missions/${missionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contribute: true, amount: amount || 1 }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to contribute");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMissionMutation = useMutation({
    mutationFn: async (missionId: string) => {
      const response = await fetch(
        `/api/clans/${clanId}/missions/${missionId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete mission");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    missions,
    activeMissions,
    completedMissions,
    weekStart,
    loading,
    error: error instanceof Error ? error.message : null,
    createMission: createMissionMutation.mutateAsync,
    creatingMission: createMissionMutation.isPending,
    contribute: contributeMutation.mutateAsync,
    contributing: contributeMutation.isPending,
    deleteMission: deleteMissionMutation.mutateAsync,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}
