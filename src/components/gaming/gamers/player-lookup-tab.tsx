"use client";

import { useState, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ArrowRight, Trophy, TrendingUp, User } from "lucide-react";
import { Button, Input, Card, Badge } from "@/components/ui";
import { NotFoundCard } from "@/components/gaming/tracker/not-found-card";
import { proxyAssetUrl } from "@/lib/tracker/valorant-assets";
import { isValidRiotId } from "@/lib/tracker/fetchers";
import type {
  PlayerInsights,
  TrackerLookupResponse,
  LookupError,
} from "@/lib/tracker/types";

const SAMPLE_IDS = ["TenZ#SEN", "Asuna#100T", "ScreaM#EUNE", "Phoenix#NA1"];

export function PlayerLookupTab() {
  const router = useRouter();
  const [riotId, setRiotId] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LookupError | null>(null);
  const [preview, setPreview] = useState<PlayerInsights | null>(null);

  const lookup = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;

    if (!isValidRiotId(trimmed)) {
      setError({
        code: "INVALID_FORMAT",
        message:
          "Use the format PlayerName#TAG (e.g. TenZ#SEN). Riot IDs are case-sensitive.",
      });
      setPreview(null);
      setSubmittedId(trimmed);
      return;
    }

    setLoading(true);
    setError(null);
    setPreview(null);
    setSubmittedId(trimmed);

    try {
      const res = await fetch(
        `/api/tracker/valorant?riotId=${encodeURIComponent(trimmed)}`
      );
      const data = (await res.json()) as TrackerLookupResponse;
      if (!data.ok || !data.insights) {
        setError(
          data.error ?? {
            code: "UPSTREAM_ERROR",
            message: "Could not fetch player stats.",
          }
        );
      } else {
        setPreview(data.insights);
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

  const openFullProfile = () => {
    if (!preview) return;
    const [name, tag] = preview.riotId.split("#");
    router.push(
      `/tracker/valorant/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div>
        <h2 className="text-lg font-semibold text-text">
          Look up any Valorant player
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Search by Riot ID (Name#TAG) to see rank, recent performance, and
          detailed insights — works for any public profile.
        </p>
      </div>

      {/* Search */}
      <Card className="p-4 sm:p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="text"
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            placeholder="PlayerName#TAG (e.g. TenZ#SEN)"
            disabled={loading}
            className="flex-1"
            leftIcon={<Search className="h-4 w-4" />}
            aria-label="Riot ID"
          />
          <Button type="submit" disabled={loading} variant="primary">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </form>

        {!preview && !loading && !error && (
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
        )}
      </Card>

      {/* Error */}
      {error && (
        <NotFoundCard
          error={error}
          submittedId={submittedId}
          onTrySample={trySample}
          onRetry={() => lookup(submittedId)}
          kind="valorant"
        />
      )}

      {/* Preview card — click to open full page */}
      {preview && <PreviewCard insights={preview} onOpen={openFullProfile} />}
    </div>
  );
}

// ─── Preview Card ──────────────────────────────────────────────
function PreviewCard({
  insights,
  onOpen,
}: {
  insights: PlayerInsights;
  onOpen: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [name, tag] = insights.riotId.split("#");

  // Prefer the player's Riot card art; fall back to main agent portrait.
  const avatarSrc = insights.playerCard?.small && !imgError
    ? insights.playerCard.small
    : proxyAssetUrl("agent", insights.mainAgentId);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full text-left"
      aria-label={`Open full profile for ${insights.riotId}`}
    >
      <Card className="p-4 sm:p-5 transition-all hover:border-primary/50 hover:shadow-lg">
        <div className="flex items-start gap-4">
          {/* Player card avatar */}
          <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-light">
            {imgError && !insights.playerCard?.small ? (
              <div className="flex h-full w-full items-center justify-center text-text-muted">
                <User className="h-7 w-7" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={`${name} player card`}
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            )}
          </div>

          {/* Identity + stats */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-text sm:text-xl truncate">
                {name}
                <span className="text-text-muted">#{tag}</span>
              </h3>
              {insights.fromMock && (
                <Badge variant="outline" size="sm">Demo data</Badge>
              )}
            </div>

            <p className="text-xs text-text-muted mt-0.5">
              Mains <span className="font-semibold text-primary">{insights.mainAgentName}</span>
              {insights.region && (
                <span> · {insights.region.toUpperCase()}</span>
              )}
              {insights.currentAct && (
                <span> · {insights.currentAct}</span>
              )}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-warning" />
                {insights.rank}
              </span>
              <span>Level {insights.level}</span>
              <span>{insights.matchesPlayed} matches</span>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-success" />
                {insights.winRate}% WR
              </span>
            </div>

            {/* Raw stat row */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <MiniStat label="K/D" value={insights.kd.toFixed(2)} />
              <MiniStat label="ACS" value={insights.acs.toString()} />
              <MiniStat label="ADR" value={insights.adr.toString()} />
              <MiniStat label="HS%" value={`${insights.headshotPct.toFixed(1)}%`} />
            </div>

            <p className="mt-3 text-sm text-text line-clamp-2">
              {insights.summary.headline}
            </p>
          </div>

          {/* Desktop CTA */}
          <div className="hidden sm:flex flex-col items-end justify-between gap-2 shrink-0">
            <div className="flex gap-1.5">
              <Badge variant="success" size="sm">{insights.summary.strongCount} strong</Badge>
              <Badge variant="error"   size="sm">{insights.summary.weakCount} weak</Badge>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              View full profile <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            <Badge variant="success" size="sm">{insights.summary.strongCount} strong</Badge>
            <Badge variant="error"   size="sm">{insights.summary.weakCount} weak</Badge>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            View full profile <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Card>
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded-md border border-border bg-surface-light/40 px-2 py-1">
      <span className="font-bold text-text tabular-nums">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
    </span>
  );
}
