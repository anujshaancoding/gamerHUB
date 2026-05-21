"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Trophy,
  CheckCircle2,
  Calendar,
  ArrowRightLeft,
  Crosshair,
  Wrench,
  MessagesSquare,
} from "lucide-react";

const tools = [
  {
    href: "/pro/events",
    title: "Tournament calendar",
    desc: "Upcoming and live Indian Valorant tournaments — VCT Challengers SA and more.",
    icon: Calendar,
    color: "#00d4ff",
  },
  {
    href: "/pro/compare",
    title: "Compare pros",
    desc: "Pick any two pros and see them head-to-head — stats and full setup.",
    icon: ArrowRightLeft,
    color: "#00ff88",
  },
  {
    href: "/pro/sens-converter",
    title: "Sensitivity converter",
    desc: "Convert your aim into Valorant from any game you play — cm/360° and eDPI included.",
    icon: Crosshair,
    color: "#00d4ff",
  },
];

const secondary = [
  {
    href: "/tools",
    title: "Gamer tools",
    desc: "FOV calc, crosshair gallery, rank percentile, tier list maker, more.",
    icon: Wrench,
    color: "#00ff88",
  },
  {
    href: "/forum",
    title: "Forum",
    desc: "Discussion threads by topic for the Indian Valorant scene.",
    icon: MessagesSquare,
    color: "#00d4ff",
  },
];

const findHere = [
  "National ranking with career peak rank, role and team",
  "Current-season stats: K/D, ADR/ACS, HS% and agent pool",
  "Full gear loadout: PC rig, headphones, mouse, keyboard, mousepad",
  "Sensitivity table + one-click crosshair code copy",
  "Tournament calendar — never miss a VCT Challengers SA fixture",
  "Compare tool — settle debates with stats and gear side-by-side",
  "Verified socials so you can follow your favourite pros",
];

export function ProLandingMotion() {
  return (
    <div className="relative -m-4 lg:-m-6 overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(0,255,136,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(45% 60% at 85% 15%, rgba(0,212,255,0.16) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            India&apos;s Valorant pro scene
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mt-4 text-4xl font-black uppercase leading-[0.95] tracking-tight text-text sm:text-6xl lg:text-7xl"
          >
            The{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Pro Scene
            </span>
            ,<br />
            in one place.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mx-auto mt-5 max-w-2xl text-base text-text-secondary sm:text-lg"
          >
            Rankings, detailed stats, peripherals, sensitivities and in-game
            settings for India&apos;s top Valorant pros — plus a tournament
            calendar and a head-to-head compare tool.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <Link
              href="/pros"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-background shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
            >
              View rankings <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pro/compare"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-bold uppercase tracking-wide text-text transition-all hover:-translate-y-0.5 hover:border-accent"
            >
              Compare pros
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl space-y-14 px-4 pb-20 sm:px-6">
        {/* Featured: Valorant rankings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/pros"
            className="group relative block overflow-hidden rounded-3xl border border-border bg-surface p-8 transition-all hover:-translate-y-1 hover:border-primary sm:p-10"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-70"
              style={{
                background:
                  "radial-gradient(60% 90% at 85% 20%, rgba(255,70,85,0.16) 0%, transparent 70%), radial-gradient(50% 80% at 10% 90%, rgba(0,255,136,0.12) 0%, transparent 70%)",
              }}
            />
            <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Live rankings
                </span>
                <h2 className="mt-4 text-3xl font-black uppercase tracking-tight text-text sm:text-4xl">
                  Valorant
                </h2>
                <p className="mt-2 max-w-md text-sm text-text-secondary sm:text-base">
                  India&apos;s top Valorant pros — agents, sensitivities,
                  crosshairs and full gear loadouts.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-bold text-primary transition-transform group-hover:translate-x-1">
                View rankings <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Tools */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-primary" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-text sm:text-3xl">
              Pro tools
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((t, i) => (
              <motion.div
                key={t.href}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.3) }}
              >
                <Link
                  href={t.href}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all hover:-translate-y-1"
                  style={{ ["--hover" as string]: t.color }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(70% 70% at 50% 0%, ${t.color}26 0%, transparent 70%)`,
                    }}
                  />
                  <div
                    className="relative flex h-12 w-12 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: `${t.color}55`,
                      background: `${t.color}1a`,
                      color: t.color,
                    }}
                  >
                    <t.icon className="h-6 w-6" />
                  </div>
                  <h3 className="relative mt-4 text-lg font-bold text-text">
                    {t.title}
                  </h3>
                  <p className="relative mt-1 flex-1 text-sm text-text-muted">
                    {t.desc}
                  </p>
                  <span
                    className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: t.color }}
                  >
                    Open <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Secondary links */}
        <section className="grid gap-4 sm:grid-cols-2">
          {secondary.map((s, i) => (
            <motion.div
              key={s.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
            >
              <Link
                href={s.href}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-1 hover:border-[color:var(--hover)]"
                style={{ ["--hover" as string]: s.color }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${s.color}55`,
                    background: `${s.color}1a`,
                  }}
                >
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-text">{s.title}</h3>
                  <p className="mt-0.5 text-xs text-text-muted">{s.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-text-dim transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ))}
        </section>

        {/* What you'll find here */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-primary/20 p-8 sm:p-10"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(50% 80% at 80% 20%, rgba(0,212,255,0.16), transparent 70%), radial-gradient(50% 80% at 10% 90%, rgba(0,255,136,0.14), transparent 70%)",
            }}
          />
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-text sm:text-3xl">
              What you&apos;ll find here
            </h2>
          </div>
          <ul className="relative mt-6 grid gap-3 sm:grid-cols-2">
            {findHere.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-text-secondary"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>
    </div>
  );
}
