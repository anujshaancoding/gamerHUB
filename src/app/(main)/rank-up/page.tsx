import type { Metadata } from "next";
import { JsonLd, BASE_URL } from "@/lib/features/seo";
import { RankUpLanding } from "@/components/gaming/rank-up/rank-up-landing";
import { RANK_UP_LADDER } from "@/lib/data/valorant-rank-up";

const title = "Rank Up — Valorant Game Sense Guides by Rank (2026) | ggLobby";
const description =
  "Rank-by-rank Valorant game-sense guides. How each rank thinks, the habits holding you back, and the exact unlocks and drills to climb — Iron to Immortal.";

export const metadata: Metadata = {
  // `title` already carries the "| ggLobby" brand; mark it absolute so the root
  // layout's "%s | ggLobby" template doesn't append a second suffix.
  title: { absolute: title },
  description,
  keywords: [
    "valorant game sense",
    "how to improve game sense valorant",
    "valorant rank up guide",
    "valorant tips by rank",
    "how to climb in valorant",
  ],
  alternates: { canonical: `${BASE_URL}/rank-up` },
  openGraph: { title, description, type: "website", url: `${BASE_URL}/rank-up` },
  twitter: { card: "summary_large_image", title, description },
};

export default function RankUpPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Rank Up", item: `${BASE_URL}/rank-up` },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Valorant Rank Up guides",
    itemListElement: RANK_UP_LADDER.filter((t) => t.live).map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${t.rank} to ${t.nextRank}`,
      url: `${BASE_URL}/rank-up/${t.slug}`,
    })),
  };

  return (
    <>
      <JsonLd data={[breadcrumb, itemList]} />
      <RankUpLanding />
    </>
  );
}
