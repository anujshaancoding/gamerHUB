"use client";

import { CheckCircle, Clock, Gift, Loader2 } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface QuestCardProps {
  quest: {
    id: string;
    status: "active" | "completed" | "expired" | "claimed";
    progress: { current: number; target: number };
    expires_at: string;
    quest: {
      name: string;
      description: string | null;
      icon_url: string | null;
      xp_reward: number;
    };
  };
  onClaim?: (questId: string) => Promise<void>;
  compact?: boolean;
}

export function QuestCard({ quest, onClaim, compact = false }: QuestCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isCompleted = quest.status === "completed";
  const isClaimed = quest.status === "claimed";
  const progress =
    (quest.progress.current / quest.progress.target) * 100;

  const handleClaim = async () => {
    if (!onClaim) return;
    setIsLoading(true);
    try {
      await onClaim(quest.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative bg-surface border border-border rounded-xl overflow-hidden transition-all",
        isCompleted && !isClaimed && "border-success/50 bg-success/5",
        isClaimed && "opacity-60",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "rounded-lg bg-surface-light flex items-center justify-center flex-shrink-0",
            compact ? "w-8 h-8" : "w-10 h-10"
          )}
        >
          {quest.quest.icon_url ? (
            <img
              src={quest.quest.icon_url}
              alt=""
              className={compact ? "w-5 h-5" : "w-6 h-6"}
            />
          ) : (
            <Gift
              className={cn("text-primary", compact ? "w-4 h-4" : "w-5 h-5")}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                "font-medium text-text truncate",
                compact ? "text-sm" : "text-base"
              )}
            >
              {quest.quest.name}
            </h4>
            {isClaimed && (
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
            )}
          </div>

          {!compact && quest.quest.description && (
            <p className="text-sm text-text-muted mt-0.5 line-clamp-1">
              {quest.quest.description}
            </p>
          )}

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>
                {quest.progress.current} / {quest.progress.target}
              </span>
              <Badge variant="warning" size="sm">
                +{quest.quest.xp_reward} XP
              </Badge>
            </div>
            <div className="h-1.5 bg-surface-light rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isCompleted || isClaimed ? "bg-success" : "bg-primary"
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Claim button */}
        {isCompleted && !isClaimed && onClaim && (
          <Button
            size="sm"
            onClick={handleClaim}
            disabled={isLoading}
            className="flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Claim"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
