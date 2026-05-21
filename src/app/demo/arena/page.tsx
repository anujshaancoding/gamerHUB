"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Swords, Map, Gift, Trophy } from "lucide-react";
import { VALORANT as V } from "@/lib/theme/valorant-theme";
import { AGENTS, agentPortrait, agentIcon } from "@/lib/data/valorant-agents";

const HERO = AGENTS.find((a) => a.slug === "jett")!;
const RAIL = ["phoenix", "reyna", "sova", "killjoy", "viper", "neon", "raze", "omen"]
  .map((s) => AGENTS.find((a) => a.slug === s)!)
  .filter(Boolean);

const STATS = [
  { v: "25", l: "Agents decoded" },
  { v: "11", l: "Maps mapped" },
  { v: "∞", l: "Lineups & callouts" },
  { v: "1", l: "Game. Done right." },
];

export default function ArenaDemo() {
  return (
    <div className="relative overflow-hidden" style={{ background: V.bg }}>
      {/* top bar */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <span className="text-2xl font-black uppercase tracking-tight">
          gg<span style={{ color: V.red }}>Lobby</span>
        </span>
        <nav className="hidden items-center gap-7 text-sm font-bold uppercase tracking-wider md:flex">
          <Link href="/agents" style={{ color: V.textMuted }}>Agents</Link>
          <Link href="/maps" style={{ color: V.textMuted }}>Maps</Link>
          <Link href="/giveaway" style={{ color: V.textMuted }}>Giveaway</Link>
        </nav>
        <Link
          href="/register"
          className="skew-x-[-12deg] px-5 py-2 text-sm font-black uppercase tracking-wider"
          style={{ background: V.red, color: V.cream }}
        >
          <span className="inline-block skew-x-[12deg]">Join</span>
        </Link>
      </header>

      {/* HERO */}
      <section className="relative mx-auto grid min-h-[88vh] max-w-7xl items-center gap-6 px-5 lg:grid-cols-[1.1fr_1fr]">
        {/* angular accent block */}
        <div
          className="pointer-events-none absolute right-0 top-0 hidden h-full w-1/2 lg:block"
          style={{
            background: `linear-gradient(135deg, transparent 0%, ${V.red}14 100%)`,
            clipPath: "polygon(22% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-12" style={{ background: V.red }} />
            <span
              className="text-xs font-black uppercase tracking-[0.3em]"
              style={{ color: V.red }}
            >
              India&apos;s VALORANT community
            </span>
          </div>
          <h1 className="mt-5 text-6xl font-black uppercase leading-[0.85] tracking-tighter sm:text-8xl">
            Outplay
            <br />
            <span style={{ color: V.red }}>everyone</span>
          </h1>
          <p
            className="mt-6 max-w-md text-base sm:text-lg"
            style={{ color: V.textMuted }}
          >
            Agent guides, map lineups, pro setups and a community that grinds
            together. Built by Indian players, for Indian players.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/agents"
              className="group flex skew-x-[-12deg] items-center gap-2 px-7 py-3.5 text-sm font-black uppercase tracking-wider"
              style={{ background: V.red, color: V.cream }}
            >
              <span className="flex skew-x-[12deg] items-center gap-2">
                Enter the lobby <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              href="/maps"
              className="skew-x-[-12deg] border px-7 py-3.5 text-sm font-black uppercase tracking-wider"
              style={{ borderColor: V.borderLight, color: V.cream }}
            >
              <span className="inline-block skew-x-[12deg]">Browse lineups</span>
            </Link>
          </div>
        </div>

        {/* hero agent */}
        <div className="relative z-10 flex justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <span
              className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 text-[34vw] font-black leading-none lg:text-[20vw]"
              style={{ color: V.surface }}
            >
              VAL
            </span>
            <Image
              src={agentPortrait(HERO.uuid)}
              alt={HERO.name}
              width={760}
              height={1000}
              priority
              className="h-auto w-[330px] drop-shadow-2xl sm:w-[460px] lg:w-[620px]"
            />
          </motion.div>
        </div>
      </section>

      {/* stat strip */}
      <section
        className="relative z-10 border-y"
        style={{ borderColor: V.border, background: V.bgDeep }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-2 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.l}
              className="border-r px-5 py-7 text-center last:border-r-0"
              style={{
                borderColor: V.border,
                borderRightWidth: i === 3 ? 0 : 1,
              }}
            >
              <p
                className="text-4xl font-black"
                style={{ color: V.red }}
              >
                {s.v}
              </p>
              <p
                className="mt-1 text-xs font-bold uppercase tracking-widest"
                style={{ color: V.textMuted }}
              >
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* agent rail */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Know <span style={{ color: V.red }}>every</span> agent
          </h2>
          <Link
            href="/agents"
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: V.red }}
          >
            All 25 →
          </Link>
        </div>
        <div className="mt-7 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {RAIL.map((a) => (
            <Link
              key={a.slug}
              href={`/agents/${a.slug}`}
              className="group relative aspect-square overflow-hidden"
              style={{ background: V.surface, border: `1px solid ${V.border}` }}
            >
              <Image
                src={agentIcon(a.uuid)}
                alt={a.name}
                width={160}
                height={160}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <span
                className="absolute inset-x-0 bottom-0 px-2 py-1 text-center text-[11px] font-black uppercase"
                style={{ background: `${V.bgDeep}cc` }}
              >
                {a.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section
        className="relative overflow-hidden"
        style={{ background: V.red }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-5 py-16 text-center">
          <h2
            className="text-4xl font-black uppercase tracking-tight sm:text-6xl"
            style={{ color: V.bg }}
          >
            Win the monthly drop
          </h2>
          <p className="max-w-md font-medium" style={{ color: V.bgDeep }}>
            Earn points, climb the leaderboard, win a skin every month. Free.
          </p>
          <Link
            href="/giveaway"
            className="skew-x-[-12deg] px-8 py-4 text-sm font-black uppercase tracking-wider"
            style={{ background: V.bg, color: V.cream }}
          >
            <span className="inline-block skew-x-[12deg]">Enter giveaway</span>
          </Link>
        </div>
      </section>

      <DemoSwitcher />
    </div>
  );
}

function DemoSwitcher() {
  const links = [
    { href: "/demo/arena", n: "01 Arena" },
    { href: "/demo/hub", n: "02 Hub" },
    { href: "/demo/cinematic", n: "03 Cinematic" },
    { href: "/demo/street", n: "04 Street" },
  ];
  return (
    <div
      className="sticky bottom-0 z-30 flex flex-wrap items-center justify-center gap-2 border-t px-4 py-3 text-xs"
      style={{ background: V.bgDeep, borderColor: V.border }}
    >
      <span style={{ color: V.textDim }}>Compare designs:</span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded px-2 py-1 font-bold uppercase tracking-wider"
          style={{ background: V.surface, color: V.textMuted }}
        >
          {l.n}
        </Link>
      ))}
    </div>
  );
}
