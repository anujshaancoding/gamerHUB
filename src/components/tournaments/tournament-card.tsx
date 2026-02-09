"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Users, Trophy, Gamepad2 } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { TournamentWithDetails, PrizePool } from "@/types/database";

interface TournamentCardProps {
  tournament: TournamentWithDetails;
  className?: string;
}

const statusConfig = {
  draft: { label: "Draft", variant: "default" as const },
  registration: { label: "Registering", variant: "success" as const },
  seeding: { label: "Seeding", variant: "warning" as const },
  in_progress: { label: "In Progress", variant: "warning" as const },
  completed: { label: "Completed", variant: "default" as const },
  cancelled: { label: "Cancelled", variant: "error" as const },
};

const formatConfig = {
  single_elimination: "Single Elim",
  double_elimination: "Double Elim",
  round_robin: "Round Robin",
};

export function TournamentCard({ tournament, className }: TournamentCardProps) {
  const status = statusConfig[tournament.status] || statusConfig.draft;
  const format = formatConfig[tournament.format] || tournament.format;
  const prizePool = tournament.prize_pool as PrizePool | null;

  const registrationOpen =
    tournament.status === "registration" &&
    new Date(tournament.registration_end) > new Date();

  const registrationStartsSoon =
    tournament.status === "draft" &&
    new Date(tournament.registration_start) > new Date();

  return (
    <Link href={`/tournaments/${tournament.slug}`}>
      <Card variant="interactive" className={cn("overflow-hidden", className)}>
        {/* Banner */}
        <div className="relative h-32 -mx-6 -mt-6 mb-4 bg-gradient-to-r from-primary/20 to-accent/20">
          {tournament.banner_url && (
            <Image
              src={tournament.banner_url}
              alt={tournament.name}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          {/* Prize Pool */}
          {prizePool && prizePool.total > 0 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-warning/20 text-warning px-2 py-1 rounded-full text-sm font-medium">
              <Trophy className="h-3 w-3" />
              {prizePool.total.toLocaleString()} {prizePool.currency}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Title & Organizer */}
          <div>
            <h3 className="font-semibold text-text text-lg line-clamp-1">
              {tournament.name}
            </h3>
            {tournament.organizer_clan && (
              <div className="flex items-center gap-2 mt-1">
                <Avatar
                  src={tournament.organizer_clan.avatar_url}
                  alt={tournament.organizer_clan.name}
                  size="xs"
                  fallback={tournament.organizer_clan.tag}
                />
                <span className="text-sm text-text-muted">
                  by {tournament.organizer_clan.name}
                </span>
              </div>
            )}
          </div>

          {/* Game & Format */}
          <div className="flex items-center gap-3 flex-wrap">
            {tournament.game && (
              <div className="flex items-center gap-1 text-sm text-text-muted">
                <Gamepad2 className="h-4 w-4" />
                {tournament.game.name}
              </div>
            )}
            <Badge variant="outline" className="text-xs">
              {format}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-text-muted">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {tournament.participant_count || 0}/{tournament.max_teams}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {registrationOpen ? (
                <span className="text-success">
                  Closes {formatRelativeTime(tournament.registration_end)}
                </span>
              ) : registrationStartsSoon ? (
                <span>
                  Opens {formatRelativeTime(tournament.registration_start)}
                </span>
              ) : tournament.status === "in_progress" ? (
                <span className="text-warning">Live now</span>
              ) : tournament.status === "completed" ? (
                <span>Ended {formatRelativeTime(tournament.end_date || tournament.start_date)}</span>
              ) : (
                <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {/* Description */}
          {tournament.description && (
            <p className="text-sm text-text-muted line-clamp-2">
              {tournament.description}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
