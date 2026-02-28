"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getRegionLabel, getLanguageLabel } from "@/lib/constants/games";
import {
  MapPin,
  Globe,
  Clock,
  Edit,
  MessageSquare,
  UserPlus,
  UserMinus,
  UserCheck,
  Users,
  Share2,
  ExternalLink,
  Zap,
  Trophy,
  Target,
  Flame,
  Camera,
  ImageIcon,
  Sparkles,
  Eye,
  Lock,
  Crown,
} from "lucide-react";
import { Button, Avatar, Badge } from "@/components/ui";
import { createClient } from "@/lib/db/client-browser";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRelationship, useSocialCounts } from "@/lib/hooks/useFriends";
import { LevelBadge, BadgeShowcase } from "@/components/gamification";
import { TrustBadges } from "@/components/ratings/trust-badges";
import { PremiumBadge } from "@/components/premium";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { usePresence } from "@/lib/presence/PresenceProvider";
import { SocialListModal } from "@/components/social-lists";
import { useGameTheme } from "@/components/profile/game-theme-provider";
import type { Profile, UserProgressionWithDetails, UserBadgeWithDetails, TrustBadges as TrustBadgesType } from "@/types/database";

interface RecentViewer {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  viewed_at: string;
}

interface ProfileHeaderProps {
  profile: Profile;
  followersCount: number;
  followingCount: number;
  friendsCount?: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  trustBadges?: TrustBadgesType | null;
  progression?: UserProgressionWithDetails | null;
  showcaseBadges?: UserBadgeWithDetails[];
  isPremium?: boolean;
  profileViewsCount?: number;
  recentViewers?: RecentViewer[];
}

// Deterministic pseudo-random based on seed (avoids hydration mismatch)
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// Particle component for background effect (uses game theme colors)
function Particle({ index, delay, colors }: { index: number; delay: number; colors: string[] }) {
  const left = `${Math.round(seededRandom(index) * 10000) / 100}%`;
  const color = colors[index % colors.length];
  return (
    <div
      className="particle"
      style={{
        left,
        animationDelay: `${delay}s`,
        background: color,
      }}
    />
  );
}

