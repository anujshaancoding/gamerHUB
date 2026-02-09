"use client";

import { useState } from "react";
import { SingleEliminationBracket } from "./single-elimination";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Trophy, Clock, Play, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  TournamentMatchWithTeams,
  TournamentFormat,
  TournamentSettings,
} from "@/types/database";

interface BracketContainerProps {
  matches: TournamentMatchWithTeams[];
  format: TournamentFormat;
  settings?: TournamentSettings | null;
  isOrganizer?: boolean;
  onMatchUpdate?: (
    matchId: string,
    updates: {
      status?: string;
      team1_score?: number;
      team2_score?: number;
      winner_id?: string;
    }
  ) => Promise<{ error?: string }>;
  className?: string;
}

export function BracketContainer({
  matches,
  format,
  isOrganizer = false,
  onMatchUpdate,
  className,
}: BracketContainerProps) {
  const [selectedMatch, setSelectedMatch] =
    useState<TournamentMatchWithTeams | null>(null);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleMatchClick = (match: TournamentMatchWithTeams) => {
    setSelectedMatch(match);
    setTeam1Score(match.team1_score || 0);
    setTeam2Score(match.team2_score || 0);
  };

  const handleCloseModal = () => {
    setSelectedMatch(null);
    setTeam1Score(0);
    setTeam2Score(0);
  };

  const handleSubmitResult = async () => {
    if (!selectedMatch || !onMatchUpdate) return;

    const winnerId =
      team1Score > team2Score
        ? selectedMatch.team1_id
        : team2Score > team1Score
          ? selectedMatch.team2_id
          : null;

    if (!winnerId) {
      return; // Require a winner
    }

    setSubmitting(true);
    const result = await onMatchUpdate(selectedMatch.id, {
      team1_score: team1Score,
      team2_score: team2Score,
      winner_id: winnerId,
      status: "completed",
    });
    setSubmitting(false);

    if (!result.error) {
      handleCloseModal();
    }
  };

  const handleStartMatch = async () => {
    if (!selectedMatch || !onMatchUpdate) return;
    setSubmitting(true);
    await onMatchUpdate(selectedMatch.id, { status: "in_progress" });
    setSubmitting(false);
  };

  return (
    <div className={cn("relative", className)}>
      {format === "single_elimination" && (
        <SingleEliminationBracket
          matches={matches}
          onMatchClick={handleMatchClick}
          isOrganizer={isOrganizer}
        />
      )}

      {format === "double_elimination" && (
        <div className="p-8 text-center text-text-muted">
          Double elimination brackets coming soon
        </div>
      )}

      {format === "round_robin" && (
        <div className="p-8 text-center text-text-muted">
          Round robin format coming soon
        </div>
      )}

      {/* Match Detail Modal */}
      <Modal
        isOpen={!!selectedMatch}
        onClose={handleCloseModal}
        title="Match Details"
      >
        {selectedMatch && (
          <div className="space-y-6">
            {/* Match Status */}
            <div className="flex items-center justify-center">
              <Badge
                variant={
                  selectedMatch.status === "completed"
                    ? "success"
                    : selectedMatch.status === "in_progress"
                      ? "warning"
                      : "default"
                }
              >
                {selectedMatch.status.replace("_", " ")}
              </Badge>
            </div>

            {/* Teams */}
            <div className="flex items-center justify-between gap-4">
              {/* Team 1 */}
              <div className="flex-1 text-center">
                {selectedMatch.team1 ? (
                  <div className="space-y-2">
                    <Avatar
                      src={selectedMatch.team1.clan?.avatar_url}
                      alt={selectedMatch.team1.clan?.name || "Team 1"}
                      size="xl"
                      className="mx-auto"
                      fallback={selectedMatch.team1.clan?.tag}
                    />
                    <p className="font-medium text-text">
                      {selectedMatch.team1.clan?.name}
                    </p>
                    <p className="text-sm text-text-muted">
                      Seed #{selectedMatch.team1.seed}
                    </p>
                    {selectedMatch.winner_id === selectedMatch.team1_id && (
                      <div className="flex items-center justify-center gap-1 text-success">
                        <Trophy className="h-4 w-4" />
                        <span className="text-sm">Winner</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-text-muted italic">TBD</div>
                )}
              </div>

              {/* VS */}
              <div className="text-2xl font-bold text-text-muted">VS</div>

              {/* Team 2 */}
              <div className="flex-1 text-center">
                {selectedMatch.team2 ? (
                  <div className="space-y-2">
                    <Avatar
                      src={selectedMatch.team2.clan?.avatar_url}
                      alt={selectedMatch.team2.clan?.name || "Team 2"}
                      size="xl"
                      className="mx-auto"
                      fallback={selectedMatch.team2.clan?.tag}
                    />
                    <p className="font-medium text-text">
                      {selectedMatch.team2.clan?.name}
                    </p>
                    <p className="text-sm text-text-muted">
                      Seed #{selectedMatch.team2.seed}
                    </p>
                    {selectedMatch.winner_id === selectedMatch.team2_id && (
                      <div className="flex items-center justify-center gap-1 text-success">
                        <Trophy className="h-4 w-4" />
                        <span className="text-sm">Winner</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-text-muted italic">TBD</div>
                )}
              </div>
            </div>

            {/* Score Display or Input */}
            {selectedMatch.status === "completed" && (
              <div className="flex items-center justify-center gap-8 text-4xl font-bold">
                <span
                  className={cn(
                    selectedMatch.winner_id === selectedMatch.team1_id
                      ? "text-success"
                      : "text-text-muted"
                  )}
                >
                  {selectedMatch.team1_score}
                </span>
                <span className="text-text-muted">-</span>
                <span
                  className={cn(
                    selectedMatch.winner_id === selectedMatch.team2_id
                      ? "text-success"
                      : "text-text-muted"
                  )}
                >
                  {selectedMatch.team2_score}
                </span>
              </div>
            )}

            {/* Organizer Actions */}
            {isOrganizer &&
              selectedMatch.team1_id &&
              selectedMatch.team2_id &&
              selectedMatch.status !== "completed" && (
                <div className="space-y-4 pt-4 border-t border-border">
                  {selectedMatch.status === "pending" ||
                  selectedMatch.status === "scheduled" ||
                  selectedMatch.status === "ready" ? (
                    <Button
                      onClick={handleStartMatch}
                      disabled={submitting}
                      className="w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Match
                    </Button>
                  ) : null}

                  {selectedMatch.status === "in_progress" && (
                    <div className="space-y-4">
                      <p className="text-sm text-text-muted text-center">
                        Enter match score
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-text-muted mb-1">
                            {selectedMatch.team1?.clan?.tag}
                          </p>
                          <input
                            type="number"
                            min="0"
                            value={team1Score}
                            onChange={(e) =>
                              setTeam1Score(parseInt(e.target.value) || 0)
                            }
                            className="w-16 h-12 text-2xl text-center bg-surface border border-border rounded-lg"
                          />
                        </div>
                        <span className="text-text-muted">-</span>
                        <div className="text-center">
                          <p className="text-sm text-text-muted mb-1">
                            {selectedMatch.team2?.clan?.tag}
                          </p>
                          <input
                            type="number"
                            min="0"
                            value={team2Score}
                            onChange={(e) =>
                              setTeam2Score(parseInt(e.target.value) || 0)
                            }
                            className="w-16 h-12 text-2xl text-center bg-surface border border-border rounded-lg"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleSubmitResult}
                        disabled={submitting || team1Score === team2Score}
                        className="w-full"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Submit Result
                      </Button>
                      {team1Score === team2Score && (
                        <p className="text-sm text-warning text-center">
                          Scores cannot be tied
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Scheduled Time */}
            {selectedMatch.scheduled_at && (
              <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                <Clock className="h-4 w-4" />
                Scheduled:{" "}
                {new Date(selectedMatch.scheduled_at).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
