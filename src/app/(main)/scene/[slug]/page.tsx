import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SCENE_PLAYERS, getScenePlayer, TIER_LABEL } from "@/lib/data/india-scene";
import { SceneProfile } from "@/components/gaming/scene/scene-profile";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return SCENE_PLAYERS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const player = getScenePlayer(slug);
  if (!player) return { title: "Scene Player Not Found" };

  const tierLabel = TIER_LABEL[player.tier];
  const title = `${player.ign} — ${tierLabel} · India Scene · ggLobby`;
  const description = player.blurb;
  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
  };
}

export default async function SceneProfilePage({ params }: Props) {
  const { slug } = await params;
  const player = getScenePlayer(slug);
  if (!player) notFound();
  return <SceneProfile player={player} />;
}
