"use client";

import { motion } from "framer-motion";
import { RotateCcw, Palette, Check } from "lucide-react";
import { COLOR_PALETTES } from "@/lib/constants/profile-skins";

const DEFAULT_THEME = {
  primary: "#9f7aea",
  secondary: "#12121a",
  accent: "#06b6d4",
};

interface ColorTheme {
  primary: string;
  secondary: string;
  accent: string;
}

interface ColorThemeEditorProps {
  value: ColorTheme | null;
  onChange: (theme: ColorTheme | null) => void;
}

export function ColorThemeEditor({ value, onChange }: ColorThemeEditorProps) {
  const current = value ?? DEFAULT_THEME;

  const handleColorChange = (key: keyof ColorTheme, color: string) => {
    onChange({ ...current, [key]: color });
  };

  const isMatchingPalette = (palette: (typeof COLOR_PALETTES)[number]) =>
    current.primary === palette.primary &&
    current.secondary === palette.secondary &&
    current.accent === palette.accent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Color pickers */}
      <div className="flex items-center gap-4 flex-wrap">
        {(["primary", "secondary", "accent"] as const).map((key) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="color"
              value={current[key]}
              onChange={(e) => handleColorChange(key, e.target.value)}
              className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent"
            />
            <span className="text-sm text-text-muted capitalize">{key}</span>
          </label>
        ))}

        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text rounded-lg border border-border hover:border-primary/50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Default
        </button>
      </div>

      {/* Live preview gradient */}
      <div
        className="h-3 rounded-full overflow-hidden"
        style={{
          background: `linear-gradient(to right, ${current.primary}, ${current.secondary}, ${current.accent})`,
        }}
      />

      {/* Palette presets */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Palette className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Presets
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {COLOR_PALETTES.map((palette) => {
            const selected = isMatchingPalette(palette);
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() =>
                  onChange({
                    primary: palette.primary,
                    secondary: palette.secondary,
                    accent: palette.accent,
                  })
                }
                className={`relative flex flex-col gap-1.5 p-2 rounded-lg border-2 transition-all ${
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {/* Palette preview dots */}
                <div className="flex items-center justify-center gap-1">
                  <div
                    className="w-4 h-4 rounded-full border border-white/10"
                    style={{ backgroundColor: palette.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/10"
                    style={{ backgroundColor: palette.secondary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/10"
                    style={{ backgroundColor: palette.accent }}
                  />
                </div>
                <span className="text-[10px] text-text-muted text-center truncate w-full">
                  {palette.name}
                </span>

                {selected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
