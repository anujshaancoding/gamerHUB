import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getProPlayerDetail } from "@/lib/pro/queries";
import { PlayerDetail } from "@/components/pro/player-detail";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getProPlayerDetail("bgmi", slug);
  if (!detail) return { title: "Player Not Found · ggLobby" };

  const { player } = detail;
  const title = `${player.ign}${player.real_name ? ` (${player.real_name})` : ""} — BGMI Pro · ggLobby`;
  const description = player.bio
    ? player.bio.slice(0, 160)
    : `${player.ign} — Indian BGMI pro${player.team ? ` for ${player.team.name}` : ""}. Stats, device, sensitivity, and HUD setup.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: player.photo_url
        ? [{ url: player.photo_url, width: 1200, height: 630, alt: player.ign }]
        : undefined,
    },
  };
}

export default async function BgmiProPlayerPage({ params }: Props) {
  const { slug } = await params;
  const detail = await getProPlayerDetail("bgmi", slug);
  if (!detail) notFound();

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link
          href="/pro/bgmi"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to rankings
        </Link>
      </div>
      <PlayerDetail detail={detail} />
    </>
  );
}
