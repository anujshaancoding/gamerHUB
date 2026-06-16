"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { trackCtaClick } from "@/lib/analytics/cta-click";
import { CTA_SOURCES } from "@/lib/analytics/sources";

/**
 * North Star CTA on every Rank Up tier guide — routes SEO readers into the
 * teammate loop (/find-gamers + /lfg) and fires a `rank_up_to_lfg` cta_click
 * so the funnel can attribute Rank Up traffic to teammate-finding intent.
 */
export function RankUpCta({ rank }: { rank: string }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center sm:p-6">
      <p className="text-sm font-semibold text-text sm:text-base">
        Climbing is easier with a squad that VOD-reviews and comms.
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">
        Find {rank} players on ggLobby who want to practise, review and queue together — free.
      </p>
      <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Link
          href="/find-gamers"
          onClick={() => trackCtaClick(CTA_SOURCES.rank_up_to_lfg)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
        >
          <Users className="h-4 w-4" /> Find teammates — free
        </Link>
        <Link
          href="/lfg"
          onClick={() => trackCtaClick(CTA_SOURCES.rank_up_to_lfg)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 sm:w-auto"
        >
          Browse LFG posts
        </Link>
      </div>
    </div>
  );
}
