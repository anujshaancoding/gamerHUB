import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MAPS, getMap } from "@/lib/data/valorant-maps";
import { getMapCallouts } from "@/lib/data/valorant-callouts";
import { MapLineups } from "@/components/gaming/maps/map-lineups";

export function generateStaticParams() {
  return MAPS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const map = getMap(slug);
  if (!map) return { title: "Map not found" };

  const title = `${map.name} Lineups & Callouts — Valorant`;
  const description = `${map.name} agent lineups and callouts. ${map.blurb}`;
  return {
    title,
    description,
    keywords: [
      `valorant ${map.name.toLowerCase()}`,
      `${map.name.toLowerCase()} lineups`,
      `${map.name.toLowerCase()} callouts`,
      `valorant ${map.name.toLowerCase()} guide`,
    ],
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function MapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const map = getMap(slug);
  if (!map) notFound();
  const callouts = await getMapCallouts(map.uuid);
  return <MapLineups map={map} callouts={callouts} />;
}
