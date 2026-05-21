"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Flame, Zap, ArrowRight, TrendingUp } from "lucide-react";
import { VALORANT as V } from "@/lib/theme/valorant-theme";
import { AGENTS, agentPortrait, agentIcon } from "@/lib/data/valorant-agents";
import { MAPS, mapSplash } from "@/lib/data/valorant-maps";
import { DemoSwitcher } from "@/components/demo/demo-switcher";

const HERO = AGENTS.find((a) => a.slug === "neon")!;
const GRID = ["jett", "raze", "reyna", "phoenix", "sova", "killjoy", "viper", "omen", "sage", "cypher"]
  .map((s) => AGENTS.find((a) => a.slug === s)!)
  .filter(Boolean);
const MAP3 = ["ascent", "bind", "haven"]
  .map((s) => MAPS.find((m) => m.slug === s)!)
  .filter(Boolean);

const TICKER = [
  "PATCH 8.11 IS LIVE",
  "VIPER STILL S-TIER ON SPLIT",
  "NEW CROSSHAIRS ADDED",
  "MONTHLY DROP: 5 DAYS LEFT",
  "ASCENT LINEUPS UPDATED",
];

export default function StreetDemo() {
  return (
    <div style={{ background: V.bg }} className="overflow-hidden">
      {/* ticker */}
      <div
        className="flex items-center gap-8 overflow-hidden border-b py-2"
        style={{ background: V.red, borderColor: V.redDark }}
      >
        <motion.div
          className="flex shrink-0 gap-8 whitespace-nowrap text-xs font-black uppercase tracking-widest"
          style={{ color: V.bg }}
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-8">
              {t} <Zap className="h-3 w-3 fill-current" />
            </span>
          ))}
        </motion.div>
      </div>

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <span className="text-2xl font-black uppercase italic tracking-tight">
          gg<span style={{ color: V.red }}>Lobby</span>
        </span>
        <Link
          href="/register"
          className="-skew-x-12 border-2 px-5 py-2 text-sm font-black uppercase italic tracking-wider"
          style={{ borderColor: V.red, color: V.red }}
        >
          <span className="inline-block skew-x-12">Join the squad</span>
        </Link>
      </header>

      {/* hero collage */}
      <section className="relative mx-auto max-w-7xl px-5 pb-10 pt-4">
        <div className="grid items-center gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="relative z-10">
            <div
              className="-skew-x-12 inline-block px-3 py-1 text-xs font-black uppercase tracking-widest"
              style={{ background: V.red, color: V.bg }}
            >
              <span className="inline-block skew-x-12">
                The Indian VALORANT community
              </span>
            </div>
            <h1 className="mt-5 text-6xl font-black uppercase italic leading-[0.82] tracking-tighter sm:text-8xl">
              Run it
              <br />
              <span
                style={{
                  WebkitTextStroke: `2px ${V.red}`,
                  color: "transparent",
                }}
              >
                back.
              </span>
            </h1>
            <p
              className="mt-6 max-w-md text-base sm:text-lg"
              style={{ color: V.textMuted }}
            >
              Lineups, agent tech, pro setups and the loudest VALORANT community
              in India. No fluff. Just frags.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/agents"
                className="group flex -skew-x-12 items-center gap-2 px-7 py-3.5 text-sm font-black uppercase tracking-wider"
                style={{ background: V.red, color: V.cream }}
              >
                <span className="flex skew-x-12 items-center gap-2">
                  Let&apos;s go <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link
                href="/giveaway"
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-black uppercase tracking-wider"
                style={{ color: V.cream }}
              >
                <Flame className="h-4 w-4" style={{ color: V.red }} /> Monthly
                drop
              </Link>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div
              className="absolute inset-0 -skew-y-6"
              style={{
                background: `linear-gradient(135deg, ${V.red}22, transparent)`,
                zIndex: 0,
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <Image
                src={agentPortrait(HERO.uuid)}
                alt={HERO.name}
                width={680}
                height={900}
                priority
                className="relative h-auto w-[320px] drop-shadow-2xl sm:w-[440px] lg:w-[520px]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* agent grid */}
      <section className="mx-auto max-w-7xl px-5 py-10">
        <h2 className="mb-6 text-3xl font-black uppercase italic tracking-tight">
          Pick your <span style={{ color: V.red }}>main</span>
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-10">
          {GRID.map((a) => (
            <Link
              key={a.slug}
              href={`/agents/${a.slug}`}
              className="group relative aspect-[3/4] overflow-hidden"
              style={{ border: `1px solid ${V.border}` }}
            >
              <Image
                src={agentIcon(a.uuid)}
                alt={a.name}
                width={140}
                height={186}
                className="h-full w-full object-cover grayscale transition-all duration-300 group-hover:grayscale-0 group-hover:scale-105"
              />
              <div
                className="absolute inset-x-0 bottom-0 -skew-y-3 px-1 py-1 text-center text-[10px] font-black uppercase opacity-0 transition-opacity group-hover:opacity-100"
                style={{ background: V.red, color: V.bg }}
              >
                {a.name}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* meta + maps split */}
      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-10 lg:grid-cols-2">
        <div
          className="rounded-xl p-6"
          style={{ background: V.surface, border: `1px solid ${V.border}` }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: V.red }} />
            <h3 className="text-xl font-black uppercase italic tracking-tight">
              Live meta
            </h3>
          </div>
          <div className="mt-4 space-y-2">
            {[
              ["S", "Viper", "Controller"],
              ["S", "Jett", "Duelist"],
              ["A", "Killjoy", "Sentinel"],
              ["A", "Sova", "Initiator"],
            ].map(([tier, name, role]) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded px-3 py-2"
                style={{ background: V.bgDeep }}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center text-sm font-black"
                  style={{
                    background: tier === "S" ? V.red : V.surfaceLight,
                    color: tier === "S" ? V.bg : V.cream,
                  }}
                >
                  {tier}
                </span>
                <span className="flex-1 font-bold">{name}</span>
                <span
                  className="text-xs font-bold uppercase"
                  style={{ color: V.textDim }}
                >
                  {role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {MAP3.map((m) => (
            <Link
              key={m.slug}
              href={`/maps/${m.slug}`}
              className="group relative overflow-hidden rounded-xl"
              style={{ border: `1px solid ${V.border}` }}
            >
              <Image
                src={mapSplash(m.uuid)}
                alt={m.name}
                width={300}
                height={400}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${V.bgDeep} 0%, transparent 60%)`,
                }}
              />
              <span className="absolute bottom-3 left-0 right-0 text-center text-sm font-black uppercase italic">
                {m.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* big community CTA */}
      <section className="relative mx-auto max-w-7xl px-5 py-16">
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-14 text-center"
          style={{ background: V.bgDeep, border: `2px solid ${V.red}` }}
        >
          <h2 className="text-4xl font-black uppercase italic tracking-tight sm:text-6xl">
            This is <span style={{ color: V.red }}>your</span> lobby now
          </h2>
          <p
            className="mx-auto mt-3 max-w-md text-sm"
            style={{ color: V.textMuted }}
          >
            Thousands of Indian players. One game. Endless grind. Get in.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-block -skew-x-12 px-9 py-4 text-sm font-black uppercase tracking-widest"
            style={{ background: V.red, color: V.cream }}
          >
            <span className="inline-block skew-x-12">Create free profile</span>
          </Link>
        </div>
      </section>

      <DemoSwitcher />
    </div>
  );
}
