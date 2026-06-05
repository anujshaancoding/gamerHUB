import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AgentRankGuide } from "@/components/tools/agent-rank-guide";
import {
  RANK_BAND_LABEL,
  ROLE_LABEL,
  isRankBand,
  isRoleSlug,
  type RankBand,
  type RoleSlug,
} from "@/lib/tools/agent-rank-guide";

interface PageProps {
  searchParams?: Promise<{ rank?: string; role?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = (await searchParams) ?? {};
  const rank = isRankBand(sp.rank) ? sp.rank : null;
  const role = isRoleSlug(sp.role) ? sp.role : null;

  if (rank && role) {
    const rankLabel = RANK_BAND_LABEL[rank];
    const roleLabel = ROLE_LABEL[role];
    return {
      title: `Best ${roleLabel}s for ${rankLabel} in Valorant (2026) · ggLobby`,
      description: `The best Valorant ${roleLabel.toLowerCase()} agents to play at ${rankLabel} in 2026, with why each works at your rank. Free interactive guide — pick your rank and role.`,
      alternates: { canonical: `/agents/rank-guide?rank=${rank}&role=${role}` },
      keywords: [
        `best ${roleLabel.toLowerCase()} valorant ${rankLabel.toLowerCase()}`,
        `best valorant agents for ${rankLabel.toLowerCase()}`,
        `which agents to play in ${rankLabel.toLowerCase()} valorant`,
        "best valorant agents for your rank",
        "best valorant agents 2026 india",
      ],
      openGraph: {
        title: `Best ${roleLabel}s for ${rankLabel} in Valorant (2026)`,
        description: `Which Valorant ${roleLabel.toLowerCase()} agents to play at ${rankLabel}, and why.`,
        type: "website",
      },
    };
  }

  return {
    title: "Best Valorant Agents for Your Rank (2026 Guide) · ggLobby",
    description:
      "Pick your rank and role to see the best Valorant agents you should be playing in 2026, with a short reason for each. Free interactive guide for India and global players.",
    alternates: { canonical: "/agents/rank-guide" },
    keywords: [
      "best valorant agents for your rank",
      "best valorant agents for gold india",
      "best duelist valorant 2026",
      "which agents to play in iron valorant",
      "best valorant agents 2026 india",
    ],
    openGraph: {
      title: "Best Valorant Agents for Your Rank (2026 Guide)",
      description: "Pick your rank and role to see which agents you should be playing.",
      type: "website",
    },
  };
}

export default async function AgentRankGuidePage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const initialRank: RankBand = isRankBand(sp.rank) ? sp.rank : "gold";
  const initialRole: RoleSlug = isRoleSlug(sp.role) ? sp.role : "duelist";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:py-10 space-y-6">
      <div>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text mb-3"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All agents
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-text">
          Best Valorant agents for your rank
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted leading-relaxed">
          Pick your rank and role to see which agents actually pay off where you play right now —
          with a one-line reason for each. Lower ranks reward simple, self-sufficient kits; higher
          ranks reward utility that wins coordinated rounds.
        </p>
      </div>

      <AgentRankGuide initialRank={initialRank} initialRole={initialRole} />
    </div>
  );
}
