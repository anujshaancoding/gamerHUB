import type { Metadata } from "next";
import { ValorantRankCardClient } from "@/components/tools/valorant-rank-card-client";
import { LoyaltyRankCard } from "@/components/loyalty/loyalty-rank-card-client";

export const metadata: Metadata = {
  title: "Valorant Rank Card Maker — Free Shareable PNG · ggLobby",
  description:
    "Make a free Valorant rank card and download it as a PNG for Instagram Stories, Discord and WhatsApp. Pick your rank, share your card — no account needed.",
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
      "Make a free Valorant rank card and download it as a PNG. No account needed.",
    type: "website",
  },
};

export default async function RankCardPage({
  searchParams,
}: {
  searchParams?: Promise<{ rank?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const initialRank = params.rank;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:py-10 space-y-8">
      <header>
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-text">
          Valorant rank card
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted leading-relaxed">
          Pick your rank, get a clean shareable card, and download it as a PNG for your
          Instagram Story, Discord or WhatsApp. Free for everyone — saving it to your ggLobby
          profile is the only step that needs a free account.
        </p>
      </header>

      <ValorantRankCardClient initialRank={initialRank} />

      {/* Loyalty rank card (renders only for signed-in users). */}
      <LoyaltyRankCard />
    </div>
  );
}
