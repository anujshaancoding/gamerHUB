import type { Metadata } from "next";
import { ValorantRankCardClient } from "@/components/gaming/tools/valorant-rank-card-client";
import { LoyaltyRankCard } from "@/components/gamification/loyalty/loyalty-rank-card-client";

export const metadata: Metadata = {
  title: "Valorant Rank Card Maker — Free Shareable PNG",
  description:
    "Make a free Valorant rank card and download it as a PNG. Build manually or from a career lookup, with role, main agent, peak rank and source label.",
  alternates: { canonical: "/rank-card" },
  keywords: [
    "valorant rank card",
    "valorant rank card maker",
    "valorant rank flex",
    "valorant rank image",
    "valorant rank card india",
  ],
  openGraph: {
    title: "Valorant Rank Card Maker — ggLobby",
    description:
      "Create a shareable Valorant rank card with rank, peak, main agent, role and source label.",
    type: "website",
  },
};

export default async function RankCardPage({
  searchParams,
}: {
  searchParams?: Promise<{
    rank?: string;
    peak?: string;
    agent?: string;
    role?: string;
    source?: string;
    template?: string;
    name?: string;
    weapon?: string;
    map?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:py-10 space-y-8">
      <header>
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-text">
          Valorant rank card
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted leading-relaxed">
          Build it manually or generate it from a career lookup. Every card shows
          whether it is self reported or career-record based, so players know what
          they are sharing.
        </p>
      </header>

      <ValorantRankCardClient
        initialRank={params.rank}
        initialPeak={params.peak}
        initialAgent={params.agent}
        initialRole={params.role}
        initialSource={params.source}
        initialTemplate={params.template}
        initialName={params.name}
        initialWeapon={params.weapon}
        initialMap={params.map}
      />

      {/* Loyalty rank card (renders only for signed-in users). */}
      <LoyaltyRankCard />
    </div>
  );
}
