import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { UserQuest } from '../types/gamification';

interface QuestsResponse {
  daily: UserQuest[];
  weekly: UserQuest[];
  resets: { daily: string; weekly: string } | null;
}

async function fetchQuests(userId: string): Promise<QuestsResponse> {
  const now = new Date().toISOString();

  const { data: dailyData, error: dailyError } = await supabase
    .from('user_quests')
    .select(`
      *,
      quest:quest_definitions(*)
    `)
    .eq('user_id', userId)
    .eq('period_type', 'daily')
    .gte('expires_at', now)
    .order('assigned_at', { ascending: false });

  if (dailyError) throw dailyError;

  const { data: weeklyData, error: weeklyError } = await supabase
    .from('user_quests')
    .select(`
      *,
      quest:quest_definitions(*)
    `)
    .eq('user_id', userId)
    .eq('period_type', 'weekly')
    .gte('expires_at', now)
    .order('assigned_at', { ascending: false });

  if (weeklyError) throw weeklyError;

  // Calculate reset times
  const nowDate = new Date();
  const dailyReset = new Date(nowDate);
  dailyReset.setUTCHours(24, 0, 0, 0);

  const weeklyReset = new Date(nowDate);
  const daysUntilMonday = (8 - nowDate.getUTCDay()) % 7 || 7;
  weeklyReset.setUTCDate(weeklyReset.getUTCDate() + daysUntilMonday);
  weeklyReset.setUTCHours(0, 0, 0, 0);

  return {
    daily: (dailyData || []) as UserQuest[],
    weekly: (weeklyData || []) as UserQuest[],
    resets: {
      daily: dailyReset.toISOString(),
      weekly: weeklyReset.toISOString(),
    },
  };
}

export function useQuests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const questsQuery = useQuery({
    queryKey: ['quests', user?.id],
    queryFn: () => fetchQuests(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  // Real-time subscription for quest updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_quests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_quests',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['quests', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const claimQuestMutation = useMutation({
    mutationFn: async (userQuestId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_quests')
        .update({
          status: 'claimed',
          claimed_at: new Date().toISOString(),
        })
        .eq('id', userQuestId)
        .eq('status', 'completed')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['progression'] });
    },
  });

  const dailyQuests = questsQuery.data?.daily ?? [];
  const weeklyQuests = questsQuery.data?.weekly ?? [];
  const resets = questsQuery.data?.resets ?? null;

  const getTimeUntilReset = (type: 'daily' | 'weekly'): number => {
    if (!resets) return 0;
    const resetTime = new Date(type === 'daily' ? resets.daily : resets.weekly);
    return Math.max(0, resetTime.getTime() - Date.now());
  };

  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const dailyCompleted = dailyQuests.filter(
    (q) => q.status === 'completed' || q.status === 'claimed'
  ).length;

  const weeklyCompleted = weeklyQuests.filter(
    (q) => q.status === 'completed' || q.status === 'claimed'
  ).length;

  const claimableQuests = [...dailyQuests, ...weeklyQuests].filter(
    (q) => q.status === 'completed'
  );

  const claimableXP = claimableQuests.reduce(
    (total, q) => total + (q.quest?.xp_reward || 0),
    0
  );

  return {
    dailyQuests,
    weeklyQuests,
    resets,
    isLoading: questsQuery.isLoading,
    error: questsQuery.error?.message || null,
    refetch: questsQuery.refetch,
    claimQuest: claimQuestMutation.mutateAsync,
    isClaiming: claimQuestMutation.isPending,
    getTimeUntilReset,
    formatTimeRemaining,
    dailyCompleted,
    weeklyCompleted,
    dailyTotal: dailyQuests.length,
    weeklyTotal: weeklyQuests.length,
    claimableQuests,
    claimableXP,
  };
}
