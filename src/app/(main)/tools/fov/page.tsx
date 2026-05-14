import type { Metadata } from "next";
import { FovCalculator } from "@/components/tools/fov-calculator";

export const metadata: Metadata = {
  title: "FOV Calculator — Convert FOV between Valorant, CS2, Apex, COD · ggLobby",
  description:
    "Convert field of view between every major FPS — Valorant, CS2, Apex, COD, Fortnite, R6. Handles Hor+, vertical FOV, 4:3 stretched and ultrawide.",
  alternates: { canonical: "/tools/fov" },
  openGraph: {
    title: "FOV Calculator — ggLobby",
    description: "Convert FOV between any FPS — Hor+, Vert-, 4:3 stretched, ultrawide.",
    type: "website",
  },
};

export default function FovPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-text">FOV calculator</h1>
        <p className="text-text-muted mt-2 leading-relaxed">
          Convert in-game FOV between titles — handles Hor+ (Valorant / CS / Apex) and
          vertical-FOV games (R6, COD). Pick your monitor aspect ratio for accurate
          ultrawide / 4:3 stretched values.
        </p>
      </header>

      <FovCalculator />

      <section className="rounded-xl border border-border bg-surface p-5 text-sm text-text-secondary leading-relaxed space-y-3">
        <h2 className="text-base font-semibold text-text">Quick reference</h2>
        <ul className="space-y-1.5 list-disc pl-5">
          <li><strong>Hor+</strong> — vertical FOV stays constant, horizontal expands on wider screens. Used by Valorant, CS2, Apex, Source engine, most modern FPS.</li>
          <li><strong>Vert-</strong> — horizontal FOV stays constant, vertical shrinks on wider screens. Used by R6 Siege, MW/Warzone (legacy).</li>
          <li><strong>4:3 stretched</strong> — same engine FOV, but rendered at 4:3 and pixel-stretched to 16:9. Models look wider; FOV math is identical to native 4:3.</li>
          <li><strong>cm/360°</strong> &amp; <strong>eDPI</strong> — those live on the <a className="text-primary hover:underline" href="/pro/sens-converter">Sens converter</a>.</li>
        </ul>
      </section>
    </div>
  );
}
