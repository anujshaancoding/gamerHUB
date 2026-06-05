"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Zap,
  Images,
  CalendarDays,
  Trophy,
  Palette,
  Crosshair,
  Flame,
  Menu,
  X,
} from "lucide-react";
import { trackCtaClick } from "@/lib/analytics/cta-click";
import { CTA_SOURCES } from "@/lib/analytics/sources";
import { VALORANT as V } from "@/lib/theme/valorant-theme";
import {
  AGENTS,
  agentIcon,
  agentPortrait,
} from "@/lib/data/valorant-agents";
import { MAPS, mapSplash } from "@/lib/data/valorant-maps";

const AV = AGENTS.find((a) => a.slug === "jett")!;
const BANNER_MAP = MAPS.find((m) => m.slug === "ascent")!;
const SHOTS = ["raze", "neon", "reyna"]
  .map((s) => AGENTS.find((a) => a.slug === s)!)
  .filter(Boolean);
const STRIP = ["jett", "reyna", "sova", "killjoy", "phoenix", "omen", "sage", "neon"]
  .map((s) => AGENTS.find((a) => a.slug === s)!)
  .filter(Boolean);

const TICKER = [
  "BUILD YOUR PROFILE",
  "SHOW YOUR RANK",
  "FLEX YOUR CLIPS",
  "TRACK YOUR STREAK",
  "JOIN THE LObBY",
  "WIN THE MONTHLY DROP",
];

const FEATURES = [
  { icon: Images, t: "Showcase wall", d: "Upload clutch clips, score screens, skin collections & GIFs." },
  { icon: Trophy, t: "Rank & milestones", d: "Show your peak rank, badges and the road you climbed." },
  { icon: CalendarDays, t: "Streak calendar", d: "GitHub-style attendance heatmap. Keep the grind visible." },
  { icon: Palette, t: "Make it yours", d: "Banners, themes, skins, music — a profile that's unmistakably you." },
];

