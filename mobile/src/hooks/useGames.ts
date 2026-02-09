import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Game, UserGame } from '../types/database';

export function useGames() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const gamesQuery = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Game[];
    },
  });

  const userGamesQuery = useQuery({
    queryKey: ['user-games', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_games')
        .select(`
          *,
          game:games(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addUserGameMutation = useMutation({
    mutationFn: async (gameData: {
      game_id: string;
      game_username?: string;
      rank?: string;
      role?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_games')
        .insert({
          ...gameData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
    },
  });

  const updateUserGameMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<UserGame>) => {
      const { data, error } = await supabase
        .from('user_games')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
    },
  });

  const removeUserGameMutation = useMutation({
    mutationFn: async (userGameId: string) => {
      const { error } = await supabase
        .from('user_games')
        .delete()
        .eq('id', userGameId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
    },
  });

  return {
    games: gamesQuery.data ?? [],
    userGames: userGamesQuery.data ?? [],
    isLoading: gamesQuery.isLoading || userGamesQuery.isLoading,
    addUserGame: addUserGameMutation.mutateAsync,
    updateUserGame: updateUserGameMutation.mutateAsync,
    removeUserGame: removeUserGameMutation.mutateAsync,
  };
}
