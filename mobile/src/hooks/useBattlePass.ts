import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { BattlePass, BattlePassProgress, BattlePassReward } from '../types/gamification';

async function fetchBattlePass(): Promise<BattlePass | null> {
  const { data, error } = await supabase
    .from('battle_passes')
    .select(`
      *,
      rewards:battle_pass_rewards(*)
    `)
    .eq('status', 'active')
    .order('season_number', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as BattlePass;
}

async function fetchProgress(userId: string, battlePassId: string): Promise<BattlePassProgress | null> {
  const { data, error } = await supabase
    .from('battle_pass_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('battle_pass_id', battlePassId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as BattlePassProgress;
}

export function useBattlePass() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const battlePassQuery = useQuery({
    queryKey: ['battle-pass'],
    queryFn: fetchBattlePass,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const battlePass = battlePassQuery.data;

  const progressQuery = useQuery({
    queryKey: ['battle-pass-progress', user?.id, battlePass?.id],
    queryFn: () => fetchProgress(user!.id, battlePass!.id),
    enabled: !!user && !!battlePass,
    staleTime: 1000 * 30, // 30 seconds
  });

  const claimRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      if (!user || !progressQuery.data) throw new Error('Not authenticated');

      const currentClaimed = progressQuery.data.claimed_rewards || [];

      const { error } = await supabase
        .from('battle_pass_progress')
        .update({
          claimed_rewards: [...currentClaimed, rewardId],
        })
        .eq('id', progressQuery.data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-pass-progress'] });
    },
  });

  const progress = progressQuery.data;
  const enrolled = !!progress;
  const isPremium = progress?.is_premium || false;

  const xpPerLevel = battlePass?.xp_per_level || 1000;
  const currentXp = progress?.current_xp || 0;
  const xpProgress = Math.round((currentXp / xpPerLevel) * 100);

  const endsAt = battlePass?.ends_at ? new Date(battlePass.ends_at) : null;
  const timeRemaining = endsAt ? Math.max(0, endsAt.getTime() - Date.now()) : 0;
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  const getRewardsForLevel = (level: number): BattlePassReward[] => {
    return battlePass?.rewards?.filter((r) => r.level === level) || [];
  };

  const isRewardClaimed = (rewardId: string): boolean => {
    return progress?.claimed_rewards?.includes(rewardId) || false;
  };

  const canClaimReward = (reward: BattlePassReward): boolean => {
    const currentLevel = progress?.current_level || 1;
    if (currentLevel < reward.level) return false;
    if (reward.tier === 'premium' && !isPremium) return false;
    if (isRewardClaimed(reward.id)) return false;
    return true;
  };

  return {
    battlePass,
    progress,
    enrolled,
    isPremium,
    currentLevel: progress?.current_level || 1,
    currentXp,
    xpPerLevel,
    xpProgress,
    maxLevel: battlePass?.max_level || 100,
    daysRemaining,
    endsAt,
    isLoading: battlePassQuery.isLoading || progressQuery.isLoading,
    claim: claimRewardMutation.mutateAsync,
    isClaiming: claimRewardMutation.isPending,
    getRewardsForLevel,
    isRewardClaimed,
    canClaimReward,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['battle-pass'] });
      queryClient.invalidateQueries({ queryKey: ['battle-pass-progress'] });
    },
  };
}
