import type { Metadata } from "next";
import { RankPercentile } from "@/components/gaming/tools/rank-percentile";

export function generateMetadata(): Metadata {
  return {
    title: "Valorant Rank Distribution India 2026 — Where Do You Stand?",
    description:
      "See the Valorant rank distribution for India in 2026 and find out what percentile your rank puts you in. Free India + global rank percentile calculator — no account needed.",
    alternates: { canonical: "/tools/rank-percentile" },
    keywords: [
      "valorant rank distribution india 2026",
      "valorant rank distribution india",
      "what rank is top 10% valorant india",
      "valorant rank percentile",
      "valorant ranks india",
    ],
    openGraph: {
      title: "Valorant Rank Distribution India 2026 — Where Do You Stand?",
      description:
        "Find your percentile in the India and global Valorant rank distribution. Free calculator.",
      type: "website",
    },
  };
}

export default function RankPercentilePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-text">
          Valorant rank distribution — India 2026
        </h1>
        <p className="text-text-muted mt-2 leading-relaxed">
          Pick your rank and see where you actually sit in the ranked population — India server
          or global. Distributions are estimates pooled from publicly-shared dev data and
          community samples; treat them as a rough percentile, not a precise leaderboard.
        </p>
      </header>

      <RankPercentile />
    </div>
  );
}
