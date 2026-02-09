"use client";

import { QuestCard } from "./quest-card";
import { QuestTimer } from "./quest-timer";
import { cn } from "@/lib/utils";

interface Quest {
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
}

interface QuestListProps {
  title: string;
  quests: Quest[];
  resetTime?: string;
  onClaim?: (questId: string) => Promise<void>;
  compact?: boolean;
  className?: string;
}

export function QuestList({
  title,
  quests,
  resetTime,
  onClaim,
  compact = false,
  className,
}: QuestListProps) {
  const completedCount = quests.filter(
    (q) => q.status === "completed" || q.status === "claimed"
  ).length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-text">{title}</h3>
          <span className="text-sm text-text-muted">
            ({completedCount}/{quests.length})
          </span>
        </div>
        {resetTime && <QuestTimer resetTime={resetTime} />}
      </div>

      {/* Quest cards */}
      <div className="space-y-2">
        {quests.length > 0 ? (
          quests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onClaim={onClaim}
              compact={compact}
            />
          ))
        ) : (
          <p className="text-sm text-text-muted text-center py-4">
            No quests available
          </p>
        )}
      </div>
    </div>
  );
}
