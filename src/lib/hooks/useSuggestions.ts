"use client";

import { useState, useEffect, useCallback } from "react";
import type { SuggestedUser } from "@/app/api/suggestions/route";

interface UseSuggestionsOptions {
  type?: "mutual" | "similar_rank" | "all" | "random";
  limit?: number;
  enabled?: boolean;
  includeRandom?: boolean;
}

interface UseSuggestionsReturn {
  mutualFriends: SuggestedUser[];
  similarRankPlayers: SuggestedUser[];
  randomUsers: SuggestedUser[];
  allSuggestions: SuggestedUser[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSuggestions(options: UseSuggestionsOptions = {}): UseSuggestionsReturn {
  const { type = "all", limit = 10, enabled = true, includeRandom = true } = options;

  const [mutualFriends, setMutualFriends] = useState<SuggestedUser[]>([]);
  const [similarRankPlayers, setSimilarRankPlayers] = useState<SuggestedUser[]>([]);
  const [randomUsers, setRandomUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type,
        limit: limit.toString(),
      });

      if (includeRandom) {
        params.set("includeRandom", "true");
      }

      const response = await fetch(`/api/suggestions?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch suggestions");
      }

      setMutualFriends(data.mutual_friends || []);
      setSimilarRankPlayers(data.similar_rank || []);
      setRandomUsers(data.random_users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [type, limit, enabled, includeRandom]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Combine and dedupe suggestions for allSuggestions
  const allSuggestions = [...mutualFriends];
  const mutualIds = new Set(mutualFriends.map((s) => s.user_id));
  similarRankPlayers.forEach((s) => {
    if (!mutualIds.has(s.user_id)) {
      allSuggestions.push(s);
    }
  });
  // Add random users only if no personalized suggestions
  if (allSuggestions.length === 0 && randomUsers.length > 0) {
    allSuggestions.push(...randomUsers);
  }

  return {
    mutualFriends,
    similarRankPlayers,
    randomUsers,
    allSuggestions,
    loading,
    error,
    refetch: fetchSuggestions,
  };
}
