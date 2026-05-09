"use client";

import { FindingCard } from "./finding-card";
import type { InsightFinding, StatCategory } from "@/lib/tracker/types";
import { Crosshair, Brain, Coins, UserCircle, Map, Sparkles } from "lucide-react";

const META: Record<StatCategory, { title: string; blurb: string; Icon: typeof Crosshair }> = {
  aim: {
    title: "Aim & Gunplay",
    blurb: "How accurate and impactful you are in gunfights.",
    Icon: Crosshair,
  },
  gamesense: {
    title: "Game Sense",
    blurb: "Decisions, trades, and clutch performance.",
    Icon: Brain,
  },
  economy: {
    title: "Economy",
    blurb: "How much value you get out of pistol and eco rounds.",
    Icon: Coins,
  },
  role: {
    title: "Role Fit",
    blurb: "How well your performance matches your agent's role.",
    Icon: UserCircle,
  },
  map: {
    title: "Map Performance",
    blurb: "Where you shine and where you struggle.",
    Icon: Map,
  },
  utility: {
    title: "Utility Usage",
    blurb: "Flashes, smokes, and grenade impact.",
    Icon: Sparkles,
  },
};

export function CategorySection({
  category,
  findings,
}: {
  category: StatCategory;
  findings: InsightFinding[];
}) {
  if (findings.length === 0) return null;
  const { title, blurb, Icon } = META[category];

  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text sm:text-lg">{title}</h3>
          <p className="text-xs text-text-muted sm:text-sm">{blurb}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {findings.map((f, i) => (
          <FindingCard key={`${f.metric}-${i}`} finding={f} />
        ))}
      </div>
    </section>
  );
}
