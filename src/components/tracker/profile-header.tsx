"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target, User } from "lucide-react";
import { proxyAssetUrl } from "@/lib/tracker/valorant-assets";
import type { PlayerInsights } from "@/lib/tracker/types";
import { useState } from "react";

export function ProfileHeader({ insights }: { insights: PlayerInsights }) {
  const { riotId, rank, level, matchesPlayed, winRate, summary, fromMock, mainAgentId, mainAgentName } = insights;
  const [agentImgError, setAgentImgError] = useState(false);
  const avatarSrc = proxyAssetUrl("agent", mainAgentId);
  const [name, tag] = riotId.split("#");

  return (
    <Card variant="elevated" className="overflow-hidden p-0">
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-br from-primary/30 via-primary/10 to-surface-light sm:h-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)]" />
      </div>

      <div className="relative px-4 pb-5 sm:px-6">
        {/* Avatar */}
        <div className="-mt-12 flex items-end gap-3 sm:-mt-14 sm:gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-surface bg-surface-light shadow-xl sm:h-24 sm:w-24">
            {agentImgError ? (
              <div className="flex h-full w-full items-center justify-center text-text-muted">
                <User className="h-8 w-8" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={`${mainAgentName} portrait`}
                className="h-full w-full object-cover"
                onError={() => setAgentImgError(true)}
              />
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-text sm:text-2xl">
                {name}
                <span className="text-text-muted">#{tag}</span>
              </h2>
              {fromMock ? (
                <Badge variant="outline" size="sm">
                  Demo data
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-text-muted sm:text-sm">
              Mains <span className="font-semibold text-primary">{mainAgentName}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-warning" /> {rank}
          </span>
          <span>Level {level}</span>
          <span>{matchesPlayed} matches</span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-success" /> {winRate}% WR
          </span>
        </div>

        <p className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-text">
          <Target className="mr-2 inline h-4 w-4 text-primary" />
          {summary.headline}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="Strengths" value={summary.strongCount} tone="success" />
          <Stat label="Decent" value={summary.decentCount} tone="warning" />
          <Stat label="Weaknesses" value={summary.weakCount} tone="error" />
        </div>
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "error";
}) {
  const cls = {
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    error: "border-error/30 bg-error/10 text-error",
  }[tone];
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${cls}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </p>
    </div>
  );
}
