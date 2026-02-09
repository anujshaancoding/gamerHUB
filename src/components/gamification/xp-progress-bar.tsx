"use client";

import { cn } from "@/lib/utils";

interface XPProgressBarProps {
  currentXP: number;
  xpToNextLevel: number;
  level: number;
  className?: string;
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
}

export function XPProgressBar({
  currentXP,
  xpToNextLevel,
  level,
  className,
  showLabels = true,
  size = "md",
}: XPProgressBarProps) {
  const progress = Math.min((currentXP / xpToNextLevel) * 100, 100);

  const heights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabels && (
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary font-medium">Level {level}</span>
          <span className="text-text-muted">
            {currentXP.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
          </span>
        </div>
      )}
      <div
        className={cn(
          "bg-surface-light rounded-full overflow-hidden border border-border",
          heights[size]
        )}
      >
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {showLabels && (
        <p className="text-xs text-text-muted text-right">
          {(xpToNextLevel - currentXP).toLocaleString()} XP to level {level + 1}
        </p>
      )}
    </div>
  );
}
