"use client";

import { Lock, Medal } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface BadgeCardProps {
  badge: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon_url: string | null;
    rarity: "common" | "rare" | "epic" | "legendary";
    category: string;
  };
  isEarned?: boolean;
  earnedAt?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const rarityColors = {
  common: "border-text-muted/50",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-yellow-500",
};

const rarityGlows = {
  common: "",
  rare: "shadow-blue-500/20 shadow-md",
  epic: "shadow-purple-500/30 shadow-lg",
  legendary: "shadow-yellow-500/40 shadow-xl",
};

const rarityBadgeVariants = {
  common: "default" as const,
  rare: "primary" as const,
  epic: "secondary" as const,
  legendary: "warning" as const,
};

export function BadgeCard({
  badge,
  isEarned = false,
  earnedAt,
  onClick,
  size = "md",
}: BadgeCardProps) {
  const sizes = {
    sm: "w-20 p-2",
    md: "w-28 p-3",
    lg: "w-36 p-4",
  };

  const iconSizes = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-xl border-2 transition-all",
        sizes[size],
        isEarned ? rarityColors[badge.rarity] : "border-border",
        isEarned && rarityGlows[badge.rarity],
        !isEarned && "opacity-50 grayscale",
        onClick && "cursor-pointer hover:scale-105"
      )}
    >
      {/* Badge icon */}
      <div
        className={cn(
          "relative rounded-full bg-surface-light flex items-center justify-center",
          iconSizes[size]
        )}
      >
        {badge.icon_url ? (
          <img
            src={badge.icon_url}
            alt={badge.name}
            className={cn("rounded-full object-cover", iconSizes[size])}
          />
        ) : (
          <Medal
            className={cn(
              "text-warning",
              size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-12 h-12"
            )}
          />
        )}

        {/* Lock overlay for unearned */}
        {!isEarned && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
            <Lock className="w-5 h-5 text-text-muted" />
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-xs font-medium text-text text-center line-clamp-2">
        {badge.name}
      </span>

      {/* Rarity badge */}
      <Badge
        variant={rarityBadgeVariants[badge.rarity]}
        size="sm"
        className="capitalize"
      >
        {badge.rarity}
      </Badge>
    </div>
  );
}
