import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AGENTS,
  getAgent,
  fetchAbilityIcons,
} from "@/lib/data/valorant-agents";
import { AgentDetail } from "@/components/agents/agent-detail";

export function generateStaticParams() {
  return AGENTS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) return { title: "Agent not found · ggLobby" };

  const title = `${agent.name} Abilities Guide — Valorant ${agent.role} | ggLobby`;
  const description = `${agent.name} ability breakdown: ${agent.abilities
    .map((a) => a.name)
    .join(", ")}. ${agent.tagline}`;

  return {
    title,
    description,
    keywords: [
      `valorant ${agent.name.toLowerCase()}`,
      `${agent.name.toLowerCase()} abilities`,
      `${agent.name.toLowerCase()} guide`,
      `valorant ${agent.role.toLowerCase()}`,
    ],
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) notFound();
  const abilityIcons = await fetchAbilityIcons(agent);
  return <AgentDetail agent={agent} abilityIcons={abilityIcons} />;
}
