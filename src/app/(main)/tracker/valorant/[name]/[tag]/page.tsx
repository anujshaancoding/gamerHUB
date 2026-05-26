"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { ProfileHeader } from "@/components/tracker/profile-header";
import { CategorySection } from "@/components/tracker/category-section";
import { FavoriteWeapons } from "@/components/tracker/favorite-weapons";
import { NotFoundCard } from "@/components/tracker/not-found-card";
import { PerAgentTable } from "@/components/tracker/per-agent-table";
import { RecentMatchesList } from "@/components/tracker/recent-matches-list";
import { AccuracyBreakdown } from "@/components/tracker/accuracy-breakdown";
import { ActFilter } from "@/components/tracker/act-filter";
import type {
  PlayerInsights,
  StatCategory,
  TrackerLookupResponse,
  LookupError,
} from "@/lib/tracker/types";

const ORDER: StatCategory[] = ["aim", "gamesense", "role", "map", "utility", "economy"];

export default function ValorantPlayerPage() {
  const params = useParams<{ name: string; tag: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const name = decodeURIComponent(params.name);
  const tag = decodeURIComponent(params.tag);
  const riotId = `${name}#${tag}`;
  const actParam = searchParams.get("act") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LookupError | null>(null);
  const [insights, setInsights] = useState<PlayerInsights | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInsights(null);
    try {
      const url = new URL("/api/tracker/valorant", window.location.origin);
      url.searchParams.set("riotId", riotId);
      if (actParam) url.searchParams.set("act", actParam);
      const res = await fetch(url.toString());
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
  }, [riotId, actParam]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleActChange = (act: string) => {
    const url = new URLSearchParams(searchParams.toString());
    if (act) url.set("act", act);
    else url.delete("act");
    const qs = url.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/find-gamers?tab=player-lookup"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Player Lookup
        </Link>
        {insights && insights.availableActs.length > 1 && (
          <ActFilter
            acts={insights.availableActs}
            current={insights.currentAct}
            onChange={handleActChange}
          />
        )}
      </div>

      {/* Loading */}
      {loading && (
        <Card className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>
              Analyzing <span className="font-mono text-text">{riotId}</span>…
            </span>
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

          <PerAgentTable agents={insights.perAgent} />

          <RecentMatchesList matches={insights.recentMatches} />

          <AccuracyBreakdown
            accuracy={insights.accuracy}
            roles={insights.rolePerformance}
          />

          <FavoriteWeapons weapons={insights.favoriteWeapons} />

          {ORDER.map((cat) => (
            <CategorySection key={cat} category={cat} findings={grouped[cat]} />
          ))}

          <p className="text-center text-xs text-text-muted">
            Insights generated {new Date(insights.generatedAt).toLocaleString()}
          </p>
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={fetchInsights}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh stats
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
