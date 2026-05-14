import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Trophy,
  Calendar,
  ArrowRightLeft,
  Crosshair,
  Wrench,
  MessagesSquare,
} from "lucide-react";
import { Card, CardContent, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pro Scene India — Valorant, BGMI & Free Fire Rankings · ggLobby",
  description:
    "India's top esports pros in one place. Rankings, detailed stats, peripherals, sensitivities and in-game setups for Valorant, BGMI and Free Fire — plus tournament calendar and pro-vs-pro compare.",
  openGraph: {
    title: "Pro Scene India — Rankings, Stats & Setups",
    description:
      "Top Indian pros across Valorant, BGMI and Free Fire. Stats, gear, sensitivity, tournament calendar, compare tool.",
    type: "website",
  },
};

const games = [
  {
    slug: "valorant",
    name: "Valorant",
    tagline: "India's top Valorant pros — agents, sens, crosshairs, gear.",
    accent: "from-red-500/20 to-pink-500/20 border-red-500/30",
  },
  {
    slug: "bgmi",
    name: "BGMI",
    tagline: "India's BGMI elite — device, sensitivity, grip style, and HUD.",
    accent: "from-orange-500/20 to-yellow-500/20 border-orange-500/30",
  },
  {
    slug: "freefire",
    name: "Free Fire",
    tagline: "Top Indian FF pros — characters, sensitivity, gear.",
    accent: "from-purple-500/20 to-blue-500/20 border-purple-500/30",
  },
];

const tools = [
  {
    href: "/pro/events",
    title: "Tournament calendar",
    desc: "Upcoming and live Indian tournaments — BMPS, VCT Challengers SA, FFWS India and more.",
    icon: Calendar,
    accent: "from-blue-500/15 to-cyan-500/15 border-blue-500/25",
  },
  {
    href: "/pro/compare",
    title: "Compare pros",
    desc: "Pick any two same-game pros and see them head-to-head — stats and full setup.",
    icon: ArrowRightLeft,
    accent: "from-emerald-500/15 to-teal-500/15 border-emerald-500/25",
  },
  {
    href: "/pro/sens-converter",
    title: "Sensitivity converter",
    desc: "Move your aim between Valorant, CS2, Apex, BGMI, CODM and more — cm/360° and eDPI included.",
    icon: Crosshair,
    accent: "from-fuchsia-500/15 to-pink-500/15 border-fuchsia-500/25",
  },
];

export default function ProLandingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <Badge variant="primary" size="sm" className="mb-3">Beta</Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-text">Pro Scene India</h1>
        <p className="text-text-muted mt-3 leading-relaxed">
          The competitive scene, in one place. Rankings, detailed stats, peripherals,
          sensitivities and in-game settings for India&apos;s top pros across Valorant,
          BGMI and Free Fire — plus a tournament calendar and a head-to-head compare tool.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {games.map((g) => (
          <Link
            key={g.slug}
            href={`/pro/${g.slug}`}
            className={`block rounded-xl border bg-gradient-to-br ${g.accent} p-6 transition-transform hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-text">{g.name}</h2>
              <Badge variant="success" size="sm">Live</Badge>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">{g.tagline}</p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              View rankings <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`block rounded-xl border bg-gradient-to-br ${t.accent} p-5 transition-transform hover:-translate-y-0.5`}
          >
            <div className="flex items-start gap-3">
              <t.icon className="h-6 w-6 text-text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-text">{t.title}</h3>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">{t.desc}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          href="/tools"
          className="block rounded-xl border border-border bg-surface p-4 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-2">
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-text">Gamer tools</h3>
              <p className="text-xs text-text-muted mt-0.5">FOV calc, crosshair gallery, rank percentile, tier list maker, more.</p>
            </div>
          </div>
        </Link>
        <Link
          href="/forum"
          className="block rounded-xl border border-border bg-surface p-4 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-pink-500/10 border border-pink-500/30 p-2">
              <MessagesSquare className="h-4 w-4 text-pink-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-text">Forum</h3>
              <p className="text-xs text-text-muted mt-0.5">HLTV-style discussion threads by game and topic.</p>
            </div>
          </div>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row items-start gap-4">
          <Trophy className="h-8 w-8 text-warning flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-text">What you&apos;ll find here</h3>
            <ul className="mt-2 space-y-1 text-sm text-text-secondary">
              <li>· National ranking with career peak rank, role and team</li>
              <li>· Current-season stats: K/D, ADR/ACS, HS%, agent pool (Valorant), avg damage + finishes (BGMI), booyah rate + character pool (Free Fire)</li>
              <li>· Full gear loadout: PC rig (CPU/GPU/RAM/monitor) or mobile device + grip + triggers, plus headphones, mouse, keyboard, mousepad</li>
              <li>· Sensitivity table + one-click crosshair code copy (Valorant) and per-scope ADS sens (BGMI/FF)</li>
              <li>· Tournament calendar — never miss a BMPS, VCT Challengers SA or FFWS India fixture</li>
              <li>· Compare tool — settle debates with stats and gear side-by-side</li>
              <li>· Verified socials so you can follow your favourite pros</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
