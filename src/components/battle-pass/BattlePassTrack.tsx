"use client";

import { useBattlePass } from "@/lib/hooks/useBattlePass";
import { RewardItem } from "./RewardItem";
import { cn } from "@/lib/utils";

interface BattlePassTrackProps {
  className?: string;
}

export function BattlePassTrack({ className }: BattlePassTrackProps) {
  const {
    battlePass,
    progress,
    currentLevel,
    isPremium,
    getRewardsForLevel,
    isRewardClaimed,
    canClaimReward,
    claim,
    isClaiming,
  } = useBattlePass();

  if (!battlePass) {
    return null;
  }

  // Get unique levels that have rewards
  const rewardLevels = Array.from(
    new Set(battlePass.rewards?.map((r) => r.level) || [])
  ).sort((a, b) => a - b);

  return (
    <div className={cn("overflow-x-auto pb-4", className)}>
      <div className="flex gap-4 min-w-max px-4">
        {rewardLevels.map((level) => {
          const levelRewards = getRewardsForLevel(level);
          const freeReward = levelRewards.find((r) => r.tier === "free");
          const premiumReward = levelRewards.find((r) => r.tier === "premium");
          const isUnlocked = currentLevel >= level;

          return (
            <div key={level} className="flex flex-col items-center gap-2">
              {/* Premium reward */}
              <div className="w-24">
                {premiumReward ? (
                  <RewardItem
                    name={premiumReward.name}
                    description={premiumReward.description}
                    iconUrl={premiumReward.icon_url}
                    rarity={premiumReward.rarity}
                    tier="premium"
                    isUnlocked={isUnlocked}
                    isClaimed={isRewardClaimed(premiumReward.id)}
                    canClaim={canClaimReward(premiumReward)}
                    onClaim={() => claim(premiumReward.id)}
                    isClaiming={isClaiming}
                  />
                ) : (
                  <div className="h-24" /> // Spacer
                )}
              </div>

              {/* Level indicator */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                  isUnlocked
                    ? "bg-orange-500 border-orange-400 text-white"
                    : "bg-zinc-800 border-zinc-700 text-zinc-500"
                )}
              >
                {level}
              </div>

              {/* Free reward */}
              <div className="w-24">
                {freeReward ? (
                  <RewardItem
                    name={freeReward.name}
                    description={freeReward.description}
                    iconUrl={freeReward.icon_url}
                    rarity={freeReward.rarity}
                    tier="free"
                    isUnlocked={isUnlocked}
                    isClaimed={isRewardClaimed(freeReward.id)}
                    canClaim={canClaimReward(freeReward)}
                    onClaim={() => claim(freeReward.id)}
                    isClaiming={isClaiming}
                  />
                ) : (
                  <div className="h-24" /> // Spacer
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Track labels */}
      <div className="flex justify-between px-4 mt-4 text-xs text-zinc-500">
        <span>Premium Track {isPremium ? "✓" : "(Locked)"}</span>
        <span>Free Track</span>
      </div>
    </div>
  );
}
