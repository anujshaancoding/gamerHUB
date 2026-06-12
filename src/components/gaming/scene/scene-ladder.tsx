"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  ExternalLink,
  Flame,
  Sparkles,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  SCENE_PLAYERS,
  TIER_BLURB,
  TIER_LABEL,
  type SceneTier,
} from "@/lib/data/india-scene";
import { useSceneVotes } from "@/lib/features/scene/votes";

const TIERS: SceneTier[] = ["semi-pro", "amateur", "creator"];

const tierIcon: Record<SceneTier, typeof Trophy> = {
  "semi-pro": Trophy,
  amateur: Flame,
  creator: Sparkles,
};

export function SceneLadder() {
  const [activeTier, setActiveTier] = useState<SceneTier>("semi-pro");
  const { tally, user, toggle } = useSceneVotes();

  const filtered = useMemo(
    () => SCENE_PLAYERS.filter((p) => p.tier === activeTier),
    [activeTier]
  );

  const leaderboard = useMemo(() => {
    return SCENE_PLAYERS.filter((p) => p.eligible_for_promotion)
      .map((p) => ({ p, votes: tally[p.slug] ?? 0 }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);
  }, [tally]);

  const totalVotes = useMemo(
    () => Object.values(tally).reduce((acc, n) => acc + n, 0),
    [tally]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 80% at 80% 20%, rgba(0,255,136,0.16), transparent 70%), radial-gradient(50% 80% at 10% 100%, rgba(0,212,255,0.14), transparent 70%)",
          }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            India scene · below the main stage
          </span>
          <h1 className="mt-4 text-3xl font-black uppercase leading-tight tracking-tight text-text sm:text-5xl">
            The next wave of{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Indian Valorant
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-text-secondary sm:text-base">
            Academy duelists, free-agent grinders and the creators powering the
            community. Vote for who you think gets the next Tier-1 callup.
          </p>
        </div>
      </section>

      {/* Vote leaderboard */}
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Vote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">
                Next to go pro
              </h2>
              <p className="text-xs text-text-muted">
                Community picks · {totalVotes.toLocaleString()} total votes
              </p>
            </div>
          </div>
          <Badge variant="outline" size="sm">
            One vote per name
          </Badge>
        </div>
        <ol className="space-y-2">
          {leaderboard.map((row, i) => {
            const voted = !!user[row.p.slug];
            return (
              <li
                key={row.p.slug}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-light px-3 py-2.5"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                    i === 0
                      ? "bg-primary/20 text-primary"
                      : "bg-surface text-text-muted"
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/scene/${row.p.slug}`}
                    className="font-semibold text-text hover:text-primary truncate inline-block"
                  >
                    {row.p.ign}
                  </Link>
                  <div className="text-xs text-text-muted truncate">
                    {row.p.org} · {row.p.role.label}
                  </div>
                </div>
                <span className="text-sm font-bold tabular-nums text-text">
                  {row.votes.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(row.p.slug)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    voted
                      ? "bg-primary text-background"
                      : "bg-surface text-text-secondary hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  {voted ? "Voted" : "Vote"}
                </button>
              </li>
            );
          })}
          {leaderboard.length === 0 && (
            <li className="text-sm text-text-muted py-4 text-center">
              Cast a vote below to start the leaderboard.
            </li>
          )}
        </ol>
      </section>

      {/* Tier tabs */}
      <section>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {TIERS.map((t) => {
            const Icon = tierIcon[t];
            const active = activeTier === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTier(t)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-text"
                )}
              >
                <Icon className="h-4 w-4" />
                {TIER_LABEL[t]}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-xs font-bold",
                    active ? "bg-primary/20" : "bg-surface-light text-text-muted"
                  )}
                >
                  {SCENE_PLAYERS.filter((p) => p.tier === t).length}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-text-muted mb-5">{TIER_BLURB[activeTier]}</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const voted = !!user[p.slug];
            const votes = tally[p.slug] ?? 0;
            return (
              <article
                key={p.slug}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-1 hover:border-primary/50"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(70% 70% at 50% 0%, rgba(0,255,136,0.10) 0%, transparent 70%)",
                  }}
                />
                <div className="relative flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-light text-base font-black text-primary">
                    {p.ign.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/scene/${p.slug}`}
                      className="text-base font-bold text-text hover:text-primary"
                    >
                      {p.ign}
                    </Link>
                    <div className="text-xs text-text-muted truncate">
                      {p.org}
                    </div>
                  </div>
                </div>

                <div className="relative mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="outline" size="sm">
                    {p.role.label}
                  </Badge>
                  {p.peak_rank && (
                    <Badge variant="warning" size="sm">
                      Peak {p.peak_rank}
                    </Badge>
                  )}
                </div>

                <p className="relative mt-3 flex-1 text-sm text-text-secondary line-clamp-3">
                  {p.blurb}
                </p>

                <div className="relative mt-4 flex flex-wrap items-center gap-2">
                  {p.trackers.slice(0, 1).map((t) => (
                    <a
                      key={t.url}
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-lg bg-surface-light px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" /> {t.label}
                    </a>
                  ))}
                  {p.eligible_for_promotion && (
                    <button
                      type="button"
                      onClick={() => toggle(p.slug)}
                      className={cn(
                        "ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
                        voted
                          ? "bg-primary text-background"
                          : "bg-surface-light text-text-secondary hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      <Vote className="h-3 w-3" />
                      {voted ? "Voted" : "Vote"} · {votes}
                    </button>
                  )}
                </div>

                <Link
                  href={`/scene/${p.slug}`}
                  className="relative mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Open profile <ChevronRight className="h-3 w-3" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-surface/40 p-5 text-sm text-text-muted">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            Know an Indian semi-pro or creator we&apos;ve missed? Drop their
            tracker / vlr / YouTube link in the{" "}
            <Link href="/forum" className="text-primary hover:underline">
              forum
            </Link>{" "}
            and we&apos;ll vet them for the next ladder refresh.
          </div>
        </div>
      </section>
    </div>
  );
}
