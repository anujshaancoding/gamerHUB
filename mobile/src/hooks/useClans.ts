import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { ClanDetails, ClanMember, ClanInvite, ClanChallenge, ClanRecruitmentPost } from '../types/clan';

interface UseClansOptions {
  search?: string;
  gameId?: string;
  isRecruiting?: boolean;
  limit?: number;
}

async function fetchClans(options: UseClansOptions): Promise<ClanDetails[]> {
  let query = supabase
    .from('clans')
    .select(`
      *,
      owner:profiles!owner_id(*),
      primary_game:games(*)
    `)
    .eq('is_public', true)
    .order('member_count', { ascending: false });

  if (options.search) {
    query = query.or(`name.ilike.%${options.search}%,tag.ilike.%${options.search}%`);
  }

  if (options.gameId) {
    query = query.eq('primary_game_id', options.gameId);
  }

  if (options.isRecruiting !== undefined) {
    query = query.eq('is_recruiting', options.isRecruiting);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as ClanDetails[];
}

async function fetchClan(clanId: string): Promise<ClanDetails | null> {
  const { data, error } = await supabase
    .from('clans')
    .select(`
      *,
      owner:profiles!owner_id(*),
      primary_game:games(*),
      members:clan_members(*, user:profiles(*)),
      games:clan_games(*, game:games(*))
    `)
    .eq('id', clanId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as ClanDetails;
}

async function fetchMyClans(userId: string): Promise<ClanDetails[]> {
  const { data, error } = await supabase
    .from('clan_members')
    .select(`
      clan:clans(
        *,
        owner:profiles!owner_id(*),
        primary_game:games(*)
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return (data?.map((m) => m.clan) || []) as ClanDetails[];
}

async function fetchClanInvites(userId: string): Promise<ClanInvite[]> {
  const { data, error } = await supabase
    .from('clan_invites')
    .select(`
      *,
      clan:clans(*),
      inviter:profiles!invited_by(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ClanInvite[];
}

export function useClans(options: UseClansOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const clansQuery = useQuery({
    queryKey: ['clans', options],
    queryFn: () => fetchClans(options),
    staleTime: 1000 * 60 * 2,
  });

  const myClansQuery = useQuery({
    queryKey: ['my-clans', user?.id],
    queryFn: () => fetchMyClans(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const invitesQuery = useQuery({
    queryKey: ['clan-invites', user?.id],
    queryFn: () => fetchClanInvites(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60,
  });

  const createClanMutation = useMutation({
    mutationFn: async (clanData: {
      name: string;
      tag: string;
      description?: string;
      primary_game_id?: string;
      is_public?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('clans')
        .insert({
          ...clanData,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as member
      await supabase.from('clan_members').insert({
        clan_id: data.id,
        user_id: user.id,
        role: 'owner',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
      queryClient.invalidateQueries({ queryKey: ['my-clans'] });
    },
  });

  const joinClanMutation = useMutation({
    mutationFn: async (clanId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('clan_members').insert({
        clan_id: clanId,
        user_id: user.id,
        role: 'member',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
      queryClient.invalidateQueries({ queryKey: ['my-clans'] });
    },
  });

  const leaveClanMutation = useMutation({
    mutationFn: async (clanId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('clan_members')
        .delete()
        .eq('clan_id', clanId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clans'] });
      queryClient.invalidateQueries({ queryKey: ['my-clans'] });
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data: invite, error: fetchError } = await supabase
        .from('clan_invites')
        .select('clan_id')
        .eq('id', inviteId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('clan_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);

      if (updateError) throw updateError;

      const { error: joinError } = await supabase.from('clan_members').insert({
        clan_id: invite.clan_id,
        user_id: user.id,
        role: 'member',
      });

      if (joinError) throw joinError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clan-invites'] });
      queryClient.invalidateQueries({ queryKey: ['my-clans'] });
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('clan_invites')
        .update({ status: 'rejected' })
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clan-invites'] });
    },
  });

  return {
    clans: clansQuery.data ?? [],
    myClans: myClansQuery.data ?? [],
    invites: invitesQuery.data ?? [],
    isLoading: clansQuery.isLoading,
    error: clansQuery.error?.message || null,
    refetch: clansQuery.refetch,
    createClan: createClanMutation.mutateAsync,
    joinClan: joinClanMutation.mutateAsync,
    leaveClan: leaveClanMutation.mutateAsync,
    acceptInvite: acceptInviteMutation.mutateAsync,
    declineInvite: declineInviteMutation.mutateAsync,
    isCreating: createClanMutation.isPending,
    isJoining: joinClanMutation.isPending,
  };
}

export function useClan(clanId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const clanQuery = useQuery({
    queryKey: ['clan', clanId],
    queryFn: () => fetchClan(clanId),
    enabled: !!clanId,
    staleTime: 1000 * 60,
  });

  const clan = clanQuery.data;
  const membership = clan?.members?.find((m) => m.user_id === user?.id);
  const isOwner = clan?.owner_id === user?.id;
  const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';
  const isMember = !!membership;

  const inviteMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('clan_invites').insert({
        clan_id: clanId,
        user_id: userId,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clan', clanId] });
    },
  });

  const kickMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('clan_members')
        .delete()
        .eq('clan_id', clanId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clan', clanId] });
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: ClanMember['role'] }) => {
      const { error } = await supabase
        .from('clan_members')
        .update({ role })
        .eq('clan_id', clanId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clan', clanId] });
    },
  });

  return {
    clan,
    membership,
    isOwner,
    isAdmin,
    isMember,
    isLoading: clanQuery.isLoading,
    error: clanQuery.error?.message || null,
    refetch: clanQuery.refetch,
    inviteMember: inviteMemberMutation.mutateAsync,
    kickMember: kickMemberMutation.mutateAsync,
    updateMemberRole: updateMemberRoleMutation.mutateAsync,
  };
}
