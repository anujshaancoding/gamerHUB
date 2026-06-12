"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target, User, Globe, Award, Clock } from "lucide-react";
import { proxyAssetUrl } from "@/lib/tracker/valorant-assets";
import type { PlayerInsights } from "@/lib/tracker/types";
import { useState } from "react";

const REGION_LABELS: Record<string, string> = {
  na: "North America",
  eu: "Europe",
  ap: "Asia Pacific",
  kr: "Korea",
  latam: "Latin America",
  br: "Brazil",
};

function formatPlaytime(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function ProfileHeader({ insights }: { insights: PlayerInsights }) {
  const {
    riotId, region, rank, peakRank, level, matchesPlayed, wins, losses,
    winRate, summary, fromMock, mainAgentId, mainAgentName, playerCard,
    kd, acs, adr, kast, playtimeMinutes, currentAct,
  } = insights;
  const [avatarError, setAvatarError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  // Prefer the real Riot player card small art for the avatar.
  // Fall back to the main agent portrait through our asset proxy.
  const avatarSrc = playerCard?.small && !avatarError
    ? playerCard.small
    : proxyAssetUrl("agent", mainAgentId);

  // Use the wide card as a banner backdrop when available.
  const bannerSrc = playerCard?.wide && !bannerError ? playerCard.wide : null;

  const [name, tag] = riotId.split("#");
  const regionLabel = REGION_LABELS[region?.toLowerCase()] ?? region?.toUpperCase() ?? "";

  return (
    <Card variant="elevated" className="overflow-hidden p-0">
      {/* Banner */}
      <div className="relative h-28 sm:h-36 overflow-hidden">
        {bannerSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            onError={() => setBannerError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-surface-light" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
      </div>

      <div className="relative px-4 pb-5 sm:px-6">
        {/* Avatar + identity */}
        <div className="-mt-14 flex items-end gap-3 sm:-mt-16 sm:gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-surface bg-surface-light shadow-xl sm:h-28 sm:w-28">
            {avatarError && !playerCard?.small ? (
              <div className="flex h-full w-full items-center justify-center text-text-muted">
                <User className="h-8 w-8" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={`${name} player card`}
                className="h-full w-full object-cover"
                onError={() => setAvatarError(true)}
              />
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-text sm:text-2xl">
                {name}
                <span className="text-text-muted">#{tag}</span>
              </h2>
              {fromMock && (
                <Badge variant="outline" size="sm">Demo data</Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted sm:text-sm">
              {regionLabel && (
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-light/40 px-1.5 py-0.5">
                  <Globe className="h-3 w-3" />
                  {regionLabel}
                </span>
              )}
              <span>Level {level}</span>
              <span>Mains <span className="font-semibold text-primary">{mainAgentName}</span></span>
            </div>
          </div>
        </div>

        {/* Rank row */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-warning">
            <Trophy className="h-3.5 w-3.5" />
            <span className="font-semibold">{rank}</span>
          </span>
          {peakRank && peakRank !== rank && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-primary">
              <Award className="h-3.5 w-3.5" />
              <span>Peak <span className="font-semibold">{peakRank}</span></span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <span className="font-semibold text-text">{matchesPlayed}</span> matches
            <span className="text-text-muted">({wins}W / {losses}L)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span className="font-semibold text-text">{winRate}%</span> WR
          </span>
          {playtimeMinutes > 0 && (
            <span className="inline-flex items-center gap-1.5 text-text-secondary">
              <Clock className="h-3.5 w-3.5 text-text-muted" />
              {formatPlaytime(playtimeMinutes)}
            </span>
          )}
          {currentAct && (
            <span className="text-xs text-text-muted self-center">
              · stats for <span className="font-mono">{currentAct}</span>
            </span>
          )}
        </div>

        {/* Headline */}
        <p className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-text">
          <Target className="mr-2 inline h-4 w-4 text-primary" />
          {summary.headline}
        </p>

        {/* Raw stat tiles — K/D, ACS, KAST, ADR */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <BigStat label="K/D" value={kd.toFixed(2)} tone={kd >= 1.1 ? "success" : kd >= 0.9 ? "warning" : "error"} />
          <BigStat label="ACS" value={acs.toString()} tone={acs >= 240 ? "success" : acs >= 180 ? "warning" : "error"} />
          <BigStat label="KAST" value={`${kast}%`} tone={kast >= 70 ? "success" : kast >= 55 ? "warning" : "error"} />
          <BigStat label="ADR" value={adr.toString()} tone={adr >= 150 ? "success" : adr >= 120 ? "warning" : "error"} />
        </div>

        {/* Strengths/Decent/Weaknesses */}
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="Strengths" value={summary.strongCount} tone="success" />
          <Stat label="Decent" value={summary.decentCount} tone="warning" />
          <Stat label="Weaknesses" value={summary.weakCount} tone="error" />
        </div>
      </div>
    </Card>
  );
}

function BigStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "error";
}) {
  const cls = {
    success: "border-success/30 bg-success/5 text-success",
    warning: "border-warning/30 bg-warning/5 text-warning",
    error: "border-error/30 bg-error/5 text-error",
  }[tone];
  return (
    <div className={`rounded-lg border px-3 py-3 text-center ${cls}`}>
      <p className="text-2xl font-bold tabular-nums sm:text-3xl">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </p>
    </div>
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
