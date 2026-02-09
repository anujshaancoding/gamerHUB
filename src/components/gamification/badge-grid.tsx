"use client";

import { BadgeCard } from "./badge-card";
import { cn } from "@/lib/utils";

interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: string;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

interface BadgeGridProps {
  badges: Badge[];
  userBadges?: UserBadge[];
  onBadgeClick?: (badge: Badge) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  showUnearned?: boolean;
}

export function BadgeGrid({
  badges,
  userBadges = [],
  onBadgeClick,
  size = "md",
  className,
  showUnearned = true,
}: BadgeGridProps) {
  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));

  const displayBadges = showUnearned
    ? badges
    : badges.filter((b) => earnedBadgeIds.has(b.id));

  // Sort: earned first, then by rarity
  const sortedBadges = [...displayBadges].sort((a, b) => {
    const aEarned = earnedBadgeIds.has(a.id);
    const bEarned = earnedBadgeIds.has(b.id);
    if (aEarned !== bEarned) return aEarned ? -1 : 1;

    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  return (
    <div
      className={cn(
        "grid gap-4",
        size === "sm"
          ? "grid-cols-4 sm:grid-cols-6 md:grid-cols-8"
          : size === "md"
            ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
        className
      )}
    >
      {sortedBadges.map((badge) => {
        const userBadge = userBadges.find((ub) => ub.badge_id === badge.id);
        return (
          <BadgeCard
            key={badge.id}
            badge={badge}
            isEarned={!!userBadge}
            earnedAt={userBadge?.earned_at}
            onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
            size={size}
          />
        );
      })}
    </div>
  );
}