export default function HomePage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  return (
    <div style={{ background: V.bg, color: V.cream }} className="overflow-hidden">
      {/* ticker */}
      <div
        className="flex items-center overflow-hidden border-b py-2"
        style={{ background: V.red, borderColor: V.redDark }}
      >
        <motion.div
          className="flex shrink-0 gap-8 whitespace-nowrap text-xs font-black uppercase tracking-widest"
          style={{ color: V.bg }}
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-8">
              {t} <Zap className="h-3 w-3 fill-current" />
            </span>
          ))}
        </motion.div>
      </div>

      {/* nav */}
      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <span className="text-2xl font-black italic tracking-tight">
          gg<span style={{ color: V.red }}>Lobby</span>
        </span>
        <nav className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wider md:flex">
          <Link href="/agents" style={{ color: V.textMuted }}>Agents</Link>
          <Link href="/maps" style={{ color: V.textMuted }}>Maps</Link>
          <Link href="/giveaway" style={{ color: V.textMuted }}>Giveaway</Link>
          <Link href="/login" style={{ color: V.textMuted }}>Log in</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/register"
            onClick={() => trackCtaClick(CTA_SOURCES.navbar)}
            className="-skew-x-12 px-5 py-2 text-sm font-black uppercase italic tracking-wider"
            style={{ background: V.red, color: V.cream }}
          >
            <span className="inline-block skew-x-12">Create profile</span>
          </Link>
          {/* Mobile hamburger — reveals the same discovery links as desktop */}
          <button
            type="button"
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            aria-controls="overview-mobile-nav"
            className="flex h-11 w-11 items-center justify-center md:hidden"
            style={{ color: V.cream }}
          >
            {mobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.nav
              id="overview-mobile-nav"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="absolute left-0 right-0 top-full z-40 mx-5 mt-1 flex flex-col overflow-hidden rounded-xl border md:hidden"
              style={{ background: V.surface, borderColor: V.border }}
            >
              {[
                { href: "/agents", label: "Agents" },
                { href: "/maps", label: "Maps" },
                { href: "/giveaway", label: "Giveaway" },
                { href: "/login", label: "Log in" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="flex min-h-[44px] items-center border-b px-5 text-sm font-bold uppercase tracking-wider last:border-b-0"
                  style={{ color: V.textMuted, borderColor: V.border }}
                >
                  {item.label}
                </Link>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* HERO — profile-first */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-6 lg:grid-cols-[1fr_1fr]">
        <div className="relative z-10">
          <div
            className="-skew-x-12 inline-block px-3 py-1 text-xs font-black uppercase tracking-widest"
            style={{ background: V.red, color: V.bg }}
          >
            <span className="inline-block skew-x-12">
              The Indian VALORANT community
            </span>
          </div>
          <h1 className="mt-5 text-5xl font-black uppercase italic leading-[0.82] tracking-tighter sm:text-7xl">
            Your VALORANT
            <br />
            <span
              style={{ WebkitTextStroke: `2px ${V.red}`, color: "transparent" }}
            >
              identity.
            </span>
          </h1>
          <p
            className="mt-6 max-w-md text-base sm:text-lg"
            style={{ color: V.textMuted }}
          >
            One profile for everything you are in VALORANT — rank, clutch clips,
            skins, milestones and your daily grind. Build it. Flex it. Own the
            lobby.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              onClick={() => trackCtaClick(CTA_SOURCES.inline_banner)}
              className="group flex -skew-x-12 items-center gap-2 px-7 py-3.5 text-sm font-black uppercase tracking-wider"
              style={{ background: V.red, color: V.cream }}
            >
              <span className="flex skew-x-12 items-center gap-2">
                Build your profile <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              href="/agents"
              className="flex items-center gap-2 px-5 py-3.5 text-sm font-black uppercase tracking-wider"
              style={{ color: V.cream }}
            >
              <Crosshair className="h-4 w-4" style={{ color: V.red }} /> Browse
              guides
            </Link>
          </div>
          <p className="mt-4 text-xs" style={{ color: V.textDim }}>
            Free forever. Guides &amp; lineups stay open — no signup to browse.
          </p>
        </div>

        {/* Mock profile showcase card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div
            className="overflow-hidden rounded-2xl"
            style={{ background: V.surface, border: `1px solid ${V.border}` }}
          >
            {/* banner */}
            <div className="relative h-28 sm:h-32">
              <Image
                src={mapSplash(BANNER_MAP.uuid)}
                alt=""
                fill
                priority
                className="object-cover object-center"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${V.surface}, transparent 70%)`,
                }}
              />
            </div>
            {/* identity */}
            <div className="px-5 pb-5">
              <div className="flex items-end gap-3">
                <div
                  className="relative z-[9999] -mt-10 h-20 w-20 shrink-0 overflow-hidden rounded-xl"
                  style={{ border: `3px solid ${V.surface}`, background: V.bgDeep }}
                >
                  <Image
                    src={agentPortrait(AV.uuid)}
                    alt=""
                    width={300}
                    height={400}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <div className="pb-1">
                  <p className="text-xl font-black uppercase italic leading-none">
                    your_tag
                  </p>
                  <span
                    className="mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-black uppercase"
                    style={{ background: `${V.red}26`, color: V.red }}
                  >
                    Immortal 3 · India
                  </span>
                </div>
              </div>

              {/* streak heatmap */}
              <p
                className="mt-5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: V.textDim }}
              >
                28-day streak
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {Array.from({ length: 42 }).map((_, i) => {
                  const lvl = [0, 0.15, 0.35, 0.6, 1][i % 5];
                  return (
                    <span
                      key={i}
                      className="h-3 w-3 rounded-[3px]"
                      style={{
                        background:
                          lvl === 0 ? V.surfaceLight : `rgba(255,70,85,${lvl})`,
                      }}
                    />
                  );
                })}
              </div>

              {/* showcase shots */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                {SHOTS.map((s) => (
                  <div
                    key={s.slug}
                    className="relative aspect-video overflow-hidden rounded-md"
                    style={{ background: V.bgDeep }}
                  >
                    <Image
                      src={agentPortrait(s.uuid)}
                      alt=""
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                ))}
              </div>

              {/* badges */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["Veteran", "Clutch King", "100 Wins", "Verified"].map((b) => (
                  <span
                    key={b}
                    className="rounded px-2 py-1 text-[10px] font-bold uppercase"
                    style={{ background: V.surfaceLight, color: V.textMuted }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div
            className="pointer-events-none absolute -inset-3 -z-10 -skew-y-3"
            style={{ background: `linear-gradient(135deg, ${V.red}1f, transparent)` }}
          />
        </motion.div>
      </section>

      {/* what's on your profile */}
      <section
        className="border-y"
        style={{ background: V.bgDeep, borderColor: V.border }}
      >
        <div className="mx-auto max-w-7xl px-5 py-14">
          <h2 className="text-3xl font-black uppercase italic tracking-tight sm:text-4xl">
            Everything you are, <span style={{ color: V.red }}>on one page</span>
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.t}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="rounded-xl p-5"
                style={{ background: V.surface, border: `1px solid ${V.border}` }}
              >
                <f.icon className="h-7 w-7" style={{ color: V.red }} />
                <h3 className="mt-4 text-lg font-black uppercase italic tracking-tight">
                  {f.t}
                </h3>
                <p className="mt-1 text-sm" style={{ color: V.textMuted }}>
                  {f.d}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* secondary: agents (content is secondary now) */}
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tight sm:text-3xl">
              Sharpen up while you&apos;re here
            </h2>
            <p className="mt-1 text-sm" style={{ color: V.textMuted }}>
              Agent guides, map lineups, pro setups — all free.
            </p>
          </div>
          <Link
            href="/agents"
            className="text-sm font-black uppercase tracking-widest"
            style={{ color: V.red }}
          >
            All agents →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {STRIP.map((a) => (
            <Link
              key={a.slug}
              href={`/agents/${a.slug}`}
              className="group relative aspect-square overflow-hidden"
              style={{ border: `1px solid ${V.border}` }}
            >
              <Image
                src={agentIcon(a.uuid)}
                alt={a.name}
                width={120}
                height={120}
                className="h-full w-full object-cover grayscale transition-all duration-300 group-hover:grayscale-0 group-hover:scale-110"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* community CTA */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-14 text-center"
          style={{ background: V.bgDeep, border: `2px solid ${V.red}` }}
        >
          <Flame
            className="mx-auto h-8 w-8"
            style={{ color: V.red }}
          />
          <h2 className="mt-3 text-4xl font-black uppercase italic tracking-tight sm:text-6xl">
            Claim your <span style={{ color: V.red }}>profile</span>
          </h2>
          <p
            className="mx-auto mt-3 max-w-md text-sm"
            style={{ color: V.textMuted }}
          >
            Thousands of Indian players. One game. Build the profile that proves
            it — and win the monthly drop while you grind.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              onClick={() => trackCtaClick(CTA_SOURCES.inline_banner)}
              className="-skew-x-12 px-9 py-4 text-sm font-black uppercase tracking-widest"
              style={{ background: V.red, color: V.cream }}
            >
              <span className="inline-block skew-x-12">Create free profile</span>
            </Link>
            <Link
              href="/giveaway"
              className="border px-7 py-4 text-sm font-black uppercase tracking-widest"
              style={{ borderColor: V.borderLight, color: V.cream }}
            >
              Monthly giveaway
            </Link>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer
        className="border-t px-5 py-8"
        style={{ borderColor: V.border }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-center">
          <span className="text-lg font-black italic">
            gg<span style={{ color: V.red }}>Lobby</span>
          </span>
          <div
            className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs"
            style={{ color: V.textDim }}
          >
            <Link href="/agents">Agents</Link>
            <Link href="/maps">Maps</Link>
            <Link href="/giveaway">Giveaway</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
          <p
            className="max-w-xl text-[11px] leading-relaxed"
            style={{ color: V.textDim }}
          >
            ggLobby is not affiliated with or endorsed by Riot Games. VALORANT
            and all related assets are trademarks of Riot Games, Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
