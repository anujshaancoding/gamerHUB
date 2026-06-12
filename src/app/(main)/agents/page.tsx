import type { Metadata } from "next";
import { AgentsGrid } from "@/components/system/agents/agents-grid";

export const metadata: Metadata = {
  title: "Valorant Agents — Abilities & Guides | ggLobby",
  description:
    "Browse every Valorant agent by role. Full ability breakdowns for Duelists, Initiators, Controllers and Sentinels — costs, cooldowns and how to use each ability.",
  keywords: [
    "valorant agents",
    "valorant abilities",
    "valorant agent guide",
    "valorant duelist initiator controller sentinel",
  ],
  openGraph: {
    title: "Valorant Agents — Abilities & Guides | ggLobby",
    description:
      "Every Valorant agent and ability, explained. Browse by role.",
    type: "website",
  },
};

export default function AgentsPage() {
  return <AgentsGrid />;
}
