import type { Metadata } from "next";
import { ProLandingMotion } from "@/components/pro/pro-landing-motion";

export const metadata: Metadata = {
  title: "Pro Scene India — Valorant Rankings · ggLobby",
  description:
    "India's top Valorant pros in one place. Rankings, detailed stats, peripherals, sensitivities and in-game setups — plus tournament calendar and pro-vs-pro compare.",
  openGraph: {
    title: "Pro Scene India — Valorant Rankings, Stats & Setups",
    description:
      "Top Indian Valorant pros. Stats, gear, sensitivity, tournament calendar, compare tool.",
    type: "website",
  },
};

export default function ProLandingPage() {
  return <ProLandingMotion />;
}
