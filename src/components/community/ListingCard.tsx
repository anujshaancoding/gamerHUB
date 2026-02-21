"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Gift,
  Calendar,
  Clock,
  ExternalLink,
  Bookmark,
  Eye,
  Crown,
  Gamepad2,
  Heart,
  MessageCircle,
  ArrowRight,
  Medal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, RelativeTime } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getGameTheme } from "@/lib/utils/game-theme";
import type { CommunityListing, ListingType, ListingStatus } from "@/types/listings";

interface ListingCardProps {
  listing: CommunityListing;
  onBookmark?: () => void;
  isBookmarking?: boolean;
  onLike?: () => void;
  isLiking?: boolean;
  onClick?: () => void;
}

const LISTING_TYPE_ICONS: Record<ListingType, typeof Trophy> = {
  tournament: Trophy,
  giveaway: Gift,
};

const STATUS_COLORS: Record<ListingStatus, string> = {
  active: "bg-green-500/10 text-green-500",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-red-500/10 text-red-500",
  draft: "bg-gray-500/10 text-gray-500",
};

export function ListingCard({
  listing,
  onBookmark,
  isBookmarking,
  onLike,
  isLiking,
  onClick,
}: ListingCardProps) {
  const TypeIcon = LISTING_TYPE_ICONS[listing.listing_type];
  const startDate = new Date(listing.starts_at);
  const endDate = listing.ends_at ? new Date(listing.ends_at) : null;
  const hasWinners = listing.winners && listing.winners.length > 0;
  const isTournament = listing.listing_type === "tournament";

  // Get game theme - falls back to monochrome for "other"/unknown
  const gameSlug = listing.game?.slug || "other";
  const theme = getGameTheme(gameSlug);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border overflow-hidden transition-all duration-300 cursor-pointer group",
        "bg-surface hover:shadow-lg hover:-translate-y-0.5",
        theme.isMonochrome
          ? "border-gray-700 hover:border-gray-500"
          : `border-border hover:${theme.primaryBorder}/40`
      )}
      onClick={onClick}
    >
      {/* Game-colored gradient header band */}
      <div className={cn(
        "relative px-4 py-3 flex items-center justify-between",
        "bg-gradient-to-r",
        theme.isMonochrome ? "from-gray-800 to-gray-900" :
        gameSlug === 'valorant' ? "from-red-600/80 to-red-900/80" :
        gameSlug === 'bgmi' ? "from-orange-600/80 to-orange-900/80" :
        gameSlug === 'freefire' ? "from-yellow-600/80 to-yellow-900/80" :
        "from-gray-700 to-gray-900"
      )}>
        <div className="flex items-center gap-2">
          <TypeIcon className="h-4 w-4 text-white" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {isTournament ? "Tournament" : "Giveaway"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {listing.game && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-black/30 text-white/90">
              <Gamepad2 className="h-3 w-3" />
              {listing.game.name}
            </span>
          )}
          {listing.status !== "active" && (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              STATUS_COLORS[listing.status]
            )}>
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {listing.cover_image_url && (
        <div className="relative h-36 overflow-hidden">
          <img
            src={listing.cover_image_url}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = "none";
            }}
          />
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t to-transparent",
            theme.isMonochrome ? "from-gray-900/60" : "from-black/50"
          )} />

          {/* Sparkle overlay for giveaways */}
          {!isTournament && (
            <div className="absolute top-3 right-3">
              <Sparkles className={cn("h-5 w-5 animate-pulse", theme.primaryText)} />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & Description */}
        <div>
          <h3 className={cn(
            "font-bold text-lg mb-1 group-hover:transition-colors",
            theme.isMonochrome ? "text-white group-hover:text-gray-300" : `text-text group-hover:${theme.primaryText}`
          )}>
            {listing.title}
          </h3>
          <p className="text-sm text-text-muted line-clamp-2">
            {listing.description}
          </p>
        </div>

        {/* Organizer */}
        {listing.organizer_name && (
          <p className="text-sm text-text-secondary">
            Organized by{" "}
            {listing.organizer_url ? (
              <a
                href={listing.organizer_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "hover:underline font-medium",
                  theme.isMonochrome ? "text-gray-300" : theme.primaryText
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {listing.organizer_name}
              </a>
            ) : (
              <span className="font-medium">{listing.organizer_name}</span>
            )}
          </p>
        )}

        {/* Bracket-style Date Section (Tournament) or Countdown-style (Giveaway) */}
        {isTournament ? (
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border",
            theme.isMonochrome
              ? "border-gray-700 bg-gray-800/50"
              : `border-${theme.primary}/20 bg-${theme.primary}/5`
          )}>
            <div className="flex-1 text-center">
              <p className="text-[10px] uppercase tracking-wider text-text-dim mb-0.5">Start</p>
              <p className="text-sm font-semibold text-text">{formatDate(startDate)}</p>
              <p className="text-xs text-text-muted">{formatTime(startDate)}</p>
            </div>
            <div className="flex items-center gap-1">
              <div className={cn("w-6 h-px", theme.isMonochrome ? "bg-gray-600" : `bg-${theme.primary}/30`)} />
              <ArrowRight className={cn("h-3.5 w-3.5", theme.isMonochrome ? "text-gray-500" : theme.primaryText)} />
            </div>
            {endDate && (
              <div className="flex-1 text-center">
                <p className="text-[10px] uppercase tracking-wider text-text-dim mb-0.5">End</p>
                <p className="text-sm font-semibold text-text">{formatDate(endDate)}</p>
                <p className="text-xs text-text-muted">{formatTime(endDate)}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>
              {formatDate(startDate)}
              {endDate && ` - ${formatDate(endDate)}`}
            </span>
            <span>·</span>
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{formatTime(startDate)}</span>
          </div>
        )}

        {/* Prize showcase */}
        {listing.prize_description && (
          <div className={cn(
            "flex items-start gap-2 p-2.5 rounded-lg border",
            theme.isMonochrome
              ? "border-gray-600 bg-gray-800/50"
              : "border-yellow-500/20 bg-yellow-500/5"
          )}>
            <Trophy className={cn("h-4 w-4 flex-shrink-0 mt-0.5", theme.isMonochrome ? "text-gray-400" : "text-yellow-500")} />
            <p className={cn("text-sm font-medium line-clamp-2", theme.isMonochrome ? "text-gray-300" : "text-yellow-500")}>
              {listing.prize_description}
            </p>
          </div>
        )}

        {/* Winners podium */}
        {hasWinners && (
          <div className={cn(
            "p-3 rounded-lg border",
            theme.isMonochrome ? "border-gray-700 bg-gray-800/30" : "border-yellow-500/10 bg-yellow-500/5"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Crown className={cn("h-4 w-4", theme.isMonochrome ? "text-gray-400" : "text-yellow-500")} />
              <span className={cn("text-sm font-bold", theme.isMonochrome ? "text-gray-300" : "text-yellow-500")}>Winners</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {listing.winners!
                .sort((a, b) => (a.placement || 99) - (b.placement || 99))
                .slice(0, 3)
                .map((w) => (
                  <span
                    key={w.id}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-surface-light text-text-secondary"
                  >
                    <Medal className="h-3 w-3 text-yellow-500" />
                    {w.placement && <span className="font-bold">#{w.placement}</span>}
                    {w.display_name}
                  </span>
                ))}
              {listing.winners!.length > 3 && (
                <span className="text-xs text-text-dim px-2 py-1">
                  +{listing.winners!.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* External link CTA */}
        {listing.external_link && (
          <a
            href={listing.external_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium transition-all",
              theme.isMonochrome
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : `bg-${theme.primary}/10 ${theme.primaryText} hover:bg-${theme.primary}/20`
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {isTournament ? "Register Now" : "Enter Giveaway"}
          </a>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Avatar
              src={listing.creator?.avatar_url}
              alt={listing.creator?.display_name || listing.creator?.username || "User"}
              size="xs"
            />
            <span className="text-sm text-text-muted">
              {listing.creator?.display_name || listing.creator?.username}
            </span>
            <span className="text-xs text-text-dim">
              · <RelativeTime date={listing.created_at} />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-text-dim">
              <Eye className="h-3.5 w-3.5" />
              {listing.view_count}
            </span>
            {onLike && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike();
                }}
                disabled={isLiking}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  listing.user_liked
                    ? "text-red-500"
                    : "text-text-dim hover:text-red-500"
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", listing.user_liked ? "fill-current" : "")} />
                {listing.likes_count || 0}
              </button>
            )}
            <span className="flex items-center gap-1 text-xs text-text-dim">
              <MessageCircle className="h-3.5 w-3.5" />
              {listing.comments_count || 0}
            </span>
            {onBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark();
                }}
                disabled={isBookmarking}
                className="text-text-muted hover:text-primary transition-colors"
              >
                <Bookmark className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
