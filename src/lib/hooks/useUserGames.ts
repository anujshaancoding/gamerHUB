"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES } from "@/lib/query/provider";
import type { UserGame, Game } from "@/types/database";

export interface UserGameWithGame extends UserGame {
  game: Game | null;
}

interface CreateUserGameInput {
  game_slug: string;
  game_username?: string;
  rank?: string;
  role?: string;
  stats?: {
    kd_ratio?: number;
    win_rate?: number;
    hours_played?: number;
    matches_played?: number;
  };
  is_public?: boolean;
}

interface UpdateUserGameInput {
  id: string;
  game_username?: string;
  rank?: string;
  role?: string;
  stats?: {
    kd_ratio?: number;
    win_rate?: number;
    hours_played?: number;
    matches_played?: number;
  };
  is_public?: boolean;
}

// Fetch current user's games
async function fetchMyGames(): Promise<UserGameWithGame[]> {
  const response = await fetch("/api/user-games");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch games");
  }

  return data.userGames;
}

// Hook: Fetch current user's linked games
export function useMyGames() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.userGames(),
    queryFn: fetchMyGames,
    staleTime: STALE_TIMES.USER_GAMES,
  });

  return {
    userGames: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

// Hook: Create a new user game profile
export function useCreateUserGame() {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (input: CreateUserGameInput) => {
      const response = await fetch("/api/user-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add game");
      }

      return data.userGame as UserGameWithGame;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-games"] });
    },
  });

  return {
    createGame: mutateAsync,
    creating: isPending,
    error: error?.message ?? null,
  };
}

// Hook: Update an existing user game profile
export function useUpdateUserGame() {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (input: UpdateUserGameInput) => {
      const response = await fetch("/api/user-games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update game");
      }

      return data.userGame as UserGameWithGame;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-games"] });
    },
  });

  return {
    updateGame: mutateAsync,
    updating: isPending,
    error: error?.message ?? null,
  };
}

// Hook: Delete a user game profile
export function useDeleteUserGame() {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/user-games", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete game");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-games"] });
    },
  });

  return {
    deleteGame: mutateAsync,
    deleting: isPending,
    error: error?.message ?? null,
  };
}
