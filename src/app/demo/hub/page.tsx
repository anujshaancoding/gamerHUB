"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Swords,
  Map,
  Crosshair,
  Trophy,
  Gift,
  Wrench,
  Users,
  Circle,
  ArrowUpRight,
} from "lucide-react";
import { VALORANT as V } from "@/lib/theme/valorant-theme";
import { AGENTS, agentIcon } from "@/lib/data/valorant-agents";
import { DemoSwitcher } from "@/components/demo/demo-switcher";

const TILES = [
  { href: "/agents", icon: Swords, title: "Agents", sub: "25 full ability guides", big: true },
  { href: "/maps", icon: Map, title: "Maps & Lineups", sub: "Callouts + curated lineups", big: true },
  { href: "/pro", icon: Crosshair, title: "Pro Setups", sub: "Crosshairs · sens · gear" },
  { href: "/tools", icon: Wrench, title: "Tools", sub: "Sens converter & more" },
];

const LEADERBOARD = [
  { n: "PhantomX", p: 480, t: "Radiant" },
  { n: "riser.gg", p: 365, t: "Platinum" },
  { n: "noscope_", p: 290, t: "Platinum" },
  { n: "ace_in_a", p: 210, t: "Gold" },
  { n: "smokecheck", p: 175, t: "Gold" },
];

const ONLINE = ["jett", "sage", "omen", "sova", "killjoy", "reyna"]
  .map((s) => AGENTS.find((a) => a.slug === s)!)
  .filter(Boolean);

export default function HubDemo() {
  return (
    <div style={{ background: V.bg }}>
      <header
        className="border-b"
        style={{ borderColor: V.border, background: V.bgDeep }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <span className="text-2xl font-black uppercase tracking-tight">
            gg<span style={{ color: V.red }}>Lobby</span>
          </span>
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ background: V.surface, color: V.textMuted }}
          >
            <Circle className="h-2 w-2 fill-current" style={{ color: V.teal }} />
            <span style={{ color: V.cream }}>1,284</span> in the lobby now
          </div>
          <Link
            href="/register"
            className="rounded px-5 py-2 text-sm font-black uppercase tracking-wider"
            style={{ background: V.red, color: V.cream }}
          >
            Join
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        {/* welcome banner */}
        <div
          className="relative overflow-hidden rounded-2xl p-7 sm:p-10"
          style={{
            background: `linear-gradient(120deg, ${V.surface} 0%, ${V.bgDeep} 70%)`,
            border: `1px solid ${V.border}`,
          }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full blur-3xl"
            style={{ background: `${V.red}22` }}
          />
          <p
            className="text-xs font-black uppercase tracking-[0.3em]"
            style={{ color: V.red }}
          >
            Welcome to the lobby
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
            Your VALORANT crew, knowledge & grind — one hub
          </h1>
          <p className="mt-4 max-w-lg text-sm" style={{ color: V.textMuted }}>
            Learn agents, master lineups, climb the community leaderboard and
            win monthly drops. Free, India-first.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/agents"
              className="rounded px-6 py-3 text-sm font-black uppercase tracking-wider"
              style={{ background: V.red, color: V.cream }}
            >
              Start learning
            </Link>
            <Link
              href="/giveaway"
              className="rounded border px-6 py-3 text-sm font-black uppercase tracking-wider"
              style={{ borderColor: V.borderLight, color: V.cream }}
            >
              This month&apos;s giveaway
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* tiles */}
          <div className="grid gap-4 sm:grid-cols-2">
            {TILES.map((t, i) => (
              <motion.div
                key={t.href}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={t.big ? "sm:row-span-1" : ""}
              >
                <Link
                  href={t.href}
                  className="group flex h-full flex-col justify-between rounded-2xl p-6 transition-all hover:-translate-y-1"
                  style={{
                    background: V.surface,
                    border: `1px solid ${V.border}`,
                    minHeight: t.big ? 170 : 140,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-lg"
                      style={{ background: `${V.red}1f` }}
                    >
                      <t.icon className="h-5 w-5" style={{ color: V.red }} />
                    </div>
                    <ArrowUpRight
                      className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: V.red }}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">
                      {t.title}
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: V.textMuted }}>
                      {t.sub}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* side: giveaway + leaderboard */}
          <div className="space-y-4">
            <div
              className="rounded-2xl p-6"
              style={{
                background: `linear-gradient(135deg, ${V.red} 0%, ${V.redDark} 100%)`,
              }}
            >
              <Gift className="h-7 w-7" style={{ color: V.bg }} />
              <h3
                className="mt-3 text-2xl font-black uppercase tracking-tight"
                style={{ color: V.bg }}
              >
                Monthly drop
              </h3>
              <p className="mt-1 text-sm font-medium" style={{ color: V.bgDeep }}>
                Earn points, win a skin. Resets every month.
              </p>
              <Link
                href="/giveaway"
                className="mt-4 inline-block rounded px-5 py-2.5 text-sm font-black uppercase tracking-wider"
                style={{ background: V.bg, color: V.cream }}
              >
                Enter free
              </Link>
            </div>

            <div
              className="rounded-2xl p-6"
              style={{ background: V.surface, border: `1px solid ${V.border}` }}
            >
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" style={{ color: V.red }} />
                <h3 className="text-sm font-black uppercase tracking-widest">
                  Top of the lobby
                </h3>
              </div>
              <div className="mt-4 space-y-3">
                {LEADERBOARD.map((r, i) => (
                  <div key={r.n} className="flex items-center gap-3">
                    <span
                      className="w-5 text-sm font-black"
                      style={{ color: i === 0 ? V.red : V.textDim }}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-bold">{r.n}</span>
                    <span
                      className="text-[10px] font-bold uppercase"
                      style={{ color: V.textDim }}
                    >
                      {r.t}
                    </span>
                    <span
                      className="w-12 text-right text-sm font-black"
                      style={{ color: V.red }}
                    >
                      {r.p}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/leaderboard"
                className="mt-4 block text-center text-xs font-bold uppercase tracking-widest"
                style={{ color: V.textMuted }}
              >
                Full leaderboard →
              </Link>
            </div>
          </div>
        </div>

        {/* online strip */}
        <div
          className="mt-6 flex items-center gap-4 overflow-hidden rounded-2xl p-5"
          style={{ background: V.bgDeep, border: `1px solid ${V.border}` }}
        >
          <div className="flex -space-x-3">
            {ONLINE.map((a) => (
              <div
                key={a.slug}
                className="h-10 w-10 overflow-hidden rounded-full"
                style={{ border: `2px solid ${V.bg}` }}
              >
                <Image
                  src={agentIcon(a.uuid)}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <p className="text-sm" style={{ color: V.textMuted }}>
            <span style={{ color: V.cream, fontWeight: 700 }}>
              Hundreds of Indian players
            </span>{" "}
            learning, grinding and climbing right now.
          </p>
        </div>
      </main>

      <DemoSwitcher />
    </div>
  );
}
