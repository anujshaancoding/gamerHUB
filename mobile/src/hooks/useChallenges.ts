import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Challenge, CommunityChallenge, CommunityChallengeParticipant } from '../types/tournament';

interface UseChallengesOptions {
  gameId?: string;
  status?: Challenge['status'];
  limit?: number;
}

async function fetchChallenges(userId: string, options: UseChallengesOptions): Promise<Challenge[]> {
  let query = supabase
    .from('challenges')
    .select(`
      *,
      game:games(*),
      creator:profiles!creator_id(*),
      opponent:profiles!opponent_id(*)
    `)
    .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
    .order('created_at', { ascending: false });

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
  return (data || []) as Challenge[];
}

async function fetchCommunityChallenges(status?: CommunityChallenge['status']): Promise<CommunityChallenge[]> {
  let query = supabase
    .from('community_challenges')
    .select(`
      *,
      game:games(*)
    `)
    .order('start_date', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as CommunityChallenge[];
}

async function fetchMyChallengeParticipations(userId: string): Promise<CommunityChallengeParticipant[]> {
  const { data, error } = await supabase
    .from('community_challenge_participants')
    .select(`
      *,
      challenge:community_challenges(*, game:games(*))
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error) throw error;
  return (data || []) as CommunityChallengeParticipant[];
}

export function useChallenges(options: UseChallengesOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const challengesQuery = useQuery({
    queryKey: ['challenges', user?.id, options],
    queryFn: () => fetchChallenges(user!.id, options),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (challengeData: {
      opponent_id?: string;
      game_id: string;
      title: string;
      description?: string;
      wager_amount?: number;
      expires_at?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          ...challengeData,
          creator_id: user.id,
          expires_at: challengeData.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });

  const acceptChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('challenges')
        .update({
          opponent_id: user.id,
          status: 'accepted',
        })
        .eq('id', challengeId)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });

  const updateChallengeStatusMutation = useMutation({
    mutationFn: async ({ challengeId, status, winnerId }: {
      challengeId: string;
      status: Challenge['status'];
      winnerId?: string
    }) => {
      const updates: any = { status };
      if (winnerId) updates.winner_id = winnerId;
      if (status === 'completed') updates.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from('challenges')
        .update(updates)
        .eq('id', challengeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });

  const activeChallenges = challengesQuery.data?.filter(
    (c) => c.status === 'pending' || c.status === 'accepted' || c.status === 'in_progress'
  ) ?? [];

  const completedChallenges = challengesQuery.data?.filter(
    (c) => c.status === 'completed'
  ) ?? [];

  return {
    challenges: challengesQuery.data ?? [],
    activeChallenges,
    completedChallenges,
    isLoading: challengesQuery.isLoading,
    error: challengesQuery.error?.message || null,
    refetch: challengesQuery.refetch,
    createChallenge: createChallengeMutation.mutateAsync,
    acceptChallenge: acceptChallengeMutation.mutateAsync,
    updateChallengeStatus: updateChallengeStatusMutation.mutateAsync,
    isCreating: createChallengeMutation.isPending,
  };
}

export function useCommunityChallenges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const challengesQuery = useQuery({
    queryKey: ['community-challenges'],
    queryFn: () => fetchCommunityChallenges('active'),
    staleTime: 1000 * 60 * 5,
  });

  const participationsQuery = useQuery({
    queryKey: ['my-challenge-participations', user?.id],
    queryFn: () => fetchMyChallengeParticipations(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('community_challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
        });

      if (error) throw error;

      // Increment participants count
      await supabase.rpc('increment_challenge_participants', { challenge_id: challengeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['my-challenge-participations'] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ challengeId, progress }: { challengeId: string; progress: number }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: participation, error: fetchError } = await supabase
        .from('community_challenge_participants')
        .select('*, challenge:community_challenges(*)')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const challenge = participation.challenge as CommunityChallenge;
      const completed = progress >= challenge.target_value;

      const { error } = await supabase
        .from('community_challenge_participants')
        .update({
          progress,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', participation.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-challenge-participations'] });
    },
  });

  const joinedChallengeIds = new Set(participationsQuery.data?.map((p) => p.challenge_id) || []);

  return {
    challenges: challengesQuery.data ?? [],
    participations: participationsQuery.data ?? [],
    isLoading: challengesQuery.isLoading,
    error: challengesQuery.error?.message || null,
    refetch: challengesQuery.refetch,
    joinChallenge: joinChallengeMutation.mutateAsync,
    updateProgress: updateProgressMutation.mutateAsync,
    isJoined: (challengeId: string) => joinedChallengeIds.has(challengeId),
    isJoining: joinChallengeMutation.isPending,
  };
}
