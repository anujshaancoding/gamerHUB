"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  VerifiedProfile,
  EndorsePlayerRequest,
  ReportPlayerRequest,
  EndorsementType,
  PlayerEndorsement,
} from "@/types/verified-queue";

// Query keys
const VERIFIED_KEYS = {
  profile: ["verified-profile"] as const,
  playerProfile: (userId: string) => ["verified-profile", userId] as const,
};

// Get own verified profile
export function useVerifiedProfile() {
  return useQuery({
    queryKey: VERIFIED_KEYS.profile,
    queryFn: async () => {
      const response = await fetch("/api/verified-queue/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json() as Promise<{
        profile: VerifiedProfile;
        recentEndorsements: Array<{
          type: EndorsementType;
          created_at: string;
          from_user: { username: string; avatar_url?: string };
        }>;
        endorsementCounts: Record<EndorsementType, number>;
      }>;
    },
  });
}

// Get another player's verified profile
export function usePlayerVerifiedProfile(userId: string) {
  return useQuery({
    queryKey: VERIFIED_KEYS.playerProfile(userId),
    queryFn: async () => {
      const response = await fetch(`/api/verified-queue/profile/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json() as Promise<{
        profile: VerifiedProfile;
        endorsementCounts: Record<EndorsementType, number>;
      }>;
    },
    enabled: !!userId,
  });
}

// Request verification
export function useRequestVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/verified-queue/profile", {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to request verification");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VERIFIED_KEYS.profile });
    },
  });
}

// Endorse a player
export function useEndorsePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EndorsePlayerRequest) => {
      const response = await fetch("/api/verified-queue/endorse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to endorse player");
      }
      return response.json();
    },
    onSuccess: (_, { user_id }) => {
      queryClient.invalidateQueries({
        queryKey: VERIFIED_KEYS.playerProfile(user_id),
      });
    },
  });
}

// Report a player
export function useReportPlayer() {
  return useMutation({
    mutationFn: async (data: ReportPlayerRequest) => {
      const response = await fetch("/api/toxicity/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to report player");
      }
      return response.json();
    },
  });
}

// Get reports
export function useMyReports(type: "submitted" | "received" = "submitted") {
  return useQuery({
    queryKey: ["reports", type],
    queryFn: async () => {
      const response = await fetch(`/api/toxicity/report?type=${type}`);
      if (!response.ok) throw new Error("Failed to fetch reports");
      return response.json();
    },
  });
}

// Join verified queue
export function useJoinVerifiedQueue() {
  return useMutation({
    mutationFn: async (data: {
      game_id: string;
      game_mode?: string;
      rank?: string;
      region: string;
      min_behavior_score?: number;
    }) => {
      const response = await fetch("/api/verified-queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join queue");
      }
      return response.json();
    },
  });
}

// Leave verified queue
export function useLeaveVerifiedQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/verified-queue/join", {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to leave queue");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-status"] });
    },
  });
}

// Get queue status
export function useQueueStatus() {
  return useQuery({
    queryKey: ["queue-status"],
    queryFn: async () => {
      const response = await fetch("/api/verified-queue/join");
      if (!response.ok) throw new Error("Failed to fetch queue status");
      return response.json() as Promise<{
        inQueue: boolean;
        currentEntry: any;
        recentMatches: any[];
      }>;
    },
    refetchInterval: 5000, // Poll every 5 seconds while in queue
  });
}

// Check if user can access verified queue
export function useCanAccessVerifiedQueue(): {
  canAccess: boolean;
  reason?: string;
  isLoading: boolean;
} {
  const { data, isLoading } = useVerifiedProfile();

  if (isLoading) {
    return { canAccess: false, isLoading: true };
  }

  if (!data?.profile) {
    return { canAccess: false, reason: "Profile not found", isLoading: false };
  }

  const profile = data.profile;

  if (profile.status !== "verified") {
    return { canAccess: false, reason: "Account not verified", isLoading: false };
  }

  if (profile.behavior_score < 50) {
    return {
      canAccess: false,
      reason: "Behavior score too low (min 50)",
      isLoading: false,
    };
  }

  if (profile.active_strikes > 0) {
    return { canAccess: false, reason: "Active strikes on account", isLoading: false };
  }

  if (profile.status === "suspended") {
    return { canAccess: false, reason: "Account suspended", isLoading: false };
  }

  return { canAccess: true, isLoading: false };
}
