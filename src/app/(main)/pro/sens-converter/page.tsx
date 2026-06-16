import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SensConverter } from "@/components/monetization/pro/sens-converter";

export function generateMetadata(): Metadata {
  return {
    title: "Sensitivity Converter — CS2 to Valorant & more (India)",
    description:
      "Convert your mouse sensitivity between Valorant, CS2, Apex, Overwatch 2, R6 — or CODM and PUBG: New State. cm/360 and eDPI included. Save & share your setup free.",
    alternates: { canonical: "/pro/sens-converter" },
    keywords: [
      "cs2 to valorant sensitivity converter",
      "valorant sensitivity calculator india",
      "valorant sens converter",
      "what sensitivity do indian pros use valorant",
      "valorant edpi calculator",
    ],
    openGraph: {
      title: "Sensitivity Converter — PC & Mobile",
      description:
        "Convert between Valorant / CS2 / Apex / OW2 and between CODM / PUBG: New State. Save & share your setup.",
      type: "website",
    },
  };
}

export default function SensConverterPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <div>
        <Link
          href="/pro"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Pro Scene
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-text">
          Sensitivity Converter
        </h1>
        <p className="text-text-muted mt-2 max-w-2xl">
          Move your aim between games without losing muscle memory. Math is exact for PC
          titles (same yaw constant approach used by every reputable converter). Mobile
          conversions are approximations — see the note in the mobile tab. Save and share your
          setup with one link.
        </p>
      </div>

      <SensConverter />
    </div>
  );
}
