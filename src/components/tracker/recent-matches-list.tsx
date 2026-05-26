"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { History, User } from "lucide-react";
import { proxyAssetUrl } from "@/lib/tracker/valorant-assets";
import type { RecentMatch } from "@/lib/tracker/types";

export function RecentMatchesList({ matches }: { matches: RecentMatch[] }) {
  if (!matches.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <History className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text sm:text-lg">Recent Matches</h3>
          <p className="text-xs text-text-muted sm:text-sm">
            Last {matches.length} sampled matches in the selected act.
          </p>
        </div>
      </div>

      <Card variant="outlined" className="overflow-hidden p-0">
        <div className="divide-y divide-border">
          {matches.map((m) => (
            <MatchRow key={m.matchId} match={m} />
          ))}
        </div>
      </Card>
    </section>
  );
}

function AgentAvatar({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-light text-text-muted">
        <User className="h-4 w-4" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={proxyAssetUrl("agent", agentId)}
      alt={agentName}
      className="h-9 w-9 rounded-md object-cover bg-surface-light"
      onError={() => setErr(true)}
    />
  );
}

function MatchRow({ match }: { match: RecentMatch }) {
  const resultColor = match.won
    ? "border-l-success text-success"
    : "border-l-error text-error";

  return (
    <div className={`flex items-center gap-3 border-l-4 ${resultColor} px-3 py-3 sm:px-4`}>
      {/* Result label */}
      <div className="w-9 shrink-0 text-center">
        <p className="text-sm font-bold">{match.won ? "W" : "L"}</p>
        <p className="text-[10px] uppercase tracking-wider opacity-70">
          {match.myRoundsWon}:{match.enemyRoundsWon}
        </p>
      </div>

      {/* Agent + map */}
      <div className="flex items-center gap-2.5 min-w-0">
        <AgentAvatar agentId={match.agentId} agentName={match.agentName} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text">{match.map}</p>
          <p className="truncate text-xs text-text-muted">
            {match.agentName} · {match.mode}
            {match.durationMinutes > 0 && ` · ${match.durationMinutes}m`}
          </p>
        </div>
      </div>

      {/* Stats — right side, responsive */}
      <div className="ml-auto flex shrink-0 items-center gap-3 text-xs sm:gap-5 sm:text-sm">
        <Stat label="K/D/A" value={`${match.kills}/${match.deaths}/${match.assists}`} />
        <Stat label="K/D" value={match.kd.toFixed(2)} hideOnMobile />
        <Stat label="ACS" value={match.acs.toString()} />
        <Stat label="HS%" value={`${match.hsPct.toFixed(0)}%`} hideOnMobile />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hideOnMobile,
}: {
  label: string;
  value: string;
  hideOnMobile?: boolean;
}) {
  return (
    <div className={`text-right ${hideOnMobile ? "hidden md:block" : ""}`}>
      <p className="font-semibold tabular-nums text-text">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-text-muted sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}
