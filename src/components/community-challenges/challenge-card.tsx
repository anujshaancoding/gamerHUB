"use client";

import { useState } from "react";
import {
  Target,
  Clock,
  Users,
  Trophy,
  Gamepad2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Card, Badge, Button, Modal } from "@/components/ui";
import { ChallengeProgressBar } from "./challenge-progress-bar";
import type { ChallengeWithProgress, ChallengeProgressEntry } from "@/types/database";

interface ChallengeCardProps {
  challenge: ChallengeWithProgress;
  onJoin?: () => Promise<void>;
  joining?: boolean;
}

export function ChallengeCard({
  challenge,
  onJoin,
  joining = false,
}: ChallengeCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "error";
      case "legendary":
        return "primary";
      default:
        return "outline";
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "seasonal":
        return "Seasonal";
      case "event":
        return "Event";
      default:
        return period;
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const end = new Date(challenge.ends_at);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return "Ending soon";
  };

  const userProgress = challenge.user_progress;
  const isJoined = !!userProgress;
  const isCompleted = userProgress?.status === "completed";
  const progressEntries = (userProgress?.progress as unknown as ChallengeProgressEntry[]) || [];

  return (
    <>
      <Card
        variant="interactive"
        className="h-full"
        onClick={() => setShowDetails(true)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={getDifficultyColor(challenge.difficulty) as "success" | "warning" | "error" | "primary" | "outline"} size="sm">
              {challenge.difficulty}
            </Badge>
            <Badge variant="outline" size="sm">
              {getPeriodLabel(challenge.period_type)}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-warning text-sm">
            <Trophy className="h-4 w-4" />
            <span className="font-medium">+{challenge.points_reward}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-text mt-2">{challenge.title}</h3>
        {challenge.description && (
          <p className="text-sm text-text-muted line-clamp-2 mt-1">
            {challenge.description}
          </p>
        )}

        {/* Progress */}
        {isJoined && progressEntries.length > 0 && (
          <div className="mt-3">
            <ChallengeProgressBar
              progress={progressEntries}
              compact
            />
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {getTimeRemaining()}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {challenge.participant_count} joined
          </span>
          {challenge.game && (
            <span className="flex items-center gap-1">
              <Gamepad2 className="h-3 w-3" />
              {challenge.game.name}
            </span>
          )}
        </div>

        {/* Status */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          {isCompleted ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </Badge>
          ) : isJoined ? (
            <Badge variant="primary" className="gap-1">
              <Target className="h-3 w-3" />
              In Progress
            </Badge>
          ) : (
            <span className="text-sm text-text-muted">Not joined</span>
          )}
          <span className="text-xs text-text-muted">
            {challenge.completion_count} completed
          </span>
        </div>
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={challenge.title}
        size="md"
      >
        <div className="space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={getDifficultyColor(challenge.difficulty) as "success" | "warning" | "error" | "primary" | "outline"}>
              {challenge.difficulty}
            </Badge>
            <Badge variant="outline">{getPeriodLabel(challenge.period_type)}</Badge>
            {challenge.game && (
              <Badge variant="primary" className="gap-1">
                <Gamepad2 className="h-3 w-3" />
                {challenge.game.name}
              </Badge>
            )}
          </div>

          {/* Description */}
          {challenge.description && (
            <p className="text-text-secondary">{challenge.description}</p>
          )}

          {/* Rules */}
          {challenge.rules && (
            <div>
              <h4 className="text-sm font-medium text-text mb-1">Rules</h4>
              <p className="text-sm text-text-muted">{challenge.rules}</p>
            </div>
          )}

          {/* Progress */}
          {isJoined && progressEntries.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-text mb-2">Your Progress</h4>
              <ChallengeProgressBar progress={progressEntries} />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-surface-light rounded-lg">
              <Trophy className="h-5 w-5 mx-auto text-warning mb-1" />
              <p className="text-lg font-bold text-text">
                {challenge.points_reward}
              </p>
              <p className="text-xs text-text-muted">Points</p>
            </div>
            <div className="text-center p-3 bg-surface-light rounded-lg">
              <Users className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-text">
                {challenge.participant_count}
              </p>
              <p className="text-xs text-text-muted">Participants</p>
            </div>
            <div className="text-center p-3 bg-surface-light rounded-lg">
              <CheckCircle2 className="h-5 w-5 mx-auto text-success mb-1" />
              <p className="text-lg font-bold text-text">
                {challenge.completion_count}
              </p>
              <p className="text-xs text-text-muted">Completed</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>Ends in: {getTimeRemaining()}</span>
            <span>
              {new Date(challenge.ends_at).toLocaleDateString()}
            </span>
          </div>

          {/* Actions */}
          {!isJoined && onJoin && challenge.status === "active" && (
            <Button
              variant="primary"
              className="w-full"
              onClick={async () => {
                await onJoin();
                setShowDetails(false);
              }}
              disabled={joining}
              leftIcon={
                joining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Target className="h-4 w-4" />
                )
              }
            >
              {joining ? "Joining..." : "Join Challenge"}
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
}
