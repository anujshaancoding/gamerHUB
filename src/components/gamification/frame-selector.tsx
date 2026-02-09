"use client";

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";

interface Frame {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  is_unlocked?: boolean;
}

interface FrameSelectorProps {
  frames: Frame[];
  selectedFrameId: string | null;
  onSelect: (frameId: string | null) => void;
  className?: string;
}

const rarityBorders = {
  common: "border-text-muted/50",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-yellow-500",
};

const rarityVariants = {
  common: "default" as const,
  rare: "primary" as const,
  epic: "secondary" as const,
  legendary: "warning" as const,
};

export function FrameSelector({
  frames,
  selectedFrameId,
  onSelect,
  className,
}: FrameSelectorProps) {
  return (
    <div className={cn("grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4", className)}>
      {/* No frame option */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
          !selectedFrameId
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50"
        )}
      >
        <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center">
          <span className="text-text-muted text-xs">None</span>
        </div>
        <span className="text-xs text-text-muted">No frame</span>
        {!selectedFrameId && (
          <div className="absolute top-2 right-2">
            <Check className="w-4 h-4 text-primary" />
          </div>
        )}
      </button>

      {frames.map((frame) => {
        const isSelected = selectedFrameId === frame.id;
        const isUnlocked = frame.is_unlocked !== false;

        return (
          <button
            key={frame.id}
            onClick={() => isUnlocked && onSelect(frame.id)}
            disabled={!isUnlocked}
            className={cn(
              "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
              isSelected
                ? "border-primary bg-primary/10"
                : isUnlocked
                  ? cn(rarityBorders[frame.rarity], "hover:border-primary/50")
                  : "border-border opacity-50 cursor-not-allowed"
            )}
          >
            <div className="relative w-16 h-16">
              <img
                src={frame.image_url}
                alt={frame.name}
                className={cn(
                  "w-full h-full rounded-full object-cover",
                  !isUnlocked && "grayscale"
                )}
              />
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
                  <Lock className="w-5 h-5 text-text-muted" />
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-text text-center line-clamp-1">
              {frame.name}
            </span>
            <Badge variant={rarityVariants[frame.rarity]} size="sm">
              {frame.rarity}
            </Badge>
            {isSelected && (
              <div className="absolute top-2 right-2">
                <Check className="w-4 h-4 text-primary" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
