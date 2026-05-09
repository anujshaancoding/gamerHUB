"use client";

import { useState, useCallback, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import { ProfileHeader } from "./profile-header";
import { CategorySection } from "./category-section";
import { FavoriteWeapons } from "./favorite-weapons";
import { NotFoundCard } from "./not-found-card";
import type {
  PlayerInsights,
  StatCategory,
  TrackerLookupResponse,
  LookupError,
} from "@/lib/tracker/types";

const ORDER: StatCategory[] = ["aim", "gamesense", "role", "map", "utility", "economy"];
const SAMPLE_IDS = ["Phoenix#NA1", "Jett#1234", "Sage#APAC1", "Omen#EU01"];

export function ValorantClient() {
  const [riotId, setRiotId] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LookupError | null>(null);
  const [insights, setInsights] = useState<PlayerInsights | null>(null);

  const lookup = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setInsights(null);
    setSubmittedId(trimmed);
    try {
      const res = await fetch(`/api/tracker/valorant?riotId=${encodeURIComponent(trimmed)}`);
      const data = (await res.json()) as TrackerLookupResponse;
      if (!data.ok || !data.insights) {
        setError(
          data.error ?? {
            code: "UPSTREAM_ERROR",
            message: "Could not fetch insights.",
          }
        );
      } else {
        setInsights(data.insights);
      }
    } catch {
      setError({ code: "UPSTREAM_ERROR", message: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    lookup(riotId);
  };

  const trySample = (id: string) => {
    setRiotId(id);
    lookup(id);
  };

  const grouped = insights
    ? (ORDER.reduce(
        (acc, cat) => {
          acc[cat] = insights.findings.filter((f) => f.category === cat);
          return acc;
        },
        {} as Record<StatCategory, PlayerInsights["findings"]>
      ))
    : null;

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="p-4 sm:p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="text"
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            placeholder="PlayerName#TAG (e.g. Phoenix#NA1)"
            disabled={loading}
            className="flex-1"
            aria-label="Riot ID"
          />
          <Button type="submit" disabled={loading} className="sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze
              </>
            )}
          </Button>
        </form>

        {!insights && !loading && !error ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span>Try:</span>
            {SAMPLE_IDS.map((id) => (
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
      </Card>

      {error ? (
        <NotFoundCard
          error={error}
          riotId={submittedId}
          onTrySample={trySample}
          onRetry={() => lookup(submittedId)}
        />
      ) : null}

      {insights && grouped ? (
        <div className="space-y-6">
          <ProfileHeader insights={insights} />
          <FavoriteWeapons weapons={insights.favoriteWeapons} />
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
