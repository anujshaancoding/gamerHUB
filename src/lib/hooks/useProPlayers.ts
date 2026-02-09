"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProPlayer } from "@/app/api/pro-players/route";

interface UseProPlayersOptions {
  gameId?: string;
  limit?: number;
  enabled?: boolean;
}

interface UseProPlayersReturn {
  proPlayers: ProPlayer[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProPlayers(options: UseProPlayersOptions = {}): UseProPlayersReturn {
  const { gameId, limit = 10, enabled = true } = options;

  const [proPlayers, setProPlayers] = useState<ProPlayer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProPlayers = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (gameId) {
        params.set("game_id", gameId);
      }

      const response = await fetch(`/api/pro-players?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch pro players");
      }

      setProPlayers(data.pro_players || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [gameId, limit, enabled]);

  useEffect(() => {
    fetchProPlayers();
  }, [fetchProPlayers]);

  return {
    proPlayers,
    total,
    loading,
    error,
    refetch: fetchProPlayers,
  };
}
