"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TraitEndorsementStats,
  TrustBadges,
  TraitEndorsementRow,
  RateLimitCheck,
} from "@/types/database";

export const ratingKeys = {
  traitEndorsements: (userId: string) => ["trait-endorsements", userId] as const,
  myEndorsement: (targetId: string) => ["my-endorsement", targetId] as const,
  trustBadges: (userId: string) => ["trust-badges", userId] as const,
};

export function useTraitEndorsements(userId: string | null) {
  return useQuery({
    queryKey: ratingKeys.traitEndorsements(userId!),
    queryFn: async (): Promise<{ traits: TraitEndorsementStats }> => {
      const res = await fetch(`/api/ratings/traits/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch trait endorsements");
      return res.json();
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useMyEndorsement(targetId: string | null) {
  return useQuery({
    queryKey: ratingKeys.myEndorsement(targetId!),
    queryFn: async (): Promise<{
      endorsement: TraitEndorsementRow | null;
      rateLimit: RateLimitCheck;
    }> => {
      const res = await fetch(`/api/ratings/my-endorsement/${targetId}`);
      if (!res.ok) throw new Error("Failed to fetch my endorsement");
      return res.json();
    },
    enabled: !!targetId,
  });
}

export function useTrustBadges(userId: string | null) {
  return useQuery({
    queryKey: ratingKeys.trustBadges(userId!),
    queryFn: async (): Promise<{ badges: TrustBadges }> => {
      const res = await fetch(`/api/ratings/trust-badges/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch trust badges");
      return res.json();
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useSubmitEndorsement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      endorsedId: string;
      endorsementType?: "positive" | "negative";
      // Positive traits
      friendly?: boolean;
      teamPlayer?: boolean;
      leader?: boolean;
      communicative?: boolean;
      reliable?: boolean;
      // Negative traits
      toxic?: boolean;
      quitter?: boolean;
      uncooperative?: boolean;
      uncommunicative?: boolean;
      unreliable?: boolean;
      gameId?: string;
      playedAs?: "teammate" | "opponent";
      positiveNote?: string;
    }) => {
      const res = await fetch("/api/ratings/endorse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit endorsement");
      }

      return data as {
        endorsement: TraitEndorsementRow;
        dailyRemaining: number;
        weeklyRemaining: number;
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ratingKeys.traitEndorsements(variables.endorsedId),
      });
      queryClient.invalidateQueries({
        queryKey: ratingKeys.myEndorsement(variables.endorsedId),
      });
    },
  });
}
