"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { ProfileHeader } from "@/components/tracker/profile-header";
import { CategorySection } from "@/components/tracker/category-section";
import { FavoriteWeapons } from "@/components/tracker/favorite-weapons";
import { NotFoundCard } from "@/components/tracker/not-found-card";
import type {
  PlayerInsights,
  StatCategory,
  TrackerLookupResponse,
  LookupError,
} from "@/lib/tracker/types";

const ORDER: StatCategory[] = ["aim", "gamesense", "role", "map", "utility", "economy"];

export default function ValorantPlayerPage() {
  const params = useParams<{ name: string; tag: string }>();
  const router = useRouter();
  const name = decodeURIComponent(params.name);
  const tag = decodeURIComponent(params.tag);
  const riotId = `${name}#${tag}`;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LookupError | null>(null);
  const [insights, setInsights] = useState<PlayerInsights | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInsights(null);
    try {
      const res = await fetch(
        `/api/tracker/valorant?riotId=${encodeURIComponent(riotId)}`
      );
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
  }, [riotId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const grouped = insights
    ? ORDER.reduce(
        (acc, cat) => {
          acc[cat] = insights.findings.filter((f) => f.category === cat);
          return acc;
        },
        {} as Record<StatCategory, PlayerInsights["findings"]>
      )
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6">
      {/* Back link */}
      <div>
        <Link
          href="/find-gamers?tab=player-lookup"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Player Lookup
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <Card className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Analyzing <span className="font-mono text-text">{riotId}</span>…</span>
          </div>
        </Card>
      )}

      {/* Error */}
      {!loading && error && (
        <NotFoundCard
          error={error}
          submittedId={riotId}
          onTrySample={(id) => {
            const [n, t] = id.split("#");
            router.push(
              `/tracker/valorant/${encodeURIComponent(n)}/${encodeURIComponent(t)}`
            );
          }}
          onRetry={fetchInsights}
          kind="valorant"
        />
      )}

      {/* Full insights */}
      {!loading && insights && grouped && (
        <div className="space-y-6">
          <ProfileHeader insights={insights} />
          <FavoriteWeapons weapons={insights.favoriteWeapons} />
          {ORDER.map((cat) => (
            <CategorySection key={cat} category={cat} findings={grouped[cat]} />
          ))}
          <p className="text-center text-xs text-text-muted">
            Insights generated {new Date(insights.generatedAt).toLocaleString()}
          </p>
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={fetchInsights}>
              Refresh stats
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
