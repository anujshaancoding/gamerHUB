import type { Metadata } from "next";
import { TierListMaker } from "@/components/tools/tier-list-maker";

export const metadata: Metadata = {
  title: "Tier List Maker — Drag-and-drop S/A/B/C/D rankings · ggLobby",
  description:
    "Build a shareable tier list. Pre-loaded with Valorant agents, weapons and maps — or upload your own images.",
  alternates: { canonical: "/tier-list" },
};

export default function TierListPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-text">Tier list maker</h1>
        <p className="text-text-muted mt-2 leading-relaxed">
          Drag items into S / A / B / C / D rows. Switch presets or upload your own
          images. Download the finished tier list as a PNG to share.
        </p>
      </header>

      <TierListMaker />
    </div>
  );
}
