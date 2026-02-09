"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";

interface Title {
  id: string;
  name: string;
  description: string | null;
  rarity: "common" | "rare" | "epic" | "legendary";
  color: string | null;
  is_unlocked?: boolean;
}

interface TitleSelectorProps {
  titles: Title[];
  selectedTitleId: string | null;
  onSelect: (titleId: string | null) => void;
  className?: string;
}

const rarityVariants = {
  common: "default" as const,
  rare: "primary" as const,
  epic: "secondary" as const,
  legendary: "warning" as const,
};

export function TitleSelector({
  titles,
  selectedTitleId,
  onSelect,
  className,
}: TitleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedTitle = titles.find((t) => t.id === selectedTitleId);
  const unlockedTitles = titles.filter((t) => t.is_unlocked !== false);

  return (
    <div className={cn("relative", className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-surface border border-border rounded-lg hover:border-primary/50 transition-colors"
      >
        <span
          className="font-medium"
          style={{ color: selectedTitle?.color || undefined }}
        >
          {selectedTitle?.name || "No title"}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-text-muted transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            {/* No title option */}
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-light transition-colors"
            >
              <span className="text-text-muted">No title</span>
              {!selectedTitleId && (
                <Check className="w-4 h-4 text-success" />
              )}
            </button>

            {unlockedTitles.map((title) => (
              <button
                key={title.id}
                onClick={() => {
                  onSelect(title.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-light transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="font-medium"
                    style={{ color: title.color || undefined }}
                  >
                    {title.name}
                  </span>
                  <Badge variant={rarityVariants[title.rarity]} size="sm">
                    {title.rarity}
                  </Badge>
                </div>
                {selectedTitleId === title.id && (
                  <Check className="w-4 h-4 text-success" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
