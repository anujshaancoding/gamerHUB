import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Match } from '../types/database';

export function useMatches() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const upcomingMatchesQuery = useQuery({
    queryKey: ['matches', 'upcoming', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          game:games(*),
          host:profiles!matches_host_id_fkey(*)
        `)
        .eq('status', 'upcoming')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const myMatchesQuery = useQuery({
    queryKey: ['matches', 'my', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          game:games(*),
          host:profiles!matches_host_id_fkey(*)
        `)
        .eq('host_id', user.id)
        .order('scheduled_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMatchMutation = useMutation({
    mutationFn: async (matchData: {
      game_id: string;
      title: string;
      description?: string;
      game_mode?: string;
      max_players?: number;
      scheduled_at: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('matches')
        .insert({
          ...matchData,
          host_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  const joinMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('match_participants')
        .insert({
          match_id: matchId,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  const leaveMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('match_participants')
        .delete()
        .eq('match_id', matchId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  return {
    upcomingMatches: upcomingMatchesQuery.data ?? [],
    myMatches: myMatchesQuery.data ?? [],
    isLoading: upcomingMatchesQuery.isLoading || myMatchesQuery.isLoading,
    createMatch: createMatchMutation.mutateAsync,
    joinMatch: joinMatchMutation.mutateAsync,
    leaveMatch: leaveMatchMutation.mutateAsync,
  };
}
