"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES } from "@/lib/query";
import type { Game } from "@/types/database";

async function fetchGames(): Promise<Game[]> {
  const response = await fetch("/api/games");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch games");
  }

  return data.games || [];
}

export function useGames() {
  const {
    data: games,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.games,
    queryFn: fetchGames,
    staleTime: STALE_TIMES.GAMES,
  });

  // Helper to get game by slug
  const getGameBySlug = (slug: string) =>
    games?.find((game) => game.slug === slug);

  // Helper to get game by ID
  const getGameById = (id: string) =>
    games?.find((game) => game.id === id);

  return {
    games: games ?? [],
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
    getGameBySlug,
    getGameById,
  };
}
