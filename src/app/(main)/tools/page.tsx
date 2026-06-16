import type { Metadata } from "next";
import { ToolsLandingMotion } from "@/components/gaming/tools/tools-landing-motion";

export const metadata: Metadata = {
  title: "Gamer Tools — FOV, sens, crosshair codes, rank percentile",
  description:
    "Free utilities for gamers: FOV calculator, sensitivity converter, eDPI, pro crosshair gallery, monitor/Hz guide, rank percentile, tier list maker, skin estimator and community sens share.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Gamer Tools — ggLobby",
    description:
      "FOV calc, eDPI, pro crosshair codes, rank percentile, tier list maker — every gamer utility in one place.",
    type: "website",
  },
};

export default function ToolsLandingPage() {
  return <ToolsLandingMotion />;
}
