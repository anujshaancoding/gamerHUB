import type { Metadata } from "next";
import { TierListMaker } from "@/components/gaming/tools/tier-list-maker";

export const metadata: Metadata = {
  title: "Tier List Maker — Drag-and-drop S/A/B/C/D rankings · ggLobby",
  description:
    "Build a shareable tier list. Pre-loaded with Valorant agents, agent ultimates, weapons and maps — every item shown with real in-game art.",
  alternates: { canonical: "/tier-list" },
};

export default function TierListPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-text">Tier list maker</h1>
        <p className="text-text-muted mt-2 leading-relaxed">
          Drag items onto the S / A / B / C / D / F rows. Switch presets to rank
          Valorant agents, agent ultimates, weapons or maps — then screenshot the
          board to share.
        </p>
      </header>

      <TierListMaker />
    </div>
  );
}
