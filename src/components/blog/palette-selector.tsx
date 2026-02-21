"use client";

import { motion } from "framer-motion";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { BLOG_COLOR_PALETTES, type BlogColorPalette } from "@/types/blog";

interface PaletteSelectorProps {
  selected: BlogColorPalette;
  onSelect: (palette: BlogColorPalette) => void;
}

export function PaletteSelector({ selected, onSelect }: PaletteSelectorProps) {
  const palettes = Object.entries(BLOG_COLOR_PALETTES) as [BlogColorPalette, typeof BLOG_COLOR_PALETTES[BlogColorPalette]][];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text">Choose Your Color Palette</h2>
        <p className="text-text-muted mt-2">
          Set the mood and aesthetic for your blog post
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {palettes.map(([id, palette], index) => {
          const isSelected = selected === id;

          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(id)}
              className={cn(
                "relative group text-left rounded-xl border-2 p-4 transition-all duration-300 overflow-hidden",
                isSelected
                  ? "border-white/30 shadow-lg"
                  : "border-border bg-surface hover:border-white/20"
              )}
              style={{
                backgroundColor: isSelected ? `${palette.backgroundHex}` : undefined,
              }}
            >
              {/* Background gradient overlay when selected */}
              {isSelected && (
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `linear-gradient(135deg, ${palette.primaryHex}20, ${palette.secondaryHex}20)`,
                  }}
                />
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center z-10"
                  style={{ backgroundColor: palette.primaryHex }}
                >
                  <Check className="w-3.5 h-3.5 text-black" />
                </motion.div>
              )}

              {/* Color swatches */}
              <div className="relative z-10 flex items-center gap-2 mb-4">
                <div
                  className="w-10 h-10 rounded-full border-2 border-white/20 shadow-lg"
                  style={{ backgroundColor: palette.primaryHex }}
                  title="Primary"
                />
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg -ml-2"
                  style={{ backgroundColor: palette.secondaryHex }}
                  title="Secondary"
                />
                <div
                  className="w-6 h-6 rounded-full border-2 border-white/20 shadow-lg -ml-2"
                  style={{ backgroundColor: palette.backgroundHex }}
                  title="Background"
                />
              </div>

              {/* Live preview strip */}
              <div
                className="relative z-10 rounded-lg p-3 mb-3"
                style={{ backgroundColor: `${palette.backgroundHex}` }}
              >
                <div
                  className="text-sm font-bold mb-1"
                  style={{ color: palette.primaryHex }}
                >
                  Sample Heading
                </div>
                <div
                  className="text-xs opacity-70"
                  style={{ color: palette.secondaryHex }}
                >
                  Body text preview with this palette
                </div>
                <div
                  className="mt-2 h-1 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${palette.primaryHex}, ${palette.secondaryHex})`,
                  }}
                />
              </div>

              {/* Palette info */}
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Palette
                    className="w-4 h-4"
                    style={{ color: isSelected ? palette.primaryHex : undefined }}
                  />
                  <h3 className={cn(
                    "font-semibold text-sm",
                    isSelected ? "text-white" : "text-text"
                  )}>
                    {palette.label}
                  </h3>
                </div>
                <p className={cn(
                  "text-xs",
                  isSelected ? "text-white/60" : "text-text-muted"
                )}>
                  {palette.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
