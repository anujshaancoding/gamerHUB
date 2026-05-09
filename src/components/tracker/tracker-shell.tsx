"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ValorantClient } from "./valorant-client";
import { Cs2Client } from "./cs2-client";
import { MobileClient } from "./mobile-client";

type Game = "valorant" | "cs2" | "bgmi" | "freefire";

const TABS: Array<{ id: Game; label: string; subtitle: string }> = [
  { id: "valorant", label: "Valorant", subtitle: "Riot ID lookup" },
  { id: "cs2", label: "CS2", subtitle: "Steam ID lookup" },
  { id: "bgmi", label: "BGMI", subtitle: "Screenshot upload" },
  { id: "freefire", label: "Free Fire", subtitle: "Screenshot upload" },
];

export function TrackerShell({ initialGame }: { initialGame?: Game }) {
  const [game, setGame] = useState<Game>(initialGame ?? "valorant");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> Beta
          </span>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Player Insights</h1>
        </div>
        <p className="max-w-2xl text-sm text-text-muted sm:text-base">
          Pick your game. We turn raw stats into a plain-English breakdown — strengths, weaknesses,
          and what to grind next.
        </p>
      </header>

      {/* Game tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = game === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setGame(t.id)}
              className={[
                "group relative rounded-lg border px-3 py-2 text-left transition-colors",
                active
                  ? "border-primary/60 bg-primary/10 text-text"
                  : "border-border bg-surface-light/30 text-text-secondary hover:border-primary/30 hover:text-text",
              ].join(" ")}
            >
              <div className="text-sm font-bold">{t.label}</div>
              <div className="text-[10px] text-text-muted">{t.subtitle}</div>
            </button>
          );
        })}
      </div>

      {game === "valorant" ? <ValorantClient /> : null}
      {game === "cs2" ? <Cs2Client /> : null}
      {game === "bgmi" ? <MobileClient game="bgmi" /> : null}
      {game === "freefire" ? <MobileClient game="freefire" /> : null}

      <p className="pt-4 text-center text-[11px] text-text-muted">
        More games soon — <Link href="/help" className="text-primary hover:underline">request one</Link>.
      </p>
    </div>
  );
}
