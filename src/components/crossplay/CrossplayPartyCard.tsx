"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Copy,
  Check,
  Loader2,
  Gamepad2,
  Mic,
  Crown,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCrossplayParties } from "@/lib/hooks/useConsolePlatforms";
import type { CrossplayParty, GamePlatform } from "@/types/console";
import { GAME_PLATFORM_CONFIG } from "@/types/console";

interface CrossplayPartyCardProps {
  party: CrossplayParty;
  onJoin?: () => void;
  showActions?: boolean;
}

export function CrossplayPartyCard({
  party,
  onJoin,
  showActions = true,
}: CrossplayPartyCardProps) {
  const { joinParty, isJoining } = useCrossplayParties();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(party.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    await joinParty(party.id, { platform: "pc" });
    onJoin?.();
  };

  const getTimeRemaining = () => {
    const expires = new Date(party.expires_at);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs <= 0) return "Expired";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const statusColors = {
    open: "bg-green-500/10 text-green-500",
    full: "bg-yellow-500/10 text-yellow-500",
    in_game: "bg-blue-500/10 text-blue-500",
    closed: "bg-gray-500/10 text-gray-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {party.game?.icon_url ? (
              <img
                src={party.game.icon_url}
                alt={party.game.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <h3 className="font-semibold line-clamp-1">
                {party.title || `${party.game?.name || "Game"} Party`}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{party.game?.name}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {party.current_members}/{party.max_members}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[party.status]
            }`}
          >
            {party.status === "in_game" ? "In Game" : party.status}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Description */}
        {party.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {party.description}
          </p>
        )}

        {/* Platforms */}
        <div className="flex flex-wrap gap-2">
          {party.platforms_allowed.map((platform: GamePlatform) => {
            const config = GAME_PLATFORM_CONFIG[platform];
            return (
              <span
                key={platform}
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: `${config.color}15`,
                  color: config.color,
                }}
              >
                {config.shortName}
              </span>
            );
          })}
        </div>

        {/* Members Preview */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {party.members?.slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="relative"
                title={member.user?.username || member.platform_username || ""}
              >
                {member.user?.avatar_url ? (
                  <img
                    src={member.user.avatar_url}
                    alt={member.user.username}
                    className="w-8 h-8 rounded-full border-2 border-card"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center">
                    <span className="text-xs">
                      {(member.user?.username || "?")[0].toUpperCase()}
                    </span>
                  </div>
                )}
                {member.is_leader && (
                  <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
                )}
              </div>
            ))}
            {party.members && party.members.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs">
                +{party.members.length - 4}
              </div>
            )}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {getTimeRemaining()}
          </div>
        </div>

        {/* Voice Info */}
        {party.voice_platform && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mic className="h-4 w-4" />
            <span className="capitalize">{party.voice_platform.replace("_", " ")}</span>
            {party.voice_channel_link && (
              <a
                href={party.voice_channel_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Join Voice
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCopyCode}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  {party.invite_code}
                </>
              )}
            </Button>
            {party.status === "open" && (
              <Button
                size="sm"
                className="flex-1"
                onClick={handleJoin}
                disabled={isJoining}
              >
                {isJoining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Join Party"
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Party List Component
interface CrossplayPartyListProps {
  gameId?: string;
  platform?: GamePlatform;
  limit?: number;
}

export function CrossplayPartyList({
  gameId,
  platform,
  limit = 10,
}: CrossplayPartyListProps) {
  const { parties, isLoading, error } = useCrossplayParties({
    gameId,
    platform,
    limit,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load parties
      </div>
    );
  }

  if (!parties || parties.length === 0) {
    return (
      <div className="text-center py-12">
        <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-medium mb-1">No Active Parties</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Be the first to create a crossplay party!
        </p>
        <Button asChild>
          <Link href="/crossplay/create">Create Party</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {parties.map((party) => (
        <CrossplayPartyCard key={party.id} party={party} />
      ))}
    </div>
  );
}

// Create Party Button
export function CreateCrossplayPartyButton() {
  return (
    <Button asChild>
      <Link href="/crossplay/create">
        <Users className="h-4 w-4 mr-2" />
        Create Party
      </Link>
    </Button>
  );
}
