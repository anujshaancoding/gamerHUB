"use client";

import { CheckCircle2 } from "lucide-react";
import type { ChallengeProgressEntry } from "@/types/database";

interface ChallengeProgressBarProps {
  progress: ChallengeProgressEntry[];
  compact?: boolean;
}

export function ChallengeProgressBar({
  progress,
  compact = false,
}: ChallengeProgressBarProps) {
  if (progress.length === 0) return null;

  // Calculate overall progress
  const totalCurrent = progress.reduce((sum, p) => sum + p.current, 0);
  const totalTarget = progress.reduce((sum, p) => sum + p.target, 0);
  const overallPercent = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
  const allCompleted = progress.every((p) => p.completed);

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-text-muted">
          <span>
            {totalCurrent}/{totalTarget}
          </span>
          <span>{Math.round(overallPercent)}%</span>
        </div>
        <div className="h-2 bg-surface-light rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              allCompleted ? "bg-success" : "bg-primary"
            }`}
            style={{ width: `${Math.min(overallPercent, 100)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {progress.map((entry, index) => {
        const percent = entry.target > 0 ? (entry.current / entry.target) * 100 : 0;

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">
                Objective {index + 1}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-text">
                  {entry.current}/{entry.target}
                </span>
                {entry.completed && (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                )}
              </div>
            </div>
            <div className="h-2 bg-surface-light rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  entry.completed ? "bg-success" : "bg-primary"
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* Overall Progress */}
      {progress.length > 1 && (
        <div className="pt-2 border-t border-border">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="font-medium text-text">Overall</span>
            <span className="text-text">{Math.round(overallPercent)}%</span>
          </div>
          <div className="h-3 bg-surface-light rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                allCompleted ? "bg-success" : "bg-primary"
              }`}
              style={{ width: `${Math.min(overallPercent, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
