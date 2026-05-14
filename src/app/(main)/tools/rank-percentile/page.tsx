import type { Metadata } from "next";
import { RankPercentile } from "@/components/tools/rank-percentile";

export const metadata: Metadata = {
  title: "Rank Percentile — Valorant, BGMI & Free Fire ranked distribution · ggLobby",
  description:
    "See what % of the ranked playerbase you're above. Live rank-distribution data for Valorant, BGMI and Free Fire.",
  alternates: { canonical: "/tools/rank-percentile" },
};

export default function RankPercentilePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-text">Rank percentile</h1>
        <p className="text-text-muted mt-2 leading-relaxed">
          Pick your rank and see where you actually sit in the ranked population. Distributions
          are pooled from publicly-shared dev data and community samples — treat them as a
          rough percentile, not a precise leaderboard.
        </p>
      </header>

      <RankPercentile />
    </div>
  );
}
