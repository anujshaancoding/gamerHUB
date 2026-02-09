"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface BattlePassReward {
  id: string;
  battle_pass_id: string;
  level: number;
  tier: "free" | "premium";
  reward_type: string;
  reward_value: Record<string, unknown>;
  name: string;
  description: string | null;
  icon_url: string | null;
  rarity: string;
  sort_order: number;
}

interface BattlePass {
  id: string;
  name: string;
  slug: string;
  season_number: number;
  description: string | null;
  banner_url: string | null;
  price_standard: number;
  price_premium: number | null;
  starts_at: string;
  ends_at: string;
  max_level: number;
  xp_per_level: number;
  status: "upcoming" | "active" | "completed";
  rewards: BattlePassReward[];
}

interface BattlePassProgress {
  id: string;
  user_id: string;
  battle_pass_id: string;
  is_premium: boolean;
  current_level: number;
  current_xp: number;
  claimed_rewards: string[];
  purchased_at: string | null;
}

// Fetch battle pass
async function fetchBattlePass(): Promise<BattlePass | null> {
  const res = await fetch("/api/battle-pass");
  if (!res.ok) throw new Error("Failed to fetch battle pass");
  const data = await res.json();
  return data.battlePass;
}

// Fetch user progress
async function fetchProgress(): Promise<{
  progress: BattlePassProgress | null;
  enrolled: boolean;
}> {
  const res = await fetch("/api/battle-pass/progress");
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
}

// Purchase battle pass
async function purchaseBattlePass(tier: "standard" | "premium"): Promise<{ url: string }> {
  const res = await fetch("/api/battle-pass/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier }),
  });
  if (!res.ok) throw new Error("Failed to purchase battle pass");
  return res.json();
}

// Claim reward
async function claimReward(rewardId: string): Promise<{
  success: boolean;
  reward: { type: string; value: unknown; name: string };
}> {
  const res = await fetch(`/api/battle-pass/claim/${rewardId}`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to claim reward");
  }
  return res.json();
}

export function useBattlePass() {
  const queryClient = useQueryClient();

  // Query for battle pass
  const battlePassQuery = useQuery({
    queryKey: ["battle-pass"],
    queryFn: fetchBattlePass,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query for progress
  const progressQuery = useQuery({
    queryKey: ["battle-pass-progress"],
    queryFn: fetchProgress,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Mutation for purchasing
  const purchaseMutation = useMutation({
    mutationFn: purchaseBattlePass,
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });

  // Mutation for claiming
  const claimMutation = useMutation({
    mutationFn: claimReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["battle-pass-progress"] });
    },
  });

  // Computed values
  const battlePass = battlePassQuery.data;
  const progress = progressQuery.data?.progress;
  const enrolled = progressQuery.data?.enrolled || false;
  const isPremium = progress?.is_premium || false;

  // Calculate XP progress
  const xpPerLevel = battlePass?.xp_per_level || 1000;
  const currentXp = progress?.current_xp || 0;
  const xpProgress = Math.round((currentXp / xpPerLevel) * 100);

  // Time remaining
  const endsAt = battlePass?.ends_at ? new Date(battlePass.ends_at) : null;
  const timeRemaining = endsAt ? Math.max(0, endsAt.getTime() - Date.now()) : 0;
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  // Get rewards by level
  const getRewardsForLevel = (level: number) => {
    return battlePass?.rewards?.filter((r) => r.level === level) || [];
  };

  // Check if reward is claimed
  const isRewardClaimed = (rewardId: string) => {
    return progress?.claimed_rewards?.includes(rewardId) || false;
  };

  // Check if reward can be claimed
  const canClaimReward = (reward: BattlePassReward) => {
    const currentLevel = progress?.current_level || 1;
    if (currentLevel < reward.level) return false;
    if (reward.tier === "premium" && !isPremium) return false;
    if (isRewardClaimed(reward.id)) return false;
    return true;
  };

  return {
    // Data
    battlePass,
    progress,
    enrolled,
    isPremium,

    // Progress calculations
    currentLevel: progress?.current_level || 1,
    currentXp,
    xpPerLevel,
    xpProgress,
    maxLevel: battlePass?.max_level || 100,

    // Time
    daysRemaining,
    endsAt,

    // Loading states
    isLoading: battlePassQuery.isLoading || progressQuery.isLoading,
    isLoadingBattlePass: battlePassQuery.isLoading,
    isLoadingProgress: progressQuery.isLoading,

    // Actions
    purchase: purchaseMutation.mutate,
    claim: claimMutation.mutate,

    // Mutation states
    isPurchasing: purchaseMutation.isPending,
    isClaiming: claimMutation.isPending,
    claimError: claimMutation.error?.message,

    // Helpers
    getRewardsForLevel,
    isRewardClaimed,
    canClaimReward,

    // Refetch
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ["battle-pass"] });
      queryClient.invalidateQueries({ queryKey: ["battle-pass-progress"] });
    },
  };
}