export function ProfileHeader({
  profile,
  followersCount,
  followingCount,
  friendsCount: initialFriendsCount,
  isFollowing: initialIsFollowing,
  isOwnProfile,
  trustBadges,
  progression,
  showcaseBadges,
  isPremium,
  profileViewsCount = 0,
  recentViewers = [],
}: ProfileHeaderProps) {
  const { user } = useAuth();
  const db = createClient();
  const { isPremium: isCurrentUserPremium } = useSubscription();
  const { getUserStatus } = usePresence();
  const { theme: gameTheme } = useGameTheme();

  // Use subscription hook for own profile (checks auth metadata), fall back to prop for other users
  const showPremiumBadge = isOwnProfile ? isCurrentUserPremium : isPremium;

  // Use realtime presence for online status instead of stale DB value
  const profileStatus = getUserStatus(profile.id);

  const [followers, setFollowers] = useState(followersCount);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"follow" | "friend" | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [socialListType, setSocialListType] = useState<"friends" | "followers" | "following" | null>(null);
  const [showViewers, setShowViewers] = useState(false);
  const viewersRef = useRef<HTMLDivElement>(null);

  // Close viewers dropdown on outside click
  useEffect(() => {
    if (!showViewers) return;
    function handleClick(e: MouseEvent) {
      if (viewersRef.current && !viewersRef.current.contains(e.target as Node)) {
        setShowViewers(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showViewers]);

  const { relationship, refetch: refetchRelationship } = useRelationship(
    !isOwnProfile && user ? profile.id : null
  );

  const { counts } = useSocialCounts(profile.id);

  const friendsCount = counts?.friends ?? initialFriendsCount ?? 0;

  // Profile customization — now driven by game theme
  const profileTheme = {
    frameStyle: (progression?.level ?? 0) >= 50 ? "mythic" : (progression?.level ?? 0) >= 25 ? "legendary" : (progression?.level ?? 0) >= 10 ? "epic" : "default",
    glowColor: gameTheme.colors.primary,
  };

  const handleFollow = async () => {
    if (!user) return;
    setActionLoading("follow");

    try {
      if (relationship?.is_following) {
        await db
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id);
        setFollowers((prev) => prev - 1);
      } else {
        await db.from("follows").insert({
          follower_id: user.id,
          following_id: profile.id,
        } as never);
        setFollowers((prev) => prev + 1);
      }
      refetchRelationship();
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddFriend = async () => {
    if (!user) return;
    setActionLoading("friend");

    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: profile.id }),
      });
      if (response.ok) {
        refetchRelationship();
      }
    } catch (error) {
      console.error("Add friend error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${profile.username}`;
    if (navigator.share) {
      await navigator.share({
        title: `${profile.display_name || profile.username} on GamerHub`,
        url,
      });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  const socialLinks = profile.social_links as {
    discord?: string;
    twitch?: string;
    youtube?: string;
    twitter?: string;
    steam?: string;
  } | null;

  // Calculate XP percentage for level progress
  const xpPercentage = progression
    ? ((progression.current_xp % 1000) / 1000) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Side Background Images (if user has them) */}
      {profile.banner_url && (
        <>
          <div
            className="profile-bg-left hidden xl:block"
            style={{
              backgroundImage: `url(${profile.banner_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div
            className="profile-bg-right hidden xl:block"
            style={{
              backgroundImage: `url(${profile.banner_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </>
      )}

      {/* Main Profile Card */}
      <div className="relative bg-surface rounded-2xl shadow-2xl gaming-card-border">
        {/* Particles Background — themed to active game */}
        <div className="particles-bg overflow-hidden rounded-2xl">
          {Array.from({ length: gameTheme.particles.count }).map((_, i) => (
            <Particle key={i} index={i} delay={i * 0.7} colors={gameTheme.particles.colors} />
          ))}
        </div>

        {/* Banner Section */}
        <div className="h-40 sm:h-56 md:h-72 xl:h-80 relative group overflow-hidden">
          {profile.banner_url ? (
            <img
              src={profile.banner_url}
              alt="Profile banner"
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/banners/gaming-1.svg'; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 holographic" />
          )}

          {/* Banner Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />

          {/* Animated border at bottom (moved to profile content section below) */}

          {/* Edit banner button for own profile */}
          {isOwnProfile && (
            <Link
              href={`/profile/${profile.username}/edit`}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
            >
              <Camera className="h-5 w-5 text-white" />
            </Link>
          )}

          {/* Gaming Style Badge - Floating */}
          {profile.gaming_style && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute top-4 left-4"
            >
              <div
                className={`
                  px-4 py-2 rounded-full backdrop-blur-md font-bold text-sm uppercase tracking-wider
                  ${profile.gaming_style === "pro" ? "bg-purple-500/30 text-purple-300 border border-purple-500/50" : ""}
                  ${profile.gaming_style === "competitive" ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50" : ""}
                  ${profile.gaming_style === "casual" ? "bg-green-500/30 text-green-300 border border-green-500/50" : ""}
                `}
              >
                <span className="flex items-center gap-2">
                  {profile.gaming_style === "pro" && <Flame className="h-4 w-4" />}
                  {profile.gaming_style === "competitive" && <Target className="h-4 w-4" />}
                  {profile.gaming_style === "casual" && <Sparkles className="h-4 w-4" />}
                  {profile.gaming_style}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Profile Content */}
        <div className="relative -mt-24 px-4 sm:px-6 pb-6 sm:pb-8 z-10">
          {/* Upper Section: Avatar + Name/Username + Stats */}
          <div className="relative z-20 flex flex-col md:flex-row gap-4 md:gap-6 md:items-end">
            {/* Avatar Section */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative flex-shrink-0"
            >
              {/* Glow effect behind avatar */}
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-50"
                style={{ backgroundColor: profileTheme.glowColor }}
              />

              <Avatar
                src={profile.avatar_url}
                alt={profile.display_name || profile.username}
                size="4xl"
                status={profileStatus}
                showStatus
                frameStyle={profileTheme.frameStyle as "none" | "default" | "epic" | "legendary" | "mythic" | "rgb"}
                glowColor={profileTheme.glowColor}
                className="ring-4 ring-surface shadow-2xl relative z-10"
              />

              {/* Level badge on avatar */}
              {progression && (
                <div className="absolute -bottom-2 -right-2 z-20">
                  <LevelBadge level={progression.level} size="lg" />
                </div>
              )}

              {/* Status indicator */}
              {profileStatus !== "offline" && (
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 backdrop-blur-sm text-xs font-bold rounded-full flex items-center gap-1.5 z-20 ${
                  profileStatus === "online" ? "bg-success/90 text-black" :
                  profileStatus === "away" ? "bg-yellow-500/90 text-black" :
                  "bg-red-500/90 text-white"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${profileStatus === "online" ? "bg-white animate-pulse" : "bg-white/80"}`} />
                  {profileStatus === "online" ? "ONLINE" : profileStatus === "away" ? "AWAY" : "DO NOT DISTURB"}
                </div>
              )}
            </motion.div>

            {/* Name & Info Section */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Display Name + Badges Row */}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-black text-text tracking-tight"
                    style={{
                      textShadow: profile.gaming_style === "pro" || profile.gaming_style === "competitive"
                        ? `0 0 30px ${gameTheme.colors.glow}`
                        : undefined
                    }}
                  >
                    {profile.display_name || profile.username}
                  </motion.h1>

                  {/* Premium Badge */}
                  {showPremiumBadge && <PremiumBadge size="md" />}

                  {/* Trust Badges */}
                  {trustBadges && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <TrustBadges badges={trustBadges} />
                    </motion.div>
                  )}
                </div>

                {/* @username always visible below display name */}
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-text-muted text-lg mt-1"
                >
                  @{profile.username}
                </motion.p>
              </div>

              {/* Active Title */}
              <div className="flex items-center gap-3 flex-wrap">
                {progression?.active_title && (
                  <span
                    className="text-sm font-bold px-3 py-1 rounded-full glitch-text"
                    data-text={progression.active_title.name}
                    style={{
                      color: progression.active_title.color || "#00ff88",
                      backgroundColor: `${progression.active_title.color || "#00ff88"}20`,
                      border: `1px solid ${progression.active_title.color || "#00ff88"}50`,
                    }}
                  >
                    {progression.active_title.name}
                  </span>
                )}
              </div>

              {/* XP Progress Bar */}
              {progression && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.6 }}
                  className="max-w-md"
                >
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Level {progression.level}</span>
                    <span>{progression.current_xp.toLocaleString()} XP</span>
                  </div>
                  <div className="xp-bar h-2">
                    <div
                      className="xp-bar-fill"
                      style={{ width: `${xpPercentage}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="relative flex flex-wrap gap-2 sm:gap-3 md:min-w-[240px] xl:min-w-[280px] md:justify-end"
            >
              {[
                { label: "FRIENDS", value: friendsCount, color: "primary", listType: "friends" as const },
                { label: "FOLLOWERS", value: followers, color: "accent", listType: "followers" as const },
                { label: "FOLLOWING", value: followingCount, color: "secondary", listType: "following" as const },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  onClick={() => setSocialListType(stat.listType)}
                >
                  <StatCard label={stat.label} value={stat.value} color={stat.color} />
                </motion.div>
              ))}

              {/* Profile Views Stat Card — only on own profile */}
              {isOwnProfile && (
                <div ref={viewersRef} className="relative">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    onClick={() => setShowViewers((prev) => !prev)}
                  >
                    <ViewsStatCard value={profileViewsCount} />
                  </motion.div>

              {/* Recent Viewers Dropdown */}
              <AnimatePresence>
                {showViewers && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-xl bg-surface border border-border shadow-2xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-warning" />
                        <span className="text-sm font-bold text-text">Recent Visitors</span>
                      </div>
                      <span className="text-xs text-text-muted bg-surface-light px-2 py-0.5 rounded-full">
                        {profileViewsCount} total
                      </span>
                    </div>

                    {showPremiumBadge ? (
                      // Premium: show recent viewer cards
                      <div className="divide-y divide-border">
                        {recentViewers.length > 0 ? (
                          recentViewers.map((viewer) => (
                            <Link
                              key={viewer.id}
                              href={`/profile/${viewer.username}`}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-light transition-colors group"
                            >
                              <Avatar
                                src={viewer.avatar_url}
                                alt={viewer.display_name || viewer.username}
                                size="sm"
                                className="ring-2 ring-border group-hover:ring-primary/50 transition-all"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text truncate group-hover:text-primary transition-colors">
                                  {viewer.display_name || viewer.username}
                                </p>
                                <p className="text-xs text-text-muted truncate">
                                  @{viewer.username}
                                </p>
                              </div>
                              <span className="text-[10px] text-text-muted whitespace-nowrap">
                                {formatViewTime(viewer.viewed_at)}
                              </span>
                            </Link>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <Eye className="h-8 w-8 text-text-muted/30 mx-auto mb-2" />
                            <p className="text-sm text-text-muted">No visitors yet</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Free tier: show count + upgrade prompt
                      <div className="px-4 py-6 text-center space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <Eye className="h-10 w-10 text-warning/40" />
                        </div>
                        <p className="text-3xl font-black text-text">{profileViewsCount}</p>
                        <p className="text-sm text-text-muted">people visited your profile</p>
                        <div className="flex items-center gap-1.5 justify-center text-xs text-text-muted">
                          <Lock className="h-3 w-3" />
                          <span>Visitor details are hidden</span>
                        </div>
                        <Link
                          href="/premium"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-warning/20 to-warning/10 border border-warning/30 text-warning text-sm font-semibold hover:from-warning/30 hover:to-warning/20 transition-all"
                        >
                          <Crown className="h-4 w-4" />
                          Upgrade to see visitors
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>

          {/* Animated gradient divider line — themed */}
          <div
            className="relative z-10 h-px opacity-40 my-5 rounded-full"
            style={{ background: gameTheme.gradient.accent }}
          />

          {/* Lower Section: Bio + Meta + Social + Actions */}
          <div className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-6 md:items-start">
            <div className="flex-1 min-w-0 space-y-3">
              {/* Bio */}
              {profile.bio && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-text-secondary max-w-2xl leading-relaxed text-base"
                >
                  {profile.bio}
                </motion.p>
              )}

              {/* Meta Info Tags */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2"
              >
                {profile.region && (
                  <span className="flex items-center gap-1.5 bg-surface-light/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-border hover:border-primary/50 transition-colors">
                    <MapPin className="h-4 w-4 text-primary" />
                    {getRegionLabel(profile.region)}
                  </span>
                )}
                {profile.preferred_language && (
                  <span className="flex items-center gap-1.5 bg-surface-light/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-border hover:border-accent/50 transition-colors">
                    <Globe className="h-4 w-4 text-accent" />
                    {getLanguageLabel(profile.preferred_language)}
                  </span>
                )}
                {profileStatus === "offline" && profile.last_seen && (
                  <span className="flex items-center gap-1.5 bg-surface-light/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm text-text-muted border border-border">
                    <Clock className="h-4 w-4" />
                    Last seen {new Date(profile.last_seen).toLocaleDateString()}
                  </span>
                )}
              </motion.div>

              {/* Social Links */}
              {socialLinks && (socialLinks.discord || socialLinks.twitch || socialLinks.youtube || socialLinks.twitter || socialLinks.steam) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap gap-2"
                >
                  {socialLinks.discord && (
                    <div className="flex items-center gap-2 bg-[#5865F2]/20 text-[#5865F2] px-3 py-2 rounded-lg text-sm font-medium border border-[#5865F2]/30 hover:bg-[#5865F2]/30 transition-colors">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                      </svg>
                      {socialLinks.discord}
                    </div>
                  )}
                  {socialLinks.twitch && (
                    <a
                      href={`https://twitch.tv/${socialLinks.twitch}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#9146FF]/20 text-[#9146FF] px-3 py-2 rounded-lg text-sm font-medium border border-[#9146FF]/30 hover:bg-[#9146FF]/30 transition-colors group"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                      </svg>
                      <span>{socialLinks.twitch}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a
                      href={socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#FF0000]/20 text-[#FF0000] px-3 py-2 rounded-lg text-sm font-medium border border-[#FF0000]/30 hover:bg-[#FF0000]/30 transition-colors group"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                        <path fill="#0a0a0f" d="M9.545 15.568V8.432L15.818 12z"/>
                      </svg>
                      <span>YouTube</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a
                      href={`https://twitter.com/${socialLinks.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#1DA1F2]/20 text-[#1DA1F2] px-3 py-2 rounded-lg text-sm font-medium border border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/30 transition-colors group"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span>@{socialLinks.twitter}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {socialLinks.steam && (
                    <a
                      href={socialLinks.steam}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#171A21]/80 text-[#66c0f4] px-3 py-2 rounded-lg text-sm font-medium border border-[#66c0f4]/30 hover:bg-[#171A21] transition-colors group"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/>
                      </svg>
                      <span>Steam</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                </motion.div>
              )}

              {/* Badge Showcase */}
              {showcaseBadges && showcaseBadges.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <BadgeShowcase
                    badges={showcaseBadges.map((ub) => ({
                      id: ub.badge.id,
                      name: ub.badge.name,
                      icon_url: ub.badge.icon_url,
                      rarity: ub.badge.rarity as "common" | "rare" | "epic" | "legendary",
                    }))}
                    maxDisplay={5}
                  />
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-2 flex-wrap md:justify-end md:min-w-[240px] xl:min-w-[280px] shrink-0"
            >
                {isOwnProfile ? (
                  <Link href={`/profile/${profile.username}/edit`}>
                    <Button
                      variant="primary"
                      leftIcon={<Edit className="h-4 w-4" />}
                      className="shadow-lg shadow-primary/25 hover:shadow-primary/50 transition-shadow"
                    >
                      Edit Profile
                    </Button>
                  </Link>
                ) : (
                  <>
                    {relationship?.is_friend ? (
                      <Badge variant="success" className="gap-2 px-4 py-2.5 text-sm">
                        <Users className="h-4 w-4" />
                        Friends
                      </Badge>
                    ) : relationship?.has_pending_request_sent ? (
                      <Badge variant="secondary" className="gap-2 px-4 py-2.5 text-sm">
                        <Clock className="h-4 w-4" />
                        Request Sent
                      </Badge>
                    ) : relationship?.has_pending_request_received ? (
                      <Button
                        variant="primary"
                        onClick={handleAddFriend}
                        isLoading={actionLoading === "friend"}
                        leftIcon={<UserCheck className="h-4 w-4" />}
                        className="shadow-lg shadow-primary/25"
                      >
                        Accept Friend
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={handleAddFriend}
                        isLoading={actionLoading === "friend"}
                        leftIcon={<UserPlus className="h-4 w-4" />}
                        className="shadow-lg shadow-primary/25 hover:shadow-primary/50 transition-shadow"
                      >
                        Add Friend
                      </Button>
                    )}
                    {!relationship?.is_friend && (
                      <Button
                        variant={relationship?.is_following ? "outline" : "secondary"}
                        onClick={handleFollow}
                        isLoading={actionLoading === "follow"}
                        leftIcon={
                          relationship?.is_following ? (
                            <UserMinus className="h-4 w-4" />
                          ) : (
                            <Zap className="h-4 w-4" />
                          )
                        }
                      >
                        {relationship?.is_following ? "Unfollow" : "Follow"}
                      </Button>
                    )}
                    <Link href={`/messages?user=${profile.id}`}>
                      <Button variant="outline" size="icon" title="Send Message" className="hover:border-accent hover:text-accent transition-colors">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  title="Share Profile"
                  className="hover:text-primary transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </motion.div>
          </div>
        </div>

        {/* Share Toast */}
        <AnimatePresence>
          {showShareToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary text-black font-medium rounded-lg shadow-lg"
            >
              Profile link copied!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Social List Modal (Friends / Followers / Following) */}
      {socialListType && (
        <SocialListModal
          isOpen={true}
          onClose={() => setSocialListType(null)}
          userId={profile.id}
          username={profile.username}
          listType={socialListType}
        />
      )}
    </motion.div>
  );
}

// Stat Card Component
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    primary: "hover:border-primary/50 hover:shadow-primary/20",
    accent: "hover:border-accent/50 hover:shadow-accent/20",
    secondary: "hover:border-secondary/50 hover:shadow-secondary/20",
  };

  return (
    <div
      className={`
        stat-card-gaming rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-center min-w-[70px] sm:min-w-[80px]
        ${colorClasses[color as keyof typeof colorClasses]}
        hover:shadow-lg transition-all cursor-pointer
      `}
    >
      <p className="text-xl sm:text-2xl font-black text-text">{value}</p>
      <p className="text-[9px] sm:text-[10px] text-text-muted uppercase tracking-widest font-medium">{label}</p>
    </div>
  );
}

// Profile Views Stat Card with eye icon accent
function ViewsStatCard({ value }: { value: number }) {
  return (
    <div
      className="stat-card-gaming rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-center min-w-[70px] sm:min-w-[80px] hover:border-warning/50 hover:shadow-warning/20 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-center justify-center gap-1">
        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
        <p className="text-xl sm:text-2xl font-black text-text">{value}</p>
      </div>
      <p className="text-[9px] sm:text-[10px] text-text-muted uppercase tracking-widest font-medium">VIEWS</p>
    </div>
  );
}

// Format relative time for viewer timestamps
function formatViewTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
