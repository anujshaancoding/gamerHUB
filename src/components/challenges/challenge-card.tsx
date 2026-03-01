"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Swords,
  Gamepad2,
  Trophy,
  Clock,
  User,
  Check,
  X,
  Gift,
} from "lucide-react";
import { Card, Avatar, Badge, Button } from "@/components/ui";
import { createClient } from "@/lib/db/client-browser";
import { formatRelativeTime } from "@/lib/utils";
import type { Challenge, Game, Profile } from "@/types/database";

interface ChallengeWithDetails extends Challenge {
  game: Game | null;
  creator: Profile | null;
  acceptedBy: Profile | null;
}

interface ChallengeCardProps {
  challenge: ChallengeWithDetails;
  currentUserId?: string;
}

export function ChallengeCard({ challenge, currentUserId }: ChallengeCardProps) {
  const router = useRouter();
  const db = createClient();
  const [loading, setLoading] = useState(false);

  const isCreator = challenge.creator_id === currentUserId;
  const isAccepted = challenge.status !== "open";

  const handleAccept = async () => {
    if (!currentUserId || isCreator) return;
    setLoading(true);

    try {
      // Update challenge
      const { error: challengeError } = await db
        .from("challenges")
        .update({
          status: "accepted",
          accepted_by: currentUserId,
        } as never)
        .eq("id", challenge.id);

      if (challengeError) throw challengeError;

      // Create a match for this challenge
      const { data: match, error: matchError } = await db
        .from("matches")
        .insert({
          title: `Challenge: ${challenge.title}`,
          description: challenge.description,
          game_id: challenge.game_id,
          creator_id: challenge.creator_id,
          scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h from now
          max_players: 2,
          match_type: "competitive",
        } as never)
        .select()
        .single();

      if (matchError) throw matchError;

      const matchId = (match as { id: string } | null)?.id;
      if (!matchId) throw new Error("Failed to create match");

      // Add both participants
      await db.from("match_participants").insert([
        { match_id: matchId, user_id: challenge.creator_id, status: "accepted" },
        { match_id: matchId, user_id: currentUserId, status: "accepted" },
      ] as never);

      // Update challenge with match ID
      await db
        .from("challenges")
        .update({ match_id: matchId, status: "in_progress" } as never)
        .eq("id", challenge.id);

      router.push(`/matches/${matchId}`);
    } catch (error) {
      console.error("Accept error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (challenge.status) {
      case "open":
        return "primary";
      case "accepted":
        return "warning";
      case "in_progress":
        return "secondary";
      case "completed":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Game & Status */}
        <div className="flex sm:flex-col items-center gap-4 sm:gap-2">
          <div className="w-16 h-16 rounded-lg bg-surface-light flex items-center justify-center">
            {challenge.game?.icon_url ? (
              <img
                src={challenge.game.icon_url}
                alt={challenge.game.name}
                className="w-12 h-12 rounded"
              />
            ) : (
              <Swords className="h-8 w-8 text-warning" />
            )}
          </div>
          <Badge variant={getStatusColor()} className="sm:hidden">
            {challenge.status}
          </Badge>
        </div>

        {/* Challenge Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-text">{challenge.title}</h3>
              {challenge.game && (
                <p className="text-sm text-text-muted">{challenge.game.name}</p>
              )}
            </div>
            <Badge variant={getStatusColor()} className="hidden sm:inline-flex">
              {challenge.status}
            </Badge>
          </div>

          {challenge.description && (
            <p className="text-sm text-text-secondary mt-2 line-clamp-2">
              {challenge.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 mt-3">
            {challenge.rank_requirement && (
              <Badge variant="outline" className="gap-1">
                <Trophy className="h-3 w-3" />
                {challenge.rank_requirement}+
              </Badge>
            )}
            {challenge.reward && (
              <Badge variant="warning" className="gap-1">
                <Gift className="h-3 w-3" />
                {challenge.reward}
              </Badge>
            )}
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(challenge.created_at)}
            </span>
          </div>

          {/* Rules */}
          {challenge.rules && (
            <div className="mt-3 p-3 bg-surface-light rounded-lg">
              <p className="text-xs text-text-muted font-medium mb-1">Rules</p>
              <p className="text-sm text-text-secondary">{challenge.rules}</p>
            </div>
          )}

          {/* Creator & Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-4">
              <Link
                href={challenge.creator?.username ? `/profile/${challenge.creator.username}` : "#"}
                className="flex items-center gap-2 hover:opacity-80"
              >
                <Avatar
                  src={challenge.creator?.avatar_url}
                  alt={challenge.creator?.username || "Creator"}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-text">
                    {challenge.creator?.display_name || challenge.creator?.username}
                  </p>
                  <p className="text-xs text-text-muted">Challenger</p>
                </div>
              </Link>

              {challenge.acceptedBy && (
                <>
                  <Swords className="h-4 w-4 text-warning" />
                  <Link
                    href={`/profile/${challenge.acceptedBy.username}`}
                    className="flex items-center gap-2 hover:opacity-80"
                  >
                    <Avatar
                      src={challenge.acceptedBy.avatar_url}
                      alt={challenge.acceptedBy.username}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-text">
                        {challenge.acceptedBy.display_name ||
                          challenge.acceptedBy.username}
                      </p>
                      <p className="text-xs text-text-muted">Accepted</p>
                    </div>
                  </Link>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {challenge.status === "open" && !isCreator && currentUserId && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAccept}
                  isLoading={loading}
                  leftIcon={<Check className="h-4 w-4" />}
                >
                  Accept
                </Button>
              )}
              {challenge.match_id && (
                <Link href={`/matches/${challenge.match_id}`}>
                  <Button variant="outline" size="sm">
                    View Match
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
