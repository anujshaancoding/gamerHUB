import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Sparkles } from "lucide-react";
import { getAllPatches, getLatestPatch } from "@/lib/data/valorant-patches";

export const metadata: Metadata = {
  title: "Valorant Patch Notes Hub — Tier List & Balance Changes",
  description:
    "Every Valorant patch broken down: agent buffs and nerfs, map pool changes, weapon tweaks and the updated meta tier list. Stay current every Act.",
  alternates: { canonical: "/patch" },
  keywords: [
    "valorant patch notes",
    "valorant patch tier list",
    "valorant meta",
    "valorant balance changes",
    "valorant agent buffs nerfs",
  ],
  openGraph: {
    title: "Valorant Patch Hub — Tier List & Balance Changes",
    description:
      "Agent buffs/nerfs, map pool changes and the updated meta tier list, every patch.",
    type: "website",
  },
};

export default function PatchHubPage() {
  const patches = getAllPatches();
  const latest = getLatestPatch();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/15 border border-primary/30 p-2.5">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-text">
            Valorant patch hub
          </h1>
        </div>
        <p className="text-text-muted max-w-2xl">
          Every patch, broken down for competitive players: what got buffed,
          what got nerfed, map pool rotations, and the meta tier list as it
          stands. Curated against the official Riot notes.
        </p>
      </header>

      {latest && (
        <Link
          href={`/patch/${latest.slug}`}
          className="group block rounded-2xl border border-primary/30 bg-primary/5 p-6 transition-colors hover:border-primary"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Current patch
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-xl font-bold text-text">{latest.title}</h2>
            <span className="text-sm text-text-muted">
              {new Date(latest.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <p className="mt-2 text-sm text-text-secondary">{latest.summary}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            Read the breakdown
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          All patches
        </h2>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {patches.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/patch/${p.slug}`}
                className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-surface"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold text-text">{p.title}</span>
                    <span className="text-xs text-text-muted">
                      {new Date(p.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-text-muted">
                    {p.summary}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
