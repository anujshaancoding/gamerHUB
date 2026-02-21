"use client";

import {
  Trophy,
  Gift,
  Calendar,
  Clock,
  ExternalLink,
  Crown,
  Gamepad2,
  Bookmark,
  Eye,
  Globe,
  Heart,
  MessageCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button, Avatar, RelativeTime } from "@/components/ui";
import { AddWinnersForm } from "./AddWinnersForm";
import { ListingComments } from "./ListingComments";
import type { CommunityListing, ListingType, ListingStatus } from "@/types/listings";

interface ListingDetailModalProps {
  listing: CommunityListing;
  isOpen: boolean;
  onClose: () => void;
  isCreator: boolean;
  onBookmark?: () => void;
  isBookmarking?: boolean;
  onLike?: () => void;
  isLiking?: boolean;
}

const LISTING_TYPE_COLORS: Record<ListingType, string> = {
  tournament: "bg-purple-500/10 text-purple-500",
  giveaway: "bg-green-500/10 text-green-500",
};

const STATUS_COLORS: Record<ListingStatus, string> = {
  active: "bg-green-500/10 text-green-500",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-red-500/10 text-red-500",
  draft: "bg-gray-500/10 text-gray-500",
};

export function ListingDetailModal({
  listing,
  isOpen,
  onClose,
  isCreator,
  onBookmark,
  isBookmarking,
  onLike,
  isLiking,
}: ListingDetailModalProps) {
  const TypeIcon = listing.listing_type === "tournament" ? Trophy : Gift;
  const startDate = new Date(listing.starts_at);
  const endDate = listing.ends_at ? new Date(listing.ends_at) : null;
  const hasWinners = listing.winners && listing.winners.length > 0;

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
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
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${LISTING_TYPE_COLORS[listing.listing_type]}`}
            >
              <TypeIcon className="h-3 w-3" />
              {listing.listing_type === "tournament"
                ? "Tournament"
                : "Giveaway"}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[listing.status]}`}
            >
              {listing.status.charAt(0).toUpperCase() +
                listing.status.slice(1)}
            </span>
            {listing.game && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-surface-light text-text-secondary">
                <Gamepad2 className="h-3 w-3" />
                {listing.game.name}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-text">{listing.title}</h2>
        </div>

        {/* Cover Image */}
        {listing.cover_image_url && (
          <div className="rounded-lg overflow-hidden">
            <img
              src={listing.cover_image_url}
              alt={listing.title}
              className="w-full max-h-64 object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Organizer */}
        {listing.organizer_name && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-text-muted" />
            <span className="text-text-secondary">Organized by</span>
            {listing.organizer_url ? (
              <a
                href={listing.organizer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                {listing.organizer_name}
              </a>
            ) : (
              <span className="font-medium text-text">
                {listing.organizer_name}
              </span>
            )}
          </div>
        )}

        {/* Date/Time */}
        <div className="p-3 rounded-lg bg-surface-light space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-text">
              {formatDate(startDate)}
              {endDate && ` — ${formatDate(endDate)}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-text">
              {formatTime(startDate)}
              {endDate && ` to ${formatTime(endDate)}`}
            </span>
            {listing.timezone && (
              <span className="text-text-muted">({listing.timezone})</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-semibold text-text mb-2">Description</h3>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">
            {listing.description}
          </p>
        </div>

        {/* Prize */}
        {listing.prize_description && (
          <div>
            <h3 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Prizes
            </h3>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {listing.prize_description}
            </p>
          </div>
        )}

        {/* Rules */}
        {listing.rules && (
          <div>
            <h3 className="text-sm font-semibold text-text mb-2">
              Rules & Regulations
            </h3>
            <div className="p-3 rounded-lg bg-surface-light text-sm text-text-secondary whitespace-pre-wrap">
              {listing.rules}
            </div>
          </div>
        )}

        {/* External Link */}
        {listing.external_link && (
          <a
            href={listing.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Open Registration / Details
          </a>
        )}

        {/* Tags */}
        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-xs bg-surface-light text-text-muted"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Winners Section */}
        {(hasWinners || isCreator) && (
          <div className="pt-3 border-t border-border">
            {hasWinners && !isCreator && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  Winners
                </h3>
                <div className="space-y-2">
                  {listing
                    .winners!.sort(
                      (a, b) => (a.placement || 99) - (b.placement || 99)
                    )
                    .map((winner) => (
                      <div
                        key={winner.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-surface-light"
                      >
                        {winner.placement && (
                          <span className="text-sm font-bold text-yellow-500 w-8">
                            #{winner.placement}
                          </span>
                        )}
                        <span className="text-sm text-text font-medium">
                          {winner.display_name}
                        </span>
                        {winner.prize_awarded && (
                          <span className="text-xs text-text-muted">
                            — {winner.prize_awarded}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {isCreator && (
              <AddWinnersForm
                listingId={listing.id}
                existingWinners={listing.winners || []}
              />
            )}
          </div>
        )}

        {/* Comments Section */}
        <div className="pt-3 border-t border-border">
          <ListingComments listingId={listing.id} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Avatar
              src={listing.creator?.avatar_url}
              alt={
                listing.creator?.display_name ||
                listing.creator?.username ||
                "User"
              }
              size="sm"
            />
            <div>
              <p className="text-sm font-medium text-text">
                {listing.creator?.display_name || listing.creator?.username}
              </p>
              <p className="text-xs text-text-muted">
                Posted <RelativeTime date={listing.created_at} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-text-dim">
              <Eye className="h-3.5 w-3.5" />
              {listing.view_count}
            </span>
            {onLike && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLike}
                disabled={isLiking}
                leftIcon={
                  <Heart
                    className={`h-4 w-4 ${listing.user_liked ? "fill-red-500 text-red-500" : ""}`}
                  />
                }
              >
                {listing.likes_count || 0}
              </Button>
            )}
            <span className="flex items-center gap-1 text-xs text-text-dim">
              <MessageCircle className="h-3.5 w-3.5" />
              {listing.comments_count || 0}
            </span>
            {onBookmark && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBookmark}
                disabled={isBookmarking}
                leftIcon={<Bookmark className="h-4 w-4" />}
              >
                Bookmark
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
