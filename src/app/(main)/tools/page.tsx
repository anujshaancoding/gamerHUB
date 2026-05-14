import type { Metadata } from "next";
import Link from "next/link";
import {
  Crosshair,
  Crop,
  Monitor,
  BarChart3,
  ListOrdered,
  Sparkles,
  Trophy,
  Coins,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Gamer Tools — FOV, sens, crosshair codes, rank percentile · ggLobby",
  description:
    "Free utilities for gamers: FOV calculator, sensitivity converter, eDPI, pro crosshair gallery, monitor/Hz guide, rank percentile, tier list maker, skin estimator and community sens share.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Gamer Tools — ggLobby",
    description:
      "FOV calc, eDPI, pro crosshair codes, rank percentile, tier list maker — every gamer utility in one place.",
    type: "website",
  },
};

type Tool = {
  href: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  badge?: string;
};

const tools: Tool[] = [
  {
    href: "/pro/sens-converter",
    title: "Sensitivity converter",
    desc: "Move your aim between Valorant, CS2, Apex, BGMI, CODM and more. eDPI and cm/360° included.",
    icon: Crop,
    accent: "from-fuchsia-500/15 to-pink-500/15 border-fuchsia-500/25",
  },
  {
    href: "/tools/fov",
    title: "FOV calculator",
    desc: "Convert FOV between games — horizontal, vertical, 4:3 stretched and aspect-ratio scaling.",
    icon: Crop,
    accent: "from-cyan-500/15 to-blue-500/15 border-cyan-500/25",
  },
  {
    href: "/tools/crosshairs",
    title: "Pro crosshair gallery",
    desc: "Every Indian Valorant pro's crosshair code — one-click copy straight into the game.",
    icon: Crosshair,
    accent: "from-red-500/15 to-orange-500/15 border-red-500/25",
    badge: "Valorant",
  },
  {
    href: "/tools/sens-share",
    title: "Community sens share",
    desc: "Upload your full BGMI / Free Fire / Valorant sens. Browse top configs by grip style and rank.",
    icon: Smartphone,
    accent: "from-orange-500/15 to-amber-500/15 border-orange-500/25",
    badge: "New",
  },
  {
    href: "/tools/monitor",
    title: "Monitor & Hz guide",
    desc: "Refresh rate, response time, input lag, viewing distance — what actually matters for FPS.",
    icon: Monitor,
    accent: "from-slate-500/15 to-zinc-500/15 border-slate-500/25",
  },
  {
    href: "/tools/rank-percentile",
    title: "Rank percentile",
    desc: "See what % of players you're above in Valorant, BGMI and Free Fire ranked.",
    icon: BarChart3,
    accent: "from-emerald-500/15 to-teal-500/15 border-emerald-500/25",
  },
  {
    href: "/tools/tier-list",
    title: "Tier list maker",
    desc: "Drag-and-drop tier list builder. Export a shareable image for Twitter / Discord.",
    icon: ListOrdered,
    accent: "from-violet-500/15 to-indigo-500/15 border-violet-500/25",
  },
  {
    href: "/tools/skin-estimator",
    title: "Valorant skin estimator",
    desc: "Estimate how much you've spent on Valorant skins — paste your bundle list and see the total.",
    icon: Coins,
    accent: "from-yellow-500/15 to-amber-500/15 border-yellow-500/25",
    badge: "Valorant",
  },
  {
    href: "/pro/events",
    title: "Tournament pick'em",
    desc: "Predict matches for BMPS, VCT Challengers SA and FFWS India. Climb the live leaderboard.",
    icon: Trophy,
    accent: "from-pink-500/15 to-rose-500/15 border-pink-500/25",
    badge: "Live events",
  },
];

export default function ToolsLandingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <Badge variant="primary" size="sm" className="mb-3">
          <Sparkles className="h-3 w-3 mr-1 inline" /> Tools
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-text">Gamer Tools</h1>
        <p className="text-text-muted mt-3 leading-relaxed">
          Every utility in one place — sens converter, FOV calc, pro crosshair codes,
          rank percentile, tier list maker, and more. All free, no sign-up needed
          unless you want to publish something.
        </p>
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
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-text">{t.title}</h3>
                  {t.badge && (
                    <Badge variant="secondary" size="sm">
                      {t.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">{t.desc}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text">Want a discussion section instead?</h2>
        <p className="text-sm text-text-secondary mt-2 leading-relaxed">
          Talk pro scene, hardware, scrim hunts or just shitpost — head over to the new{" "}
          <Link href="/forum" className="text-primary font-medium hover:underline">
            Forum
          </Link>
          . Threaded discussions with sections per game and nested replies.
        </p>
      </div>
    </div>
  );
}
