"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Star, Award } from "lucide-react";
import { Button } from "@/components/ui";
import { useGameTheme } from "@/components/profile/game-theme-provider";

interface BadgeOption {
  id: string;
  name: string;
  icon_url?: string | null;
  rarity: string;
}

interface PinnedBadgesEditorProps {
  isOpen: boolean;
  onClose: () => void;
  availableBadges: BadgeOption[];
  selectedBadgeIds: string[];
  onSave: (badgeIds: string[]) => Promise<void>;
  maxPinned?: number;
}

const rarityColors: Record<string, string> = {
  common: "#8B8B8B",
  uncommon: "#22C55E",
  rare: "#3B82F6",
  epic: "#A855F7",
  legendary: "#FFD700",
};

export function PinnedBadgesEditor({
  isOpen,
  onClose,
  availableBadges,
  selectedBadgeIds,
  onSave,
  maxPinned = 5,
}: PinnedBadgesEditorProps) {
  const [selected, setSelected] = useState<string[]>(selectedBadgeIds);
  const [saving, setSaving] = useState(false);
  const { theme } = useGameTheme();

  const toggleBadge = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((b) => b !== id);
      if (prev.length >= maxPinned) return prev;
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            className="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <Star className="h-5 w-5" style={{ color: theme.colors.primary }} />
                  Pin Badges
                </h3>
                <p className="text-sm text-text-muted mt-0.5">
                  Select up to {maxPinned} badges to showcase ({selected.length}/{maxPinned})
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-light transition-colors">
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>

            {/* Badge Grid */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {availableBadges.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-text-muted mx-auto mb-3 opacity-50" />
                  <p className="text-text-muted">No badges earned yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableBadges.map((badge) => {
                    const isSelected = selected.includes(badge.id);
                    const rarityColor = rarityColors[badge.rarity] ?? rarityColors.common;

                    return (
                      <motion.button
                        key={badge.id}
                        onClick={() => toggleBadge(badge.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`
                          relative p-3 rounded-xl border-2 text-left transition-all
                          ${isSelected
                            ? "bg-surface-light"
                            : "bg-surface border-border hover:border-text-muted/30"
                          }
                        `}
                        style={{
                          borderColor: isSelected ? rarityColor : undefined,
                          boxShadow: isSelected ? `0 0 12px ${rarityColor}40` : undefined,
                        }}
                      >
                        {/* Selected indicator */}
                        {isSelected && (
                          <div
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: rarityColor }}
                          >
                            <Check className="h-3 w-3 text-black" />
                          </div>
                        )}

                        {/* Badge icon */}
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                          style={{ backgroundColor: `${rarityColor}20` }}
                        >
                          {badge.icon_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={badge.icon_url}
                              alt={badge.name}
                              className="w-6 h-6"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <Award className="h-5 w-5" style={{ color: rarityColor }} />
                          )}
                        </div>

                        {/* Badge name */}
                        <p className="text-sm font-medium text-text truncate">{badge.name}</p>
                        <p className="text-xs capitalize mt-0.5" style={{ color: rarityColor }}>
                          {badge.rarity}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-border">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={saving}
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
