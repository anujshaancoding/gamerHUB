import { TrendingUp } from "lucide-react";
import { RANK_UP_LADDER } from "@/lib/data/valorant-rank-up";
import { RankLadderCard } from "./rank-ladder-card";

/**
 * Rank Up hub — full-bleed hero + the rank ladder. Live tiers (Iron/Bronze/
 * Silver) link to their guides; the rest render as locked "coming soon" cards
 * so the full ladder is visible from day one.
 */
export function RankUpLanding() {
  const liveCount = RANK_UP_LADDER.filter((t) => t.live).length;

  return (
    <div className="relative -m-4 overflow-hidden lg:-m-6">
      {/* Hero */}
      <section className="relative px-4 pb-12 pt-14 sm:px-6 sm:pb-14 sm:pt-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(60% 50% at 20% 0%, rgba(255,70,85,0.14), transparent 70%)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(50% 50% at 90% 10%, rgba(10,200,185,0.12), transparent 70%)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <TrendingUp className="h-3.5 w-3.5" /> Game Sense Guide
          </span>
          <h1 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tight text-text sm:text-6xl lg:text-7xl">
            Rank{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Up</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-text-secondary sm:text-lg">
            A rank-by-rank game-sense guide for Valorant. Each tier breaks down how players at that level
            think, what&apos;s holding them back, and exactly what to fix to climb.
          </p>
        </div>
      </section>

      {/* Ladder */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="h-5 w-1 shrink-0 rounded-full bg-primary" />
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-text sm:text-2xl">
              Choose your rank
            </h2>
            <p className="mt-0.5 text-sm text-text-muted">
              Pilot: Iron through Silver live now — more tiers dropping soon.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RANK_UP_LADDER.map((entry) => (
            <RankLadderCard key={entry.slug} entry={entry} />
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-text-dim">
          {liveCount} of {RANK_UP_LADDER.length} tier guides published · Iron → Immortal coming through 2026
        </p>
      </section>
    </div>
  );
}
