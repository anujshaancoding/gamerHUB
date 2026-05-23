import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SceneLadder } from "@/components/scene/scene-ladder";

export const metadata: Metadata = {
  title: "India Scene — Semi-Pros, Amateurs & Creators · ggLobby",
  description:
    "The Indian Valorant scene below Tier-1: academy rosters, amateur grinders and the creators driving the community. Vote for who goes pro next.",
  openGraph: {
    title: "India Scene — Semi-Pros, Amateurs & Creators",
    description:
      "Indian Valorant's next wave — academy duelists, free-agent grinders, YouTubers and streamers. Vote for the next callup.",
    type: "website",
  },
};

export default function ScenePage() {
  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link
          href="/pro"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" />
          Pro Scene
        </Link>
      </div>
      <SceneLadder />
    </>
  );
}
