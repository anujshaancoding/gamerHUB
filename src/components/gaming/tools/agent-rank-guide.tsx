"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Share2, Copy, CheckCircle2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENTS, agentIcon, ROLE_META, type AgentRole } from "@/lib/data/valorant-agents";
import {
  RANK_BANDS,
  RANK_BAND_LABEL,
  ROLE_SLUGS,
  ROLE_LABEL,
  recsFor,
  type RankBand,
  type RoleSlug,
} from "@/lib/features/tools/agent-rank-guide";
import { trackCtaClick } from "@/lib/analytics/cta-click";
import { CTA_SOURCES } from "@/lib/analytics/sources";

export function AgentRankGuide({
  initialRank = "gold",
  initialRole = "duelist",
}: {
  initialRank?: RankBand;
  initialRole?: RoleSlug;
}) {
  const [rank, setRank] = useState<RankBand>(initialRank);
  const [role, setRole] = useState<RoleSlug>(initialRole);
  const [copied, setCopied] = useState(false);

  const recs = useMemo(() => recsFor(rank, role), [rank, role]);
  const roleName: AgentRole = ROLE_LABEL[role];
  const roleColor = ROLE_META[roleName].color;

  function shareUrl(): string {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/agents/rank-guide?rank=${rank}&role=${role}`;
  }

  async function share() {
    const text = `Best ${roleName}s for ${RANK_BAND_LABEL[rank]} in Valorant — here's what I should be playing.`;
    const url = shareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: "Best agents for my rank — ggLobby", text, url });
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* ignore */
      }
    }
  }

  const topAgent = recs[0] ? AGENTS.find((a) => a.slug === recs[0].slug) : undefined;

  return (
    <div className="space-y-6">
      {/* Pickers */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-text-muted">
            Your rank
          </span>
          <div className="flex flex-wrap gap-1.5">
            {RANK_BANDS.map((b) => (
              <button
                key={b}
                onClick={() => setRank(b)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  b === rank
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-surface border-border text-text-secondary hover:border-primary/30",
                )}
              >
                {RANK_BAND_LABEL[b]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-text-muted">
            Your role
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_SLUGS.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                  r === role
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-surface border-border text-text-secondary hover:border-primary/30",
                )}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-text">
          Best <span style={{ color: roleColor }}>{roleName}s</span> for{" "}
          {RANK_BAND_LABEL[rank]}
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={share}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Share my result"}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl());
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-text"
          >
            <Copy className="h-3.5 w-3.5" /> Copy link
          </button>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-3">
        {recs.map((rec, i) => {
          const agent = AGENTS.find((a) => a.slug === rec.slug);
          if (!agent) return null;
          return (
            <div
              key={rec.slug}
              className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <div
                className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg"
                style={{ background: `${roleColor}1a` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={agentIcon(agent.uuid)}
                  alt={agent.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-text-dim">#{i + 1}</span>
                  <Link
                    href={`/agents/${agent.slug}`}
                    className="font-bold text-text hover:text-primary"
                  >
                    {agent.name}
                  </Link>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{rec.why}</p>
                <Link
                  href="/find-gamers"
                  onClick={() => trackCtaClick(CTA_SOURCES.agent_rank_guide)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <Users className="h-3.5 w-3.5" />
                  Find teammates who main {agent.name}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
        <p className="text-sm font-semibold text-text">
          Want to climb with people at your rank?
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Find {RANK_BAND_LABEL[rank]} {roleName}s
          {topAgent ? ` who main ${topAgent.name}` : ""} looking for a squad on ggLobby.
        </p>
        <Link
          href="/find-gamers"
          onClick={() => trackCtaClick(CTA_SOURCES.agent_rank_guide)}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Users className="h-4 w-4" /> Find teammates — free
        </Link>
      </div>
    </div>
  );
}
