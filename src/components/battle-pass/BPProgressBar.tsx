"use client";

import { useBattlePass } from "@/lib/hooks/useBattlePass";
import { cn } from "@/lib/utils";

interface BPProgressBarProps {
  className?: string;
  showLabels?: boolean;
}

export function BPProgressBar({ className, showLabels = true }: BPProgressBarProps) {
  const { currentLevel, currentXp, xpPerLevel, xpProgress, maxLevel } =
    useBattlePass();

  return (
    <div className={cn("space-y-2", className)}>
      {showLabels && (
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">
            Level <span className="text-white font-bold">{currentLevel}</span>
          </span>
          <span className="text-zinc-400">
            {currentXp.toLocaleString()} / {xpPerLevel.toLocaleString()} XP
          </span>
        </div>
      )}

      <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden">
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
          style={{ width: `${xpProgress}%` }}
        />

        {/* Glow effect */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500/50 to-yellow-500/50 blur-sm transition-all duration-500"
          style={{ width: `${xpProgress}%` }}
        />

        {/* Level markers */}
        {currentLevel < maxLevel && (
          <div className="absolute inset-0 flex items-center justify-end pr-2">
            <span className="text-xs text-white/80 font-medium">
              {xpProgress}%
            </span>
          </div>
        )}
      </div>

      {showLabels && currentLevel >= maxLevel && (
        <p className="text-center text-sm text-yellow-400 font-medium">
          MAX LEVEL REACHED!
        </p>
      )}
    </div>
  );
}
