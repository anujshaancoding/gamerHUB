"use client";

import { useMemo, useState } from "react";
import { Share2, Copy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RANK_PROFILES,
  REGION_META,
  rowsFor,
  percentileFor,
  type RegionKey,
} from "@/lib/features/tools/rank-distribution";
import { useAuth } from "@/lib/hooks/useAuth";
import { useActionGate } from "@/components/shared/auth/auth-gate-provider";
import { trackCtaClick } from "@/lib/analytics/cta-click";
import { CTA_SOURCES } from "@/lib/analytics/sources";

const REGIONS: RegionKey[] = ["india", "global"];

export function RankPercentile() {
  const profile = RANK_PROFILES[0];
  const [region, setRegion] = useState<RegionKey>("india");
  const rows = useMemo(() => rowsFor(profile, region), [profile, region]);
  const [tier, setTier] = useState(rows[Math.floor(rows.length / 2)].tier);
  const [copied, setCopied] = useState(false);

  const { user } = useAuth();
  const { openAuthGate } = useActionGate();

  const result = useMemo(() => percentileFor(rows, tier), [rows, tier]);
  const totalPct = rows.reduce((s, r) => s + r.pct, 0);
  const meta = REGION_META[region];

  function shareUrl(): string {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/tools/rank-percentile`;
  }

  async function share() {
    const text = `I'm above ${result.below.toFixed(1)}% of ${meta.label} Valorant players (${tier}). Where do you land?`;
    const url = shareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Valorant rank percentile", text, url });
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* ignore */
      }
    }
  }

  function saveResult() {
    if (!user) {
      trackCtaClick(CTA_SOURCES.rank_percentile_save);
      openAuthGate({
        reason: "Create a free profile to save your rank percentile and compare against ggLobby players",
        source: CTA_SOURCES.rank_percentile_save,
        redirectTo: "/tools/rank-percentile",
      });
      return;
    }
    window.location.href = "/settings/games";
  }

  return (
    <div className="space-y-5">
      {/* Region toggle */}
      <div className="flex gap-1 rounded-lg bg-surface-light p-1 self-start w-fit">
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              r === region ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text-secondary",
            )}
          >
            {REGION_META[r].label}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-1">
          Your rank
        </span>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
        >
          {rows.map((r) => (
            <option key={r.tier} value={r.tier}>
              {r.tier}
            </option>
          ))}
        </select>
      </label>

      {/* Result card */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
          You&apos;re above
        </p>
        <p className="text-4xl font-bold text-text mt-1 font-mono">{result.below.toFixed(1)}%</p>
        <p className="text-sm text-text-secondary mt-1">
          of {meta.label} {profile.label} ranked players. Same rank as you: {result.at.toFixed(1)}%,
          above you: {result.above.toFixed(1)}%.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={share}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Share my result"}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl());
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-text"
          >
            <Copy className="h-3.5 w-3.5" /> Copy link
          </button>
          <button
            onClick={saveResult}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-text"
          >
            {user ? "Save to my profile" : "Save my result — free account"}
          </button>
        </div>
      </div>

      {/* Distribution chart */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-text">
            {meta.label} {profile.label} rank distribution
          </h2>
          {meta.estimate && (
            <span className="text-[10px] uppercase tracking-wider text-amber-400/90 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5">
              Estimate
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          {rows.map((r) => {
            const widthPct = (r.pct / totalPct) * 100;
            const isYou = r.tier === tier;
            return (
              <div key={r.tier} className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-xs w-32 flex-shrink-0",
                    isYou ? "text-primary font-semibold" : "text-text-secondary",
                  )}
                >
                  {r.tier}
                </span>
                <div className="flex-1 h-5 rounded-full bg-surface-light overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", isYou ? "bg-primary" : "bg-primary/40")}
                    style={{ width: `${Math.max(widthPct * 4, 1)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-text-muted w-12 text-right">
                  {r.pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-text-dim leading-relaxed">{meta.note}</p>
      </div>
    </div>
  );
}
