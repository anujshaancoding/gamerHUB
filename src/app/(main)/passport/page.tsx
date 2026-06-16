import type { Metadata } from "next";
import { PassportClient } from "@/components/gaming/passport/passport-client";

export const metadata: Metadata = {
  title: "Valorant Passport India - Create your player identity",
  description:
    "Create your free Valorant Passport for India: rank, peak rank, main agent, role, state, language, playstyle and share-ready identity. Save it to your ggLobby profile when you are ready.",
  alternates: { canonical: "/passport" },
  keywords: [
    "valorant passport india",
    "valorant profile india",
    "valorant rank card india",
    "indian valorant players",
    "valorant identity card",
  ],
  openGraph: {
    title: "Create your Valorant Passport - ggLobby",
    description:
      "Build a free Valorant identity card for India. Show your rank, agent, role, state and grind.",
    type: "website",
  },
};

export default function PassportPage() {
  return <PassportClient />;
}
