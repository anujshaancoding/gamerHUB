"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ScrimProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ScrimGame {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

interface ScrimParticipant {
  id: string;
  scrim_id: string;
  user_id: string;
  status: "confirmed" | "maybe" | "declined";
  created_at: string;
  profile: ScrimProfile;
}

export interface ClanScrim {
  id: string;
  clan_id: string;
  created_by: string;
  game_id: string | null;
  title: string;
  description: string | null;
  scheduled_at: string;
  max_slots: number;
  room_id: string | null;
  room_password: string | null;
  status: "upcoming" | "live" | "completed" | "cancelled";
  result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  game: ScrimGame | null;
  creator: ScrimProfile | null;
  participants: ScrimParticipant[];
  participant_count: number;
  has_rsvp: boolean;
}

export function useClanScrims(
  clanId: string | null,
  statusFilter?: string
) {
  const queryClient = useQueryClient();
  const queryKey = ["clan-scrims", clanId, statusFilter];

  const {
    data,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const response = await fetch(
        `/api/clans/${clanId}/scrims?${params.toString()}`
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch scrims");
      }
      return response.json() as Promise<{
        scrims: ClanScrim[];
        total: number;
      }>;
    },
    enabled: !!clanId,
    staleTime: 1000 * 60, // 1 minute
  });

  const scrims = data?.scrims || [];
  const upcomingScrims = scrims.filter((s) => s.status === "upcoming");
  const liveScrims = scrims.filter((s) => s.status === "live");
  const completedScrims = scrims.filter((s) => s.status === "completed");

  const createScrimMutation = useMutation({
    mutationFn: async (scrim: {
      title: string;
      description?: string;
      game_id?: string;
      scheduled_at: string;
      max_slots?: number;
      room_id?: string;
      room_password?: string;
    }) => {
      const response = await fetch(`/api/clans/${clanId}/scrims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scrim),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create scrim");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clan-scrims", clanId] });
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({
      scrimId,
      status,
    }: {
      scrimId: string;
      status: "confirmed" | "maybe" | "declined";
    }) => {
      const response = await fetch(
        `/api/clans/${clanId}/scrims/${scrimId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rsvp: status }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to RSVP");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clan-scrims", clanId] });
    },
  });

  const updateScrimMutation = useMutation({
    mutationFn: async ({
      scrimId,
      updates,
    }: {
      scrimId: string;
      updates: Record<string, unknown>;
    }) => {
      const response = await fetch(
        `/api/clans/${clanId}/scrims/${scrimId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update scrim");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clan-scrims", clanId] });
    },
  });

  const deleteScrimMutation = useMutation({
    mutationFn: async (scrimId: string) => {
      const response = await fetch(
        `/api/clans/${clanId}/scrims/${scrimId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete scrim");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clan-scrims", clanId] });
    },
  });

  return {
    scrims,
    upcomingScrims,
    liveScrims,
    completedScrims,
    loading,
    error: error instanceof Error ? error.message : null,
    createScrim: createScrimMutation.mutateAsync,
    creatingScrim: createScrimMutation.isPending,
    rsvp: rsvpMutation.mutateAsync,
    rsvping: rsvpMutation.isPending,
    updateScrim: updateScrimMutation.mutateAsync,
    deleteScrim: deleteScrimMutation.mutateAsync,
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: ["clan-scrims", clanId] }),
  };
}
