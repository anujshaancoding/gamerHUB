"use client";

import { useState } from "react";
import {
  Award,
  Crown,
  Star,
  Gift,
  Check,
  Loader2,
  Clock,
} from "lucide-react";
import { Card, Badge, Button, Modal } from "@/components/ui";
import type { UserRewardWithDetails } from "@/types/database";

interface RewardCardProps {
  reward: UserRewardWithDetails;
  onClaim?: () => Promise<void>;
  onEquip?: (equip: boolean) => Promise<void>;
  claiming?: boolean;
  equipping?: boolean;
}

export function RewardCard({
  reward,
  onClaim,
  onEquip,
  claiming = false,
  equipping = false,
}: RewardCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getRarityColor = (rarity: string | null) => {
    switch (rarity) {
      case "common":
        return "outline";
      case "uncommon":
        return "success";
      case "rare":
        return "primary";
      case "epic":
        return "accent";
      case "legendary":
        return "warning";
      default:
        return "outline";
    }
  };

  const getRewardIcon = () => {
    switch (reward.reward_type) {
      case "badge":
        return <Award className="h-6 w-6" />;
      case "title":
        return <Crown className="h-6 w-6" />;
      case "avatar_frame":
        return <Star className="h-6 w-6" />;
      default:
        return <Gift className="h-6 w-6" />;
    }
  };

  const getStatusBadge = () => {
    switch (reward.status) {
      case "pending":
        return <Badge variant="warning">Claim Now</Badge>;
      case "claimed":
        return <Badge variant="success">Claimed</Badge>;
      case "expired":
        return <Badge variant="error">Expired</Badge>;
      case "revoked":
        return <Badge variant="error">Revoked</Badge>;
      default:
        return null;
    }
  };

  const rarity = reward.season_reward?.rarity || null;

  return (
    <>
      <Card
        variant="interactive"
        className={`h-full relative ${
          reward.is_equipped ? "ring-2 ring-primary" : ""
        }`}
        onClick={() => setShowDetails(true)}
      >
        {/* Equipped indicator */}
        {reward.is_equipped && (
          <div className="absolute top-2 right-2">
            <Badge variant="primary" size="sm">
              Equipped
            </Badge>
          </div>
        )}

        {/* Icon & Rarity */}
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg ${
              rarity === "legendary"
                ? "bg-warning/20 text-warning"
                : rarity === "epic"
                  ? "bg-accent/20 text-accent"
                  : rarity === "rare"
                    ? "bg-primary/20 text-primary"
                    : "bg-surface-light text-text-muted"
            }`}
          >
            {getRewardIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text truncate">
                {reward.reward_name}
              </h3>
            </div>
            <p className="text-sm text-text-muted capitalize">
              {reward.reward_type.replace("_", " ")}
            </p>
          </div>
        </div>

        {/* Rarity & Status */}
        <div className="flex items-center justify-between mt-3">
          {rarity && (
            <Badge variant={getRarityColor(rarity) as "outline" | "success" | "primary" | "warning"} size="sm">
              {rarity}
            </Badge>
          )}
          {getStatusBadge()}
        </div>

        {/* Season info */}
        {reward.season && (
          <div className="mt-3 pt-3 border-t border-border text-xs text-text-muted">
            <span>{reward.season.name}</span>
            {reward.earned_rank && (
              <span className="ml-2">• Rank #{reward.earned_rank}</span>
            )}
          </div>
        )}
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={reward.reward_name}
        size="sm"
      >
        <div className="space-y-4">
          {/* Icon */}
          <div className="text-center">
            <div
              className={`inline-flex p-4 rounded-xl ${
                rarity === "legendary"
                  ? "bg-warning/20 text-warning"
                  : rarity === "epic"
                    ? "bg-accent/20 text-accent"
                    : rarity === "rare"
                      ? "bg-primary/20 text-primary"
                      : "bg-surface-light text-text-muted"
              }`}
            >
              {getRewardIcon()}
            </div>
          </div>

          {/* Badges */}
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="capitalize">
              {reward.reward_type.replace("_", " ")}
            </Badge>
            {rarity && (
              <Badge variant={getRarityColor(rarity) as "outline" | "success" | "primary" | "warning"}>
                {rarity}
              </Badge>
            )}
            {getStatusBadge()}
          </div>

          {/* Description */}
          {reward.season_reward?.description && (
            <p className="text-center text-text-secondary">
              {reward.season_reward.description}
            </p>
          )}

          {/* Earned Info */}
          <div className="bg-surface-light rounded-lg p-3 space-y-1 text-sm">
            {reward.season && (
              <div className="flex justify-between">
                <span className="text-text-muted">Season</span>
                <span className="text-text">{reward.season.name}</span>
              </div>
            )}
            {reward.earned_rank && (
              <div className="flex justify-between">
                <span className="text-text-muted">Rank</span>
                <span className="text-text">#{reward.earned_rank}</span>
              </div>
            )}
            {reward.earned_points && (
              <div className="flex justify-between">
                <span className="text-text-muted">Points</span>
                <span className="text-text">
                  {reward.earned_points.toLocaleString()}
                </span>
              </div>
            )}
            {reward.claimed_at && (
              <div className="flex justify-between">
                <span className="text-text-muted">Claimed</span>
                <span className="text-text">
                  {new Date(reward.claimed_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Expiry Warning */}
          {reward.status === "pending" && reward.expires_at && (
            <div className="flex items-center gap-2 text-warning text-sm">
              <Clock className="h-4 w-4" />
              Expires {new Date(reward.expires_at).toLocaleDateString()}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {reward.status === "pending" && onClaim && (
              <Button
                variant="primary"
                className="flex-1"
                onClick={async () => {
                  await onClaim();
                  setShowDetails(false);
                }}
                disabled={claiming}
                leftIcon={
                  claiming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Gift className="h-4 w-4" />
                  )
                }
              >
                {claiming ? "Claiming..." : "Claim Reward"}
              </Button>
            )}
            {reward.status === "claimed" && onEquip && (
              <Button
                variant={reward.is_equipped ? "outline" : "primary"}
                className="flex-1"
                onClick={async () => {
                  await onEquip(!reward.is_equipped);
                  setShowDetails(false);
                }}
                disabled={equipping}
                leftIcon={
                  equipping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )
                }
              >
                {equipping
                  ? "Updating..."
                  : reward.is_equipped
                    ? "Unequip"
                    : "Equip"}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
