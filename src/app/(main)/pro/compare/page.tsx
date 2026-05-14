import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getProPlayerDetail, listProPlayers } from "@/lib/pro/queries";
import { CompareView } from "@/components/pro/compare-view";
import type { ProGame, ProPlayerWithTeam } from "@/lib/pro/types";

export const metadata: Metadata = {
  title: "Compare Indian Pros — Valorant, BGMI, Free Fire · ggLobby",
  description:
    "Compare any two Indian esports pros side by side. K/D, agent pool, gear, sensitivity — head-to-head in one view.",
  openGraph: {
    title: "Compare Indian Esports Pros — Head-to-head",
    description:
      "Pick two pros and see them side by side: stats, gear, sensitivity.",
    type: "website",
  },
};

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ game?: string; a?: string; b?: string }>;
}

function isValidGame(g: string | undefined): g is ProGame {
  return g === "valorant" || g === "bgmi" || g === "freefire";
}

export default async function ProComparePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const game: ProGame = isValidGame(params.game) ? params.game : "valorant";
  const slugA = params.a || null;
  const slugB = params.b || null;

  const [rosterValorant, rosterBgmi, rosterFreefire, detailA, detailB] =
    await Promise.all([
      listProPlayers("valorant"),
      listProPlayers("bgmi"),
      listProPlayers("freefire"),
      slugA ? getProPlayerDetail(game, slugA) : Promise.resolve(null),
      slugB ? getProPlayerDetail(game, slugB) : Promise.resolve(null),
    ]);

  const rosterByGame: Record<ProGame, ProPlayerWithTeam[]> = {
    valorant: rosterValorant,
    bgmi: rosterBgmi,
    freefire: rosterFreefire,
  };

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
          Compare Indian Pros
        </h1>
        <p className="text-text-muted mt-2 max-w-2xl">
          Pick any two same-game pros and see them head-to-head — career stats and full
          setup side by side. Great for settling debates.
        </p>
      </div>

      <CompareView
        game={game}
        initialA={slugA}
        initialB={slugB}
        detailA={detailA}
        detailB={detailB}
        rosterByGame={rosterByGame}
      />
    </div>
  );
}
