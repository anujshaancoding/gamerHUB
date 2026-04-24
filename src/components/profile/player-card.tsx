"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Check, Trophy, Zap, Gamepad2, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui";
import { useGameTheme } from "@/components/profile/game-theme-provider";
import { AnimatedRankEmblem } from "@/components/profile/animated-rank-emblem";
import { GGCardModal } from "@/components/profile/gg-card-modal";
import { normalizeImageUrl } from "@/lib/storage";
import type { Profile } from "@/types/database";
import type { GGCardData } from "@/lib/gg-card";

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
  /** Additional data needed for GG Card generation */
  ggCardData?: Omit<GGCardData, "username" | "displayName" | "avatarUrl" | "bannerUrl" | "themeColors"> | null;
}

export function PlayerCard({ profile, primaryGame, powerLevel = 0, level = 1, ggCardData }: PlayerCardProps) {
  const { theme } = useGameTheme();
  const [copied, setCopied] = useState(false);
  const [showGGCard, setShowGGCard] = useState(false);
  const bannerUrl = normalizeImageUrl(profile.banner_url);
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

  // Build full GG Card data from profile + theme + extra data
  const fullGGCardData: GGCardData = {
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: normalizeImageUrl(profile.avatar_url),
    bannerUrl: bannerUrl,
    region: profile.region,
    level: ggCardData?.level ?? level,
    currentXp: ggCardData?.currentXp ?? 0,
    xpToNext: ggCardData?.xpToNext ?? 1000,
    totalXp: ggCardData?.totalXp ?? 0,
    prestigeLevel: ggCardData?.prestigeLevel ?? 0,
    matchesPlayed: ggCardData?.matchesPlayed ?? 0,
    matchesWon: ggCardData?.matchesWon ?? 0,
    currentStreak: ggCardData?.currentStreak ?? 0,
    bestStreak: ggCardData?.bestStreak ?? 0,
    gamesLinked: ggCardData?.gamesLinked ?? 0,
    badgeCount: ggCardData?.badgeCount ?? 0,
    isPremium: ggCardData?.isPremium ?? (profile.is_premium ?? false),
    clanName: ggCardData?.clanName ?? null,
    clanTag: ggCardData?.clanTag ?? null,
    primaryGame: primaryGame
      ? {
          name: primaryGame.name,
          rank: primaryGame.rank,
          role: primaryGame.role,
          iconUrl: primaryGame.icon_url,
        }
      : null,
    themeColors: {
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      accent: theme.colors.accent,
      background: theme.colors.background,
      glow: theme.colors.glow,
    },
  };

  return (
    <>
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
              role="presentation"
              className="w-24 h-24 select-none"
              style={{ filter: "brightness(0) invert(1)" }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        )}

        {/* Banner strip */}
        <div className="h-20 relative">
          {bannerUrl && !bannerError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerUrl}
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
              <h3 className="text-xl font-black text-text truncate">
                {profile.display_name || profile.username}
              </h3>
              <p className="text-sm text-text/60">@{profile.username}</p>
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-text/10 border border-text/20">
              <Trophy className="h-3.5 w-3.5 text-text/70" />
              <span className="text-sm font-bold text-text/90">Lv. {level}</span>
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
              className="ml-auto p-2 rounded-lg bg-text/10 hover:bg-text/20 transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Share2 className="h-4 w-4 text-text/70" />
              )}
            </button>
          </div>

          {/* Primary game badge */}
          {primaryGame && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-text/10">
              {primaryGame.icon_url && !gameIconError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryGame.icon_url}
                  alt={primaryGame.name}
                  className="w-5 h-5 rounded"
                  onError={() => setGameIconError(true)}
                />
              ) : (
                <Gamepad2 className="w-5 h-5 text-text/50" />
              )}
              <span className="text-sm text-text/60">{primaryGame.name}</span>
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

          {/* Share My Card Button */}
          <button
            onClick={() => setShowGGCard(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.accent}20)`,
              border: `1px solid ${theme.colors.primary}40`,
              color: theme.colors.primary,
            }}
          >
            <Sparkles className="h-4 w-4" />
            Share My GG Card
          </button>
        </div>
      </motion.div>

      {/* GG Card Modal */}
      <GGCardModal
        isOpen={showGGCard}
        onClose={() => setShowGGCard(false)}
        cardData={fullGGCardData}
      />
    </>
  );
}
