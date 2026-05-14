import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Info } from "lucide-react";
import { listProPlayers } from "@/lib/pro/queries";
import { RankingTable } from "@/components/pro/ranking-table";

export const metadata: Metadata = {
  title: "Indian Valorant Pros — Rankings, Stats & Gear · ggLobby",
  description:
    "Top Indian Valorant pro players ranked. Detailed stats, agent pools, peripherals, sensitivity and in-game settings — all in one place.",
  openGraph: {
    title: "Indian Valorant Pros — Rankings, Stats & Gear",
    description:
      "Discover the top Indian Valorant pros: stats, gear, sensitivity, and crosshair codes.",
    type: "website",
  },
};

export const revalidate = 300;

export default async function ValorantProListPage() {
  const players = await listProPlayers("valorant");

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <div>
        <Link
          href="/pro"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Pro Scene
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-text">
          Indian Valorant Pros
        </h1>
        <p className="text-text-muted mt-2 max-w-2xl">
          National ranking of India&apos;s top Valorant pros. Click any player to see their
          career stats, agent pool, peripherals, sensitivity, and crosshair code.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-text-secondary">
        <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <p>
          Beta. Rankings and setups are curated manually and refreshed against vlr.gg
          and team-verified sources. Spot something out of date?{" "}
          <Link href="/help" className="text-primary hover:underline">
            Let us know.
          </Link>
        </p>
      </div>

      <RankingTable game="valorant" players={players} />
    </div>
  );
}
