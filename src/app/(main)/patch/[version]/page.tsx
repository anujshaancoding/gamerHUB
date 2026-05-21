import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import {
  getAllPatchSlugs,
  getPatch,
  CHANGE_META,
  type PatchChange,
} from "@/lib/data/valorant-patches";
import { PatchTierList } from "@/components/patch/patch-tier-list";

export function generateStaticParams() {
  return getAllPatchSlugs().map((version) => ({ version }));
}

type Props = { params: Promise<{ version: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { version } = await params;
  const patch = getPatch(version);
  if (!patch) return { title: "Patch not found · ggLobby" };

  const title = `Valorant ${patch.title} Notes — Tier List & Balance Changes | ggLobby`;
  return {
    title,
    description: patch.summary,
    alternates: { canonical: `/patch/${patch.slug}` },
    keywords: [
      `valorant patch ${patch.version}`,
      `patch ${patch.version} notes`,
      `valorant ${patch.version} tier list`,
      "valorant meta",
      "valorant balance changes",
    ],
    openGraph: { title, description: patch.summary, type: "article" },
    twitter: { card: "summary_large_image", title, description: patch.summary },
  };
}

const CATEGORY_LABEL: Record<PatchChange["category"], string> = {
  agent: "Agents",
  map: "Maps",
  weapon: "Weapons",
  system: "Systems",
};

const CATEGORY_ORDER: PatchChange["category"][] = [
  "agent",
  "map",
  "weapon",
  "system",
];

function ChangeCard({ change }: { change: PatchChange }) {
  const meta = CHANGE_META[change.kind];
  const href =
    change.category === "agent" && change.slug
      ? `/agents/${change.slug}`
      : change.category === "map" && change.slug
        ? `/maps/${change.slug}`
        : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        {href ? (
          <Link
            href={href}
            className="font-semibold text-text hover:text-primary transition-colors"
          >
            {change.subject}
          </Link>
        ) : (
          <span className="font-semibold text-text">{change.subject}</span>
        )}
        <span
          className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${meta.className}`}
        >
          {meta.label}
        </span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {change.notes.map((n, i) => (
          <li
            key={i}
            className="flex gap-2 text-sm text-text-secondary leading-relaxed"
          >
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-text-muted" />
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function PatchVersionPage({ params }: Props) {
  const { version } = await params;
  const patch = getPatch(version);
  if (!patch) notFound();

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: patch.changes.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 space-y-10">
      <div>
        <Link
          href="/patch"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" />
          Patch hub
        </Link>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-text">
            Valorant {patch.title}
          </h1>
          <span className="text-sm text-text-muted">
            {new Date(patch.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-text-secondary leading-relaxed">
          {patch.summary}
        </p>
      </div>

      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
          TL;DR
        </h2>
        <ul className="mt-3 space-y-2">
          {patch.headline.map((h, i) => (
            <li
              key={i}
              className="flex gap-2 text-sm text-text-secondary leading-relaxed"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </section>

      {grouped.map(({ cat, items }) => (
        <section key={cat} className="space-y-4">
          <h2 className="text-lg font-bold text-text">{CATEGORY_LABEL[cat]}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((c, i) => (
              <ChangeCard key={`${c.subject}-${i}`} change={c} />
            ))}
          </div>
        </section>
      ))}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-text">
            Meta tier list — {patch.title}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Where every agent and map sits after this patch. Click any entry for
            the full guide.
          </p>
        </div>
        <PatchTierList tierList={patch.tierList} />
      </section>

      <footer className="flex flex-col gap-2 border-t border-border pt-5 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          Curated by ggLobby — always cross-check competitive decisions against
          the official notes.
        </span>
        <a
          href={patch.source}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Official Riot patch notes
          <ExternalLink className="h-3 w-3" />
        </a>
      </footer>
    </div>
  );
}
