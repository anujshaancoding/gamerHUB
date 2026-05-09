import type { Metadata } from "next";
import { TrackerShell } from "@/components/tracker/tracker-shell";

export const metadata: Metadata = {
  title: "Player Insights · ggLobby",
  description:
    "Look up Valorant, CS2, BGMI, and Free Fire stats and get a plain-English breakdown of your strengths, weaknesses, and what to practice. No jargon.",
  openGraph: {
    title: "ggLobby Player Insights — Know your strengths. Fix your weaknesses.",
    description:
      "Multi-game stat tracker. Valorant + CS2 via API; BGMI + Free Fire via screenshot upload. Saved to your account.",
    type: "website",
  },
};

export default function TrackerPage() {
  return <TrackerShell />;
}
