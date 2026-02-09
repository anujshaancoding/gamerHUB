"use client";

import { Gift, Loader2 } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { RewardCard } from "./reward-card";
import type { UserRewardWithDetails } from "@/types/database";

interface RewardsShowcaseProps {
  rewards: UserRewardWithDetails[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onClaimReward?: (rewardId: string) => Promise<void>;
  onEquipReward?: (rewardId: string, equip: boolean) => Promise<void>;
  claimingId?: string;
  equippingId?: string;
  title?: string;
  showPending?: boolean;
}

export function RewardsShowcase({
  rewards,
  loading,
  error,
  hasMore,
  onLoadMore,
  onClaimReward,
  onEquipReward,
  claimingId,
  equippingId,
  title = "My Rewards",
  showPending = false,
}: RewardsShowcaseProps) {
  if (error) {
    return (
      <Card className="text-center py-8">
        <p className="text-error">{error}</p>
      </Card>
    );
  }

  const pendingRewards = rewards.filter((r) => r.status === "pending");
  const claimedRewards = rewards.filter((r) => r.status === "claimed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-warning" />
        <h2 className="text-xl font-bold text-text">{title}</h2>
        {rewards.length > 0 && (
          <Badge variant="outline" size="sm">
            {rewards.length} rewards
          </Badge>
        )}
      </div>

      {loading && rewards.length === 0 ? (
        <Card className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-text-muted">Loading rewards...</p>
        </Card>
      ) : rewards.length === 0 ? (
        <Card className="py-12 text-center">
          <Gift className="h-12 w-12 mx-auto text-text-muted mb-3" />
          <p className="text-text-muted">No rewards yet</p>
          <p className="text-sm text-text-muted mt-1">
            Participate in seasons and challenges to earn rewards!
          </p>
        </Card>
      ) : (
        <>
          {/* Pending Rewards */}
          {showPending && pendingRewards.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-text">
                  Ready to Claim
                </h3>
                <Badge variant="warning" size="sm">
                  {pendingRewards.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pendingRewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    onClaim={
                      onClaimReward
                        ? () => onClaimReward(reward.id)
                        : undefined
                    }
                    claiming={claimingId === reward.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Claimed Rewards */}
          {claimedRewards.length > 0 && (
            <div className="space-y-3">
              {showPending && pendingRewards.length > 0 && (
                <h3 className="text-lg font-semibold text-text">
                  Claimed Rewards
                </h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {claimedRewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    onEquip={
                      onEquipReward
                        ? (equip) => onEquipReward(reward.id, equip)
                        : undefined
                    }
                    equipping={equippingId === reward.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={onLoadMore} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
