"use client";

import { Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Badge {
  id: string;
  name: string;
  icon_url: string | null;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface BadgeShowcaseProps {
  badges: Badge[];
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const rarityBorders = {
  common: "border-text-muted/30",
  rare: "border-blue-500/50",
  epic: "border-purple-500/50",
  legendary: "border-yellow-500/50",
};

export function BadgeShowcase({
  badges,
  maxDisplay = 5,
  size = "sm",
  className,
}: BadgeShowcaseProps) {
  const displayBadges = badges.slice(0, maxDisplay);
  const remaining = badges.length - maxDisplay;

  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  if (displayBadges.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {displayBadges.map((badge, index) => (
        <div
          key={badge.id}
          className={cn(
            "rounded-full border-2 bg-surface flex items-center justify-center",
            sizes[size],
            rarityBorders[badge.rarity]
          )}
          style={{ zIndex: displayBadges.length - index }}
          title={badge.name}
        >
          {badge.icon_url ? (
            <img
              src={badge.icon_url}
              alt={badge.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <Medal
              className={cn(
                "text-warning",
                size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6"
              )}
            />
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full border-2 border-border bg-surface-light flex items-center justify-center text-xs font-medium text-text-muted",
            sizes[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
