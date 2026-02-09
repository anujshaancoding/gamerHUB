import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Tournament, TournamentParticipant, TournamentMatch, TournamentBracket } from '../types/tournament';

interface UseTournamentsOptions {
  gameId?: string;
  status?: Tournament['status'];
  limit?: number;
}

async function fetchTournaments(options: UseTournamentsOptions): Promise<Tournament[]> {
  let query = supabase
    .from('tournaments')
    .select(`
      *,
      game:games(*),
      participants:tournament_participants(count)
    `)
    .order('starts_at', { ascending: true });

  if (options.gameId) {
    query = query.eq('game_id', options.gameId);
  }

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((t) => ({
    ...t,
    participants_count: (t.participants as any)?.[0]?.count || 0,
  })) as Tournament[];
}

async function fetchTournament(tournamentId: string): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      game:games(*),
      participants:tournament_participants(
        *,
        user:profiles(*)
      )
    `)
    .eq('id', tournamentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    ...data,
    participants_count: data.participants?.length || 0,
  } as Tournament;
}

async function fetchTournamentBracket(tournamentId: string): Promise<TournamentMatch[]> {
  const { data, error } = await supabase
    .from('tournament_matches')
    .select(`
      *,
      participant1:tournament_participants!participant1_id(*, user:profiles(*)),
      participant2:tournament_participants!participant2_id(*, user:profiles(*))
    `)
    .eq('tournament_id', tournamentId)
    .order('round', { ascending: true })
    .order('match_number', { ascending: true });

  if (error) throw error;
  return (data || []) as TournamentMatch[];
}

export function useTournaments(options: UseTournamentsOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tournamentsQuery = useQuery({
    queryKey: ['tournaments', options],
    queryFn: () => fetchTournaments(options),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const myTournamentsQuery = useQuery({
    queryKey: ['my-tournaments', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('tournament_participants')
        .select(`
          *,
          tournament:tournaments(*, game:games(*))
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map((p) => p.tournament) || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const joinTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          status: 'registered',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
    },
  });

  const leaveTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tournament_participants')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
    },
  });

  return {
    tournaments: tournamentsQuery.data ?? [],
    myTournaments: myTournamentsQuery.data ?? [],
    isLoading: tournamentsQuery.isLoading,
    error: tournamentsQuery.error?.message || null,
    refetch: tournamentsQuery.refetch,
    joinTournament: joinTournamentMutation.mutateAsync,
    leaveTournament: leaveTournamentMutation.mutateAsync,
    isJoining: joinTournamentMutation.isPending,
    isLeaving: leaveTournamentMutation.isPending,
  };
}

export function useTournament(tournamentId: string) {
  const { user } = useAuth();

  const tournamentQuery = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => fetchTournament(tournamentId),
    enabled: !!tournamentId,
    staleTime: 1000 * 60,
  });

  const bracketQuery = useQuery({
    queryKey: ['tournament-bracket', tournamentId],
    queryFn: () => fetchTournamentBracket(tournamentId),
    enabled: !!tournamentId,
    staleTime: 1000 * 30,
  });

  const tournament = tournamentQuery.data;
  const matches = bracketQuery.data ?? [];

  const isParticipant = tournament?.participants?.some(
    (p: any) => p.user_id === user?.id
  );

  const rounds = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, TournamentMatch[]>);

  return {
    tournament,
    matches,
    rounds,
    isParticipant,
    isLoading: tournamentQuery.isLoading || bracketQuery.isLoading,
    error: tournamentQuery.error?.message || bracketQuery.error?.message || null,
    refetch: () => {
      tournamentQuery.refetch();
      bracketQuery.refetch();
    },
  };
}
