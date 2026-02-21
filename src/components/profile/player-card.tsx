"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Check, Trophy, Zap, Gamepad2 } from "lucide-react";
import { Avatar } from "@/components/ui";
import { useGameTheme } from "@/components/profile/game-theme-provider";
import { AnimatedRankEmblem } from "@/components/profile/animated-rank-emblem";
import type { Profile } from "@/types/database";

interface PlayerCardProps {
  profile: Profile;
  primaryGame?: {
    name: string;
    slug: string;
    rank?: string;
    role?: string;
    icon_url?: string;
  } | null;
  powerLevel?: number;
  level?: number;
}

export function PlayerCard({ profile, primaryGame, powerLevel = 0, level = 1 }: PlayerCardProps) {
  const { theme } = useGameTheme();
  const [copied, setCopied] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [gameIconError, setGameIconError] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${profile.username}`;
    if (navigator.share) {
      await navigator.share({
        title: `${profile.display_name || profile.username} on GamerHub`,
        url,
      });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border"
      style={{
        background: theme.gradient.background,
        boxShadow: `0 0 30px ${theme.colors.glow}`,
      }}
    >
      {/* Card background pattern */}
      <div className="absolute inset-0 opacity-10" style={{ background: theme.gradient.card }} />

      {/* Watermark */}
      {theme.watermark.iconPath && (
        <div className="absolute bottom-2 right-2 pointer-events-none" style={{ opacity: theme.watermark.opacity * 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme.watermark.iconPath}
            alt=""
            className="w-24 h-24 select-none"
            style={{ filter: "brightness(0) invert(1)" }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Banner strip */}
      <div className="h-20 relative">
        {profile.banner_url && !bannerError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.banner_url}
            alt="Profile banner"
            className="w-full h-full object-cover"
            onError={() => setBannerError(true)}
          />
        ) : (
          <div className="w-full h-full" style={{ background: theme.gradient.accent }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Card content */}
      <div className="relative -mt-10 px-5 pb-5">
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <Avatar
            src={profile.avatar_url}
            alt={profile.display_name || profile.username}
            size="xl"
            className="ring-3 ring-black shadow-lg"
          />

          {/* Name + rank */}
          <div className="flex-1 min-w-0 pb-1">
            <h3 className="text-xl font-black text-white truncate">
              {profile.display_name || profile.username}
            </h3>
            <p className="text-sm text-white/60">@{profile.username}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-4">
          {/* Power Level */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: `${theme.colors.primary}25`,
              border: `1px solid ${theme.colors.primary}50`,
            }}
          >
            <Zap className="h-3.5 w-3.5" style={{ color: theme.colors.primary }} />
            <span className="text-sm font-bold" style={{ color: theme.colors.primary }}>
              {powerLevel}
            </span>
          </div>

          {/* Level */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
            <Trophy className="h-3.5 w-3.5 text-white/70" />
            <span className="text-sm font-bold text-white/90">Lv. {level}</span>
          </div>

          {/* Primary game rank */}
          {primaryGame?.rank && (
            <AnimatedRankEmblem
              rank={primaryGame.rank}
              gameSlug={primaryGame.slug}
              size="sm"
            />
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            className="ml-auto p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Share2 className="h-4 w-4 text-white/70" />
            )}
          </button>
        </div>

        {/* Primary game badge */}
        {primaryGame && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
            {primaryGame.icon_url && !gameIconError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryGame.icon_url}
                alt={primaryGame.name}
                className="w-5 h-5 rounded"
                onError={() => setGameIconError(true)}
              />
            ) : (
              <Gamepad2 className="w-5 h-5 text-white/50" />
            )}
            <span className="text-sm text-white/60">{primaryGame.name}</span>
            {primaryGame.role && (
              <span
                className="text-xs px-2 py-0.5 rounded-full ml-auto"
                style={{
                  backgroundColor: `${theme.colors.accent}20`,
                  color: theme.colors.accent,
                }}
              >
                {primaryGame.role}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
