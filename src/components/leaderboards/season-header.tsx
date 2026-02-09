"use client";

import { Calendar, Clock, Users, Trophy, Target } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import type { SeasonWithDetails } from "@/types/database";

interface SeasonHeaderProps {
  season: SeasonWithDetails;
}

export function SeasonHeader({ season }: SeasonHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "upcoming":
        return "warning";
      case "completed":
        return "outline";
      default:
        return "outline";
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const end = new Date(season.ends_at);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card
      className="relative overflow-hidden"
      style={{
        backgroundImage: season.banner_url
          ? `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.4)), url(${season.banner_url})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getStatusColor(season.status) as "success" | "warning" | "outline"}>
                {season.status.charAt(0).toUpperCase() + season.status.slice(1)}
              </Badge>
              <Badge variant="outline">Season {season.season_number}</Badge>
              {season.game && (
                <Badge variant="primary">{season.game.name}</Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-text">
              {season.name}
            </h1>
            {season.description && (
              <p className="text-text-secondary mt-2 max-w-2xl">
                {season.description}
              </p>
            )}
          </div>

          {season.status === "active" && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-warning">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{getTimeRemaining()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-surface/50 backdrop-blur rounded-lg p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-text">
              {formatDate(season.starts_at)}
            </p>
            <p className="text-xs text-text-muted">Start Date</p>
          </div>
          <div className="bg-surface/50 backdrop-blur rounded-lg p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-error mb-1" />
            <p className="text-lg font-bold text-text">
              {formatDate(season.ends_at)}
            </p>
            <p className="text-xs text-text-muted">End Date</p>
          </div>
          <div className="bg-surface/50 backdrop-blur rounded-lg p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-accent mb-1" />
            <p className="text-lg font-bold text-text">
              {season.participant_count.toLocaleString()}
            </p>
            <p className="text-xs text-text-muted">Participants</p>
          </div>
          <div className="bg-surface/50 backdrop-blur rounded-lg p-4 text-center">
            <Trophy className="h-5 w-5 mx-auto text-warning mb-1" />
            <p className="text-lg font-bold text-text">
              {season.rewards?.length || 0}
            </p>
            <p className="text-xs text-text-muted">Rewards</p>
          </div>
        </div>

        {/* Challenges Preview */}
        {season.challenges && season.challenges.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-text-muted mb-2 flex items-center gap-1">
              <Target className="h-4 w-4" />
              Active Challenges
            </h3>
            <div className="flex flex-wrap gap-2">
              {season.challenges.slice(0, 3).map((challenge) => (
                <Badge key={challenge.id} variant="outline" className="gap-1">
                  {challenge.title}
                  <span className="text-primary">+{challenge.points_reward}pts</span>
                </Badge>
              ))}
              {season.challenges.length > 3 && (
                <Badge variant="default">
                  +{season.challenges.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
