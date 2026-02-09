"use client";

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";

interface Theme {
  id: string;
  name: string;
  description: string | null;
  primary_color: string;
  secondary_color: string | null;
  accent_color: string | null;
  background_gradient: { from: string; to: string } | null;
  rarity: "common" | "rare" | "epic" | "legendary";
  is_unlocked?: boolean;
}

interface ThemeSelectorProps {
  themes: Theme[];
  selectedThemeId: string | null;
  onSelect: (themeId: string | null) => void;
  className?: string;
}

const rarityVariants = {
  common: "default" as const,
  rare: "primary" as const,
  epic: "secondary" as const,
  legendary: "warning" as const,
};

export function ThemeSelector({
  themes,
  selectedThemeId,
  onSelect,
  className,
}: ThemeSelectorProps) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-4", className)}>
      {themes.map((theme) => {
        const isSelected = selectedThemeId === theme.id;
        const isUnlocked = theme.is_unlocked !== false;

        const gradient = theme.background_gradient
          ? `linear-gradient(135deg, ${theme.background_gradient.from}, ${theme.background_gradient.to})`
          : `linear-gradient(135deg, ${theme.primary_color}, ${theme.secondary_color || theme.primary_color})`;

        return (
          <button
            key={theme.id}
            onClick={() => isUnlocked && onSelect(theme.id)}
            disabled={!isUnlocked}
            className={cn(
              "relative flex flex-col gap-2 p-4 rounded-xl border-2 transition-all",
              isSelected
                ? "border-primary"
                : isUnlocked
                  ? "border-border hover:border-primary/50"
                  : "border-border opacity-50 cursor-not-allowed"
            )}
          >
            {/* Color preview */}
            <div
              className={cn(
                "h-16 rounded-lg",
                !isUnlocked && "grayscale"
              )}
              style={{ background: gradient }}
            />

            {/* Theme info */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text">{theme.name}</span>
              <Badge variant={rarityVariants[theme.rarity]} size="sm">
                {theme.rarity}
              </Badge>
            </div>

            {/* Color dots */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: theme.primary_color }}
                title="Primary"
              />
              {theme.secondary_color && (
                <div
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: theme.secondary_color }}
                  title="Secondary"
                />
              )}
              {theme.accent_color && (
                <div
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: theme.accent_color }}
                  title="Accent"
                />
              )}
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Locked indicator */}
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl">
                <Lock className="w-6 h-6 text-text-muted" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
