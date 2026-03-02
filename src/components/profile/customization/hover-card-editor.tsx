"use client";

import { motion } from "framer-motion";
import {
  RotateCcw,
  Gamepad2,
  TrendingUp,
  Users,
  Heart,
  Target,
  Trophy,
  Check,
} from "lucide-react";

interface HoverCardConfig {
  style: string;
  tagline: string;
  showStats: string[];
}

interface HoverCardEditorProps {
  value: HoverCardConfig | null;
  onChange: (config: HoverCardConfig | null) => void;
}

const CARD_STYLES = [
  { value: "default", label: "Default" },
  { value: "holographic", label: "Holographic" },
  { value: "pixel", label: "Pixel" },
  { value: "gold", label: "Gold" },
] as const;

const STAT_OPTIONS = [
  { value: "games", label: "Games", icon: Gamepad2 },
  { value: "level", label: "Level", icon: TrendingUp },
  { value: "friends", label: "Friends", icon: Users },
  { value: "followers", label: "Followers", icon: Heart },
  { value: "kd_ratio", label: "K/D Ratio", icon: Target },
  { value: "win_rate", label: "Win Rate", icon: Trophy },
] as const;

const MAX_STATS = 3;

const DEFAULT_CONFIG: HoverCardConfig = {
  style: "default",
  tagline: "",
  showStats: [],
};

const PLACEHOLDER_STATS: Record<string, string> = {
  games: "24",
  level: "42",
  friends: "156",
  followers: "1.2k",
  kd_ratio: "2.4",
  win_rate: "68%",
};

function PreviewCard({ config }: { config: HoverCardConfig }) {
  const styleClasses: Record<string, string> = {
    default: "border-border bg-surface",
    holographic:
      "border-transparent bg-surface [background-image:linear-gradient(135deg,rgba(255,0,128,0.1),rgba(0,200,255,0.1),rgba(128,0,255,0.1))]",
    pixel: "border-dashed border-2 border-text-muted bg-surface",
    gold: "border-yellow-500/60 bg-surface",
  };

  const outerGlow: Record<string, string> = {
    default: "",
    holographic: "shadow-lg shadow-purple-500/10",
    pixel: "",
    gold: "shadow-lg shadow-yellow-500/15",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 max-w-[220px] ${styleClasses[config.style]} ${outerGlow[config.style]}`}
    >
      {config.style === "holographic" && (
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "linear-gradient(135deg, #ff008080, #00c8ff80, #8000ff80, #ff008080)",
            backgroundSize: "300% 300%",
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      )}

      {config.style === "gold" && (
        <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-yellow-400 via-transparent to-yellow-600" />
      )}

      <div className="relative z-10">
        {/* Mock avatar + name */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs text-primary font-bold">
            GH
          </div>
          <div className="min-w-0">
            <div
              className={`text-sm font-semibold text-text truncate ${config.style === "pixel" ? "font-mono" : ""}`}
            >
              GamerHub
            </div>
            <div className="text-[10px] text-text-dim">@gamerhub</div>
          </div>
        </div>

        {/* Tagline */}
        {config.tagline && (
          <p
            className={`text-xs text-text-muted mb-2 italic truncate ${config.style === "pixel" ? "font-mono" : ""}`}
          >
            &quot;{config.tagline}&quot;
          </p>
        )}

        {/* Stats */}
        {config.showStats.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {config.showStats.map((stat) => {
              const opt = STAT_OPTIONS.find((s) => s.value === stat);
              if (!opt) return null;
              return (
                <div key={stat} className="flex items-center gap-1">
                  <span className="text-xs font-bold text-text">
                    {PLACEHOLDER_STATS[stat] ?? "0"}
                  </span>
                  <span className="text-[10px] text-text-dim">
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {config.showStats.length === 0 && !config.tagline && (
          <p className="text-[10px] text-text-dim italic">
            Add a tagline or stats to preview
          </p>
        )}
      </div>
    </div>
  );
}

export function HoverCardEditor({ value, onChange }: HoverCardEditorProps) {
  const current = value ?? DEFAULT_CONFIG;

  const handleChange = (patch: Partial<HoverCardConfig>) => {
    onChange({ ...current, ...patch });
  };

  const toggleStat = (stat: string) => {
    const stats = [...current.showStats];
    const idx = stats.indexOf(stat);
    if (idx >= 0) {
      stats.splice(idx, 1);
    } else if (stats.length < MAX_STATS) {
      stats.push(stat);
    }
    handleChange({ showStats: stats });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Card style */}
      <div>
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">
          Card Style
        </label>
        <div className="flex flex-wrap gap-2">
          {CARD_STYLES.map((style) => {
            const selected = current.style === style.value;
            return (
              <button
                key={style.value}
                type="button"
                onClick={() => handleChange({ style: style.value })}
                className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                  selected
                    ? "border-primary bg-primary/10 text-text"
                    : "border-border hover:border-primary/50 text-text-muted"
                }`}
              >
                {style.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tagline */}
      <div>
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
          Tagline
        </label>
        <div className="relative">
          <input
            type="text"
            value={current.tagline}
            onChange={(e) =>
              handleChange({ tagline: e.target.value.slice(0, 60) })
            }
            placeholder="Your gaming motto..."
            className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none transition-colors"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-dim">
            {current.tagline.length}/60
          </span>
        </div>
      </div>

      {/* Stats checkboxes */}
      <div>
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
          Stats to Show{" "}
          <span className="text-text-dim">
            ({current.showStats.length}/{MAX_STATS})
          </span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STAT_OPTIONS.map((stat) => {
            const Icon = stat.icon;
            const checked = current.showStats.includes(stat.value);
            const disabled = !checked && current.showStats.length >= MAX_STATS;
            return (
              <button
                key={stat.value}
                type="button"
                onClick={() => toggleStat(stat.value)}
                disabled={disabled}
                className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                  checked
                    ? "border-primary bg-primary/10 text-text"
                    : disabled
                      ? "border-border/50 text-text-dim cursor-not-allowed opacity-50"
                      : "border-border hover:border-primary/50 text-text-muted"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    checked
                      ? "bg-primary border-primary"
                      : "border-text-dim"
                  }`}
                >
                  {checked && <Check className="w-3 h-3 text-white" />}
                </div>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{stat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview + Reset */}
      <div className="flex items-start justify-between gap-4 pt-1">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">
            Preview
          </label>
          <PreviewCard config={current} />
        </div>

        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text rounded-lg border border-border hover:border-primary/50 transition-colors shrink-0 mt-6"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </motion.div>
  );
}
