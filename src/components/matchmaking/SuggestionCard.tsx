"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserPlus, MessageSquare, Star, Zap } from "lucide-react";
import { formatSkillRating, getSkillColor } from "@/lib/hooks/useMatchmaking";
import { cn } from "@/lib/utils";

interface MatchFactors {
  skillBalance: number;
  playstyleCompatibility: number;
  roleComplementarity: number;
  communicationMatch: number;
  scheduleOverlap: number;
}

interface SuggestionCardProps {
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    skillRating: number;
    preferredRoles?: string[];
  };
  compatibilityScore: number;
  reasoning: string;
  matchFactors: MatchFactors;
  type: "teammate" | "opponent";
  onAction?: () => void;
  actionLabel?: string;
  isLoading?: boolean;
}

export function SuggestionCard({
  user,
  compatibilityScore,
  reasoning,
  matchFactors,
  type,
  onAction,
  actionLabel,
  isLoading,
}: SuggestionCardProps) {
  const skillRank = formatSkillRating(user.skillRating);
  const skillColor = getSkillColor(user.skillRating);

  const factorItems = [
    { label: "Skill Balance", value: matchFactors.skillBalance },
    { label: "Playstyle", value: matchFactors.playstyleCompatibility },
    { label: "Roles", value: matchFactors.roleComplementarity },
    { label: "Communication", value: matchFactors.communicationMatch },
  ].filter((f) => f.value > 0);

  return (
    <Card className="p-4 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link href={`/profile/${user.username}`}>
          <Avatar className="h-12 w-12 border-2 border-zinc-700">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-purple-600 flex items-center justify-center text-white">
                {user.username[0].toUpperCase()}
              </div>
            )}
          </Avatar>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/profile/${user.username}`}
              className="font-semibold text-white hover:text-purple-400"
            >
              {user.displayName || user.username}
            </Link>
            <Badge variant="outline" className={cn("text-xs", skillColor)}>
              {skillRank}
            </Badge>
          </div>

          {/* Compatibility Score */}
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">
              {compatibilityScore}% {type === "teammate" ? "Compatible" : "Match"}
            </span>
          </div>

          {/* AI Reasoning */}
          <p className="text-sm text-zinc-400 mb-3">{reasoning}</p>

          {/* Match Factors */}
          <div className="grid grid-cols-2 gap-2">
            {factorItems.map((factor) => (
              <div key={factor.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">{factor.label}</span>
                  <span className="text-zinc-400">{factor.value}%</span>
                </div>
                <Progress
                  value={factor.value}
                  className="h-1 bg-zinc-800"
                />
              </div>
            ))}
          </div>

          {/* Roles */}
          {user.preferredRoles && user.preferredRoles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {user.preferredRoles.slice(0, 3).map((role) => (
                <Badge
                  key={role}
                  variant="outline"
                  className="text-xs bg-zinc-800/50 text-zinc-400"
                >
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action */}
        {onAction && (
          <Button
            onClick={onAction}
            disabled={isLoading}
            size="sm"
            className={cn(
              type === "teammate"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-orange-600 hover:bg-orange-700"
            )}
          >
            {type === "teammate" ? (
              <UserPlus className="h-4 w-4 mr-1" />
            ) : (
              <Zap className="h-4 w-4 mr-1" />
            )}
            {actionLabel || (type === "teammate" ? "Invite" : "Challenge")}
          </Button>
        )}
      </div>
    </Card>
  );
}
