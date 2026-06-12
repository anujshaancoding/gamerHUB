"use client";

import { Sparkles } from "lucide-react";
import { ValorantClient } from "./valorant-client";

type Game = "valorant";

export function TrackerShell({ initialGame: _initialGame }: { initialGame?: Game } = {}) {
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
          Enter your Riot ID. We turn raw Valorant stats into a plain-English breakdown —
          strengths, weaknesses, and what to grind next.
        </p>
      </header>

      <ValorantClient />
    </div>
  );
}
