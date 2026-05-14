"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { RANK_PROFILES, percentileFor } from "@/lib/tools/rank-distribution";

export function RankPercentile() {
  const [gameIdx, setGameIdx] = useState(0);
  const profile = RANK_PROFILES[gameIdx];
  const [tier, setTier] = useState(profile.rows[Math.floor(profile.rows.length / 2)].tier);

  const result = useMemo(() => percentileFor(profile, tier), [profile, tier]);
  const totalPct = profile.rows.reduce((s, r) => s + r.pct, 0);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-lg bg-surface-light p-1 self-start w-fit">
        {RANK_PROFILES.map((p, i) => (
          <button
            key={p.game}
            onClick={() => {
              setGameIdx(i);
              setTier(RANK_PROFILES[i].rows[Math.floor(RANK_PROFILES[i].rows.length / 2)].tier);
            }}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              i === gameIdx ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text-secondary"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-1">Your rank</span>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
        >
          {profile.rows.map((r) => (
            <option key={r.tier} value={r.tier}>{r.tier}</option>
          ))}
        </select>
      </label>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">You&apos;re above</p>
        <p className="text-4xl font-bold text-text mt-1 font-mono">{result.below.toFixed(1)}%</p>
        <p className="text-sm text-text-secondary mt-1">
          of {profile.label} ranked players. Same rank as you: {result.at.toFixed(1)}%, above you: {result.above.toFixed(1)}%.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-text mb-3">{profile.label} rank distribution</h2>
        <div className="space-y-1.5">
          {profile.rows.map((r) => {
            const widthPct = (r.pct / totalPct) * 100;
            const isYou = r.tier === tier;
            return (
              <div key={r.tier} className="flex items-center gap-3">
                <span className={cn("text-xs w-32 flex-shrink-0", isYou ? "text-primary font-semibold" : "text-text-secondary")}>
                  {r.tier}
                </span>
                <div className="flex-1 h-5 rounded-full bg-surface-light overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", isYou ? "bg-primary" : "bg-primary/40")}
                    style={{ width: `${Math.max(widthPct * 4, 1)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-text-muted w-12 text-right">{r.pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
