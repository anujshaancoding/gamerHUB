"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui";
import { Gamepad2, TrendingUp, Users, Heart, Target, Trophy } from "lucide-react";

interface HoverCardConfig {
  style: string;
  tagline: string;
  showStats: string[];
}

interface HoverCardProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  hover_card_config: unknown;
  gaming_style: string | null;
}

interface ProfileHoverCardProps {
  profile: HoverCardProfile;
  children: React.ReactNode;
}

const STAT_META: Record<string, { label: string; icon: React.ElementType; placeholder: string }> = {
  games: { label: "Games", icon: Gamepad2, placeholder: "24" },
  level: { label: "Level", icon: TrendingUp, placeholder: "42" },
  friends: { label: "Friends", icon: Users, placeholder: "156" },
  followers: { label: "Followers", icon: Heart, placeholder: "1.2k" },
  kd_ratio: { label: "K/D", icon: Target, placeholder: "2.4" },
  win_rate: { label: "Win Rate", icon: Trophy, placeholder: "68%" },
};

function parseConfig(raw: unknown): HoverCardConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.style !== "string" || typeof obj.tagline !== "string") return null;
  if (!Array.isArray(obj.showStats)) return null;
  if (!["default", "holographic", "pixel", "gold"].includes(obj.style)) return null;
  return {
    style: obj.style,
    tagline: obj.tagline,
    showStats: obj.showStats.filter((s): s is string => typeof s === "string"),
  };
}

function CardContent({
  profile,
  config,
}: {
  profile: HoverCardProfile;
  config: HoverCardConfig;
}) {
  const isPixel = config.style === "pixel";

  return (
    <div className="relative z-10 p-4">
      {/* Avatar + Name */}
      <div className="flex items-center gap-3 mb-2">
        <Avatar
          src={profile.avatar_url}
          alt={profile.display_name || profile.username}
          fallback={(profile.display_name || profile.username).slice(0, 2).toUpperCase()}
          size="lg"
        />
        <div className="min-w-0">
          <div
            className={`text-sm font-bold text-text truncate ${isPixel ? "font-mono" : ""}`}
          >
            {profile.display_name || profile.username}
          </div>
          <div className="text-xs text-text-dim">@{profile.username}</div>
          {profile.gaming_style && (
            <div className="text-[10px] text-text-muted mt-0.5">
              {profile.gaming_style}
            </div>
          )}
        </div>
      </div>

      {/* Tagline */}
      {config.tagline && (
        <p
          className={`text-xs text-text-muted italic mb-2 ${isPixel ? "font-mono" : ""}`}
        >
          &quot;{config.tagline}&quot;
        </p>
      )}

      {/* Stats */}
      {config.showStats.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-border/50">
          {config.showStats.map((stat) => {
            const meta = STAT_META[stat];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <div key={stat} className="flex items-center gap-1 mt-1.5">
                <Icon className="w-3 h-3 text-text-dim" />
                <span className="text-xs font-bold text-text">
                  {meta.placeholder}
                </span>
                <span className="text-[10px] text-text-dim">{meta.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProfileHoverCard({ profile, children }: ProfileHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const config = parseConfig(profile.hover_card_config);

  const handleMouseEnter = useCallback(() => {
    if (!config) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(true), 300);
  }, [config]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  }, []);

  // If no config, just render children without hover behavior
  if (!config) {
    return <>{children}</>;
  }

  const styleClasses: Record<string, string> = {
    default: "border-border bg-surface",
    holographic:
      "border-transparent bg-surface ring-1 ring-purple-500/30",
    pixel: "border-dashed border-2 border-text-muted bg-surface",
    gold: "border-yellow-500/50 bg-surface",
  };

  const outerEffects: Record<string, string> = {
    default: "shadow-xl shadow-black/30",
    holographic: "shadow-xl shadow-purple-500/20",
    pixel: "shadow-lg shadow-black/20",
    gold: "shadow-xl shadow-yellow-500/20",
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-[260px] rounded-xl border overflow-hidden ${styleClasses[config.style]} ${outerEffects[config.style]}`}
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
            }}
            onMouseLeave={handleMouseLeave}
          >
            {/* Holographic shimmer overlay */}
            {config.style === "holographic" && (
              <motion.div
                className="absolute inset-0 opacity-15 pointer-events-none"
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

            {/* Gold gradient overlay */}
            {config.style === "gold" && (
              <div className="absolute inset-0 opacity-[0.06] bg-gradient-to-br from-yellow-400 via-transparent to-yellow-600 pointer-events-none" />
            )}

            <CardContent profile={profile} config={config} />

            {/* Bottom arrow indicator */}
            <div
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${
                config.style === "gold"
                  ? "bg-surface border-r border-b border-yellow-500/50"
                  : config.style === "pixel"
                    ? "bg-surface border-r border-b border-dashed border-text-muted"
                    : "bg-surface border-r border-b border-border"
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
