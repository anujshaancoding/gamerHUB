import Link from "next/link";
import { VALORANT } from "@/lib/theme/valorant-theme";

const DEMOS = [
  {
    href: "/demo/arena",
    n: "01",
    name: "ARENA",
    tag: "Esports hype",
    desc: "Bold, angular, Riot-official energy. Huge agent splash, sharp red CTAs, live community stat counters. Loud and competitive — feels like walking into a tournament.",
  },
  {
    href: "/demo/hub",
    n: "02",
    name: "SQUAD HUB",
    tag: "Community-first",
    desc: "A hub you 'log into'. Welcome banner, big action tiles, giveaway + leaderboard social proof front and center, members-online energy. Utility meets community.",
  },
  {
    href: "/demo/cinematic",
    n: "03",
    name: "CINEMATIC",
    tag: "Immersive",
    desc: "Full-bleed auto-rotating agent carousel, moody and dark, minimal text, one strong 'enter the lobby' CTA with a floating community quick-bar. Game-launcher vibe.",
  },
  {
    href: "/demo/street",
    n: "04",
    name: "STREET",
    tag: "Youthful / loud",
    desc: "Energetic, layered, diagonal cuts and tactical accents. Agent grid, live meta strip, framed around 'the Indian VALORANT community'. The most community-culture-forward.",
  },
];

export default function DemoIndex() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
      <p
        className="text-xs font-bold uppercase tracking-[0.3em]"
        style={{ color: VALORANT.red }}
      >
        ggLobby · Home redesign
      </p>
      <h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-6xl">
        Pick a direction
      </h1>
      <p className="mt-3 max-w-xl text-sm" style={{ color: VALORANT.textMuted }}>
        Four live home-page concepts, all on the official VALORANT palette and
        built for a gaming-community feel. Open each, then tell me which one to
        take forward (we can mix elements too).
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {DEMOS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="group relative overflow-hidden rounded-xl p-6 transition-all hover:-translate-y-1"
            style={{
              background: VALORANT.surface,
              border: `1px solid ${VALORANT.border}`,
            }}
          >
            <div className="flex items-baseline justify-between">
              <span
                className="text-5xl font-black"
                style={{ color: VALORANT.border }}
              >
                {d.n}
              </span>
              <span
                className="rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ background: `${VALORANT.red}26`, color: VALORANT.red }}
              >
                {d.tag}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-black uppercase tracking-tight">
              {d.name}
            </h2>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: VALORANT.textMuted }}
            >
              {d.desc}
            </p>
            <span
              className="mt-4 inline-block text-sm font-bold uppercase tracking-widest"
              style={{ color: VALORANT.red }}
            >
              View demo →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
