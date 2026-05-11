"use client";

import { useState, useCallback, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Trophy, TrendingUp, Target, Clock } from "lucide-react";
import { CategorySection } from "./category-section";
import { NotFoundCard } from "./not-found-card";
import type { Cs2Insights } from "@/lib/tracker/cs2-types";
import type { LookupError, StatCategory } from "@/lib/tracker/types";

const ORDER: StatCategory[] = ["aim", "gamesense", "role", "map", "utility", "economy"];
const SAMPLES = ["gabelogannewell", "76561197960287930", "th3whitewolf"];

export function Cs2Client() {
  const [steamId, setSteamId] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LookupError | null>(null);
  const [insights, setInsights] = useState<Cs2Insights | null>(null);

  const lookup = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setInsights(null);
    setSubmittedId(trimmed);
    try {
      const res = await fetch(`/api/tracker/cs2?steamId=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!data.ok || !data.insights) {
        setError(data.error ?? { code: "UPSTREAM_ERROR", message: "Could not fetch insights." });
      } else {
        setInsights(data.insights as Cs2Insights);
      }
    } catch {
      setError({ code: "UPSTREAM_ERROR", message: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  }, []);

  const trySample = (id: string) => {
    setSteamId(id);
    lookup(id);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    lookup(steamId);
  };

  const grouped = insights
    ? (ORDER.reduce(
        (acc, cat) => {
          acc[cat] = insights.findings.filter((f) => f.category === cat);
          return acc;
        },
        {} as Record<StatCategory, Cs2Insights["findings"]>
      ))
    : null;

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="p-4 sm:p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="text"
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            placeholder="Paste your steamcommunity.com URL, vanity, or SteamID64"
            disabled={loading}
            className="flex-1"
            aria-label="Steam ID"
          />
          <Button type="submit" disabled={loading} className="sm:w-auto">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing</>
            ) : (
              <><Search className="mr-2 h-4 w-4" />Analyze</>
            )}
          </Button>
        </form>

        {!insights && !loading && !error ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span>Try:</span>
            {SAMPLES.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => trySample(id)}
                className="rounded-md border border-border bg-surface-light/40 px-2 py-1 font-mono text-xs text-text-secondary hover:border-primary/50 hover:text-text"
              >
                {id}
              </button>
            ))}
          </div>
        ) : null}

        <p className="mt-3 text-[11px] text-text-muted">
          CS2 stats require the Steam profile to be public. <strong>Privacy → Game Details: Public</strong>.
        </p>
      </Card>

      {error ? (
        <NotFoundCard
          error={error}
          submittedId={submittedId}
          onTrySample={trySample}
          onRetry={() => lookup(submittedId)}
          kind="cs2"
        />
      ) : null}

      {insights && grouped ? (
        <div className="space-y-6">
          <Cs2ProfileHeader insights={insights} />
          {ORDER.map((cat) => (
            <CategorySection key={cat} category={cat} findings={grouped[cat]} />
          ))}
          <p className="text-center text-xs text-text-muted">
            Insights generated {new Date(insights.generatedAt).toLocaleString()}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Cs2ProfileHeader({ insights }: { insights: Cs2Insights }) {
  const { displayName, avatarUrl, hoursPlayed, matchesPlayed, winRate, summary, fromMock } = insights;
  return (
    <Card variant="elevated" className="overflow-hidden p-0">
      <div className="relative h-20 bg-gradient-to-br from-primary/30 via-primary/10 to-surface-light sm:h-24" />
      <div className="relative px-4 pb-5 sm:px-6">
        <div className="-mt-10 flex items-end gap-3 sm:-mt-12">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-surface bg-surface-light shadow-xl sm:h-24 sm:w-24">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-text-muted">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-text sm:text-2xl">{displayName}</h2>
              {fromMock ? <Badge variant="outline" size="sm">Demo data</Badge> : null}
            </div>
            <p className="text-xs text-text-muted sm:text-sm">CS2 player</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-warning" /> Premier rating not exposed by Steam
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {hoursPlayed.toLocaleString()} hrs
          </span>
          <span>{matchesPlayed.toLocaleString()} matches</span>
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

function Stat({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "error" }) {
  const cls = {
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    error: "border-error/30 bg-error/10 text-error",
  }[tone];
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${cls}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}
