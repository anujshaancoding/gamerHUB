"use client";

import { motion } from "framer-motion";
import { Check, User, Gamepad2, Trophy } from "lucide-react";
import { PROFILE_SKINS } from "@/lib/constants/profile-skins";

interface SkinSelectorProps {
  value: string | null;
  onChange: (skinId: string | null) => void;
}

/** Mini profile preview showing the skin's color palette */
function SkinPreview({ colors }: { colors: [string, string, string] }) {
  const [primary, secondary, bg] = colors;

  return (
    <div
      className="w-full h-20 rounded-lg overflow-hidden border border-border relative"
      style={{ backgroundColor: bg }}
    >
      {/* Mini banner */}
      <div
        className="h-6 w-full"
        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
      />

      {/* Mini avatar placeholder */}
      <div className="absolute top-3 left-2.5">
        <div
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: primary, backgroundColor: bg }}
        >
          <User className="h-3 w-3" style={{ color: primary }} />
        </div>
      </div>

      {/* Mini content lines */}
      <div className="px-2.5 pt-3 space-y-1">
        <div className="flex items-center gap-1.5">
          <div
            className="h-1.5 w-12 rounded-full"
            style={{ backgroundColor: primary, opacity: 0.8 }}
          />
        </div>
        <div className="flex items-center gap-1">
          <div
            className="h-1 w-8 rounded-full"
            style={{ backgroundColor: primary, opacity: 0.3 }}
          />
        </div>
        <div className="flex items-center gap-1 mt-1">
          <div
            className="h-3 w-8 rounded-sm"
            style={{ backgroundColor: `${primary}30`, border: `1px solid ${primary}50` }}
          >
            <Gamepad2 className="h-2 w-2 mx-auto mt-0.5" style={{ color: primary }} />
          </div>
          <div
            className="h-3 w-8 rounded-sm"
            style={{ backgroundColor: `${secondary}30`, border: `1px solid ${secondary}50` }}
          >
            <Trophy className="h-2 w-2 mx-auto mt-0.5" style={{ color: secondary }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkinSelector({ value, onChange }: SkinSelectorProps) {
  const currentValue = value || "default";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PROFILE_SKINS.map((skin) => {
          const isSelected = currentValue === skin.id;

          return (
            <motion.button
              key={skin.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(skin.id === "default" ? null : skin.id)}
              className={`relative flex flex-col gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  : "border-border bg-surface-light hover:border-border/80 hover:bg-surface-lighter"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 z-10">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}

              {/* Mini profile preview */}
              <SkinPreview colors={skin.previewColors} />

              {/* Skin info */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{skin.icon}</span>
                  <span className="text-sm font-semibold text-text/90 truncate">
                    {skin.name}
                  </span>
                </div>
                <p className="text-xs text-text-muted line-clamp-2">
                  {skin.description}
                </p>
              </div>

              {/* Color swatches */}
              <div className="flex items-center gap-1.5">
                {skin.previewColors.map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
