"use client";

import { useState, useEffect, useCallback } from "react";
import type { SuggestedUser } from "@/app/api/suggestions/route";

interface UseSuggestionsOptions {
  type?: "mutual" | "similar_rank" | "all";
  limit?: number;
  enabled?: boolean;
}

interface UseSuggestionsReturn {
  mutualFriends: SuggestedUser[];
  similarRankPlayers: SuggestedUser[];
  allSuggestions: SuggestedUser[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSuggestions(options: UseSuggestionsOptions = {}): UseSuggestionsReturn {
  const { type = "all", limit = 10, enabled = true } = options;

  const [mutualFriends, setMutualFriends] = useState<SuggestedUser[]>([]);
  const [similarRankPlayers, setSimilarRankPlayers] = useState<SuggestedUser[]>([]);
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

      const response = await fetch(`/api/suggestions?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch suggestions");
      }

      setMutualFriends(data.mutual_friends || []);
      setSimilarRankPlayers(data.similar_rank || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [type, limit, enabled]);

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

  return {
    mutualFriends,
    similarRankPlayers,
    allSuggestions,
    loading,
    error,
    refetch: fetchSuggestions,
  };
}
