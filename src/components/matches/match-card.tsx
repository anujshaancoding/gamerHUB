"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  Gamepad2,
  MapPin,
  Trophy,
  Check,
  X,
} from "lucide-react";
import { Card, Avatar, Badge, Button } from "@/components/ui";
import { createClient } from "@/lib/db/client-browser";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatDateTime } from "@/lib/utils";
import type { Match, Game, Profile } from "@/types/database";

interface MatchWithDetails extends Match {
  game: Game | null;
  creator: Profile | null;
  participants: { user: Profile }[];
}

interface MatchCardProps {
  match: MatchWithDetails;
}

export function MatchCard({ match }: MatchCardProps) {
  const { user } = useAuth();
  const db = createClient();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(
    match.participants?.some((p) => p.user?.id === user?.id) || false
  );

  const isCreator = match.creator_id === user?.id;
  const participantCount = match.participants?.length || 0;
  const isFull = participantCount >= match.max_players;

  const handleJoin = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await db.from("match_participants").insert({
        match_id: match.id,
        user_id: user.id,
        status: "accepted",
      } as never);
      setJoined(true);
    } catch (error) {
      console.error("Join error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await db
        .from("match_participants")
        .delete()
        .eq("match_id", match.id)
        .eq("user_id", user.id);
      setJoined(false);
    } catch (error) {
      console.error("Leave error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (match.status) {
      case "upcoming":
        return "primary";
      case "in_progress":
        return "warning";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Game Icon */}
        <div className="w-16 h-16 rounded-lg bg-surface-light flex items-center justify-center shrink-0">
          {match.game?.icon_url ? (
            <img
              src={match.game.icon_url}
              alt={match.game.name}
              className="w-12 h-12 rounded"
            />
          ) : (
            <Gamepad2 className="h-8 w-8 text-primary" />
          )}
        </div>

        {/* Match Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={`/matches/${match.id}`}>
                <h3 className="font-semibold text-text hover:text-primary transition-colors">
                  {match.title || "Untitled Match"}
                </h3>
              </Link>
              {match.game && (
                <p className="text-sm text-text-muted">{match.game.name}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant={getStatusColor()}>{match.status}</Badge>
              <Badge
                variant={
                  match.match_type === "competitive" ? "primary" : "default"
                }
              >
                {match.match_type}
              </Badge>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDateTime(match.scheduled_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {match.duration_minutes} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {participantCount}/{match.max_players} players
            </span>
          </div>

          {/* Creator & Participants */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Created by</span>
              <Link
                href={match.creator?.username ? `/profile/${match.creator.username}` : "#"}
                className="flex items-center gap-2 hover:opacity-80"
              >
                <Avatar
                  src={match.creator?.avatar_url}
                  alt={match.creator?.username || "Creator"}
                  size="xs"
                />
                <span className="text-sm text-text">
                  {match.creator?.display_name || match.creator?.username}
                </span>
              </Link>
            </div>

            {/* Participant Avatars */}
            {match.participants && match.participants.length > 0 && (
              <div className="flex -space-x-2">
                {match.participants.slice(0, 4).map((p, i) => (
                  <Avatar
                    key={i}
                    src={p.user?.avatar_url}
                    alt={p.user?.username || "Participant"}
                    size="xs"
                    className="ring-2 ring-background"
                  />
                ))}
                {match.participants.length > 4 && (
                  <div className="h-6 w-6 rounded-full bg-surface-light flex items-center justify-center text-xs text-text-muted ring-2 ring-background">
                    +{match.participants.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col gap-2 sm:justify-center shrink-0">
          {isCreator ? (
            <Link href={`/matches/${match.id}/edit`}>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </Link>
          ) : joined ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLeave}
              isLoading={loading}
              leftIcon={<X className="h-4 w-4" />}
            >
              Leave
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleJoin}
              isLoading={loading}
              disabled={isFull}
              leftIcon={<Check className="h-4 w-4" />}
            >
              {isFull ? "Full" : "Join"}
            </Button>
          )}
          <Link href={`/matches/${match.id}`}>
            <Button variant="ghost" size="sm">
              Details
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
