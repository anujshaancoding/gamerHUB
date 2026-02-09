"use client";

import { useEffect, useState, useCallback } from "react";
import type { ClanChallenge, Clan, Game } from "@/types/database";

interface ClanChallengeWithDetails extends ClanChallenge {
  challenger_clan: Pick<Clan, "id" | "name" | "tag" | "slug" | "avatar_url">;
  challenged_clan: Pick<Clan, "id" | "name" | "tag" | "slug" | "avatar_url"> | null;
  winner_clan: Pick<Clan, "id" | "name" | "tag" | "slug" | "avatar_url"> | null;
  game: Game | null;
}

interface UseClanChallengesOptions {
  clanId?: string;
  status?: string;
  gameId?: string;
  limit?: number;
}

export function useClanChallenges(options: UseClanChallengesOptions = {}) {
  const [challenges, setChallenges] = useState<ClanChallengeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const { clanId, status, gameId, limit = 20 } = options;

  const fetchChallenges = useCallback(async (newOffset = 0) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (clanId) params.set("clan_id", clanId);
      if (status) params.set("status", status);
      if (gameId) params.set("game_id", gameId);
      params.set("limit", String(limit));
      params.set("offset", String(newOffset));

      const response = await fetch(`/api/clan-challenges?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch challenges");
      }

      if (newOffset === 0) {
        setChallenges(data.challenges);
      } else {
        setChallenges((prev) => [...prev, ...data.challenges]);
      }
      setTotal(data.total);
      setOffset(newOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch challenges");
    } finally {
      setLoading(false);
    }
  }, [clanId, status, gameId, limit]);

  useEffect(() => {
    fetchChallenges(0);
  }, [fetchChallenges]);

  const loadMore = () => {
    if (!loading && challenges.length < total) {
      fetchChallenges(offset + limit);
    }
  };

  const createChallenge = async (challengeData: {
    challenger_clan_id: string;
    challenged_clan_id?: string;
    game_id?: string;
    title: string;
    description?: string;
    rules?: string;
    format?: string;
    team_size?: number;
    scheduled_at?: string;
  }) => {
    const response = await fetch("/api/clan-challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(challengeData),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to create challenge") };
    }

    await fetchChallenges(0);
    return { data: data.challenge };
  };

  const acceptChallenge = async (challengeId: string) => {
    const response = await fetch(`/api/clan-challenges/${challengeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to accept challenge") };
    }

    await fetchChallenges(0);
    return { data: data.challenge };
  };

  const declineChallenge = async (challengeId: string) => {
    const response = await fetch(`/api/clan-challenges/${challengeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline" }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to decline challenge") };
    }

    await fetchChallenges(0);
    return { data: data.challenge };
  };

  const updateChallenge = async (
    challengeId: string,
    updates: {
      status?: string;
      winner_clan_id?: string;
      result?: Record<string, unknown>;
      scheduled_at?: string;
    }
  ) => {
    const response = await fetch(`/api/clan-challenges/${challengeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to update challenge") };
    }

    await fetchChallenges(0);
    return { data: data.challenge };
  };

  const deleteChallenge = async (challengeId: string) => {
    const response = await fetch(`/api/clan-challenges/${challengeId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to delete challenge") };
    }

    setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
    setTotal((prev) => prev - 1);
    return { success: true };
  };

  // Filter helpers
  const openChallenges = challenges.filter((c) => c.status === "open");
  const pendingChallenges = challenges.filter((c) => c.status === "pending");
  const activeChallenges = challenges.filter(
    (c) => c.status === "accepted" || c.status === "in_progress"
  );
  const completedChallenges = challenges.filter((c) => c.status === "completed");

  return {
    challenges,
    openChallenges,
    pendingChallenges,
    activeChallenges,
    completedChallenges,
    loading,
    error,
    total,
    hasMore: challenges.length < total,
    refetch: () => fetchChallenges(0),
    loadMore,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    updateChallenge,
    deleteChallenge,
  };
}
