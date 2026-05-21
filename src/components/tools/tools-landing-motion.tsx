"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
  ChevronRight,
  MessagesSquare,
} from "lucide-react";

type Tool = {
  href: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: string;
};

const tools: Tool[] = [
  {
    href: "/pro/sens-converter",
    title: "Sensitivity converter",
    desc: "Convert your aim into Valorant from any game you play. eDPI and cm/360° included.",
    icon: Crop,
    color: "#00d4ff",
  },
  {
    href: "/tools/fov",
    title: "FOV calculator",
    desc: "Convert FOV between games — horizontal, vertical, 4:3 stretched and aspect-ratio scaling.",
    icon: Crop,
    color: "#00d4ff",
  },
  {
    href: "/crosshairs",
    title: "Pro crosshair gallery",
    desc: "Every Indian Valorant pro's crosshair code — one-click copy straight into the game.",
    icon: Crosshair,
    color: "#00ff88",
    badge: "Valorant",
  },
  {
    href: "/tools/sens-share",
    title: "Community sens share",
    desc: "Upload your full Valorant sens. Browse top configs by playstyle and rank.",
    icon: Smartphone,
    color: "#00ff88",
    badge: "New",
  },
  {
    href: "/tools/monitor",
    title: "Monitor & Hz guide",
    desc: "Refresh rate, response time, input lag, viewing distance — what actually matters for FPS.",
    icon: Monitor,
    color: "#00d4ff",
  },
  {
    href: "/tools/rank-percentile",
    title: "Rank percentile",
    desc: "See what % of players you're above in Valorant ranked.",
    icon: BarChart3,
    color: "#00ff88",
  },
  {
    href: "/tier-list",
    title: "Tier list maker",
    desc: "Drag-and-drop tier list builder. Export a shareable image for Twitter / Discord.",
    icon: ListOrdered,
    color: "#00d4ff",
  },
  {
    href: "/tools/skin-estimator",
    title: "Valorant skin estimator",
    desc: "Estimate how much you've spent on Valorant skins — paste your bundle list and see the total.",
    icon: Coins,
    color: "#00ff88",
    badge: "Valorant",
  },
  {
    href: "/pro/events",
    title: "Tournament pick'em",
    desc: "Predict matches for BMPS, VCT Challengers SA and FFWS India. Climb the live leaderboard.",
    icon: Trophy,
    color: "#00d4ff",
    badge: "Live events",
  },
];

export function ToolsLandingMotion() {
  return (
    <div className="relative -m-4 lg:-m-6 overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-14 pb-14 sm:px-6 sm:pt-20 sm:pb-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(0,212,255,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(45% 60% at 15% 15%, rgba(0,255,136,0.16) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Free gamer utilities
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mt-4 text-4xl font-black uppercase leading-[0.95] tracking-tight text-text sm:text-6xl lg:text-7xl"
          >
            Gamer{" "}
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Tools
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mx-auto mt-5 max-w-2xl text-base text-text-secondary sm:text-lg"
          >
            Every utility in one place — sens converter, FOV calc, pro crosshair
            codes, rank percentile, tier list maker, and more. All free, no
            sign-up needed unless you want to publish something.
          </motion.p>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl space-y-12 px-4 pb-20 sm:px-6">
        {/* Tool grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t, i) => (
            <motion.div
              key={t.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
            >
              <Link
                href={t.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:border-[color:var(--hover)]"
                style={{ ["--hover" as string]: t.color }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(70% 70% at 50% 0%, ${t.color}26 0%, transparent 70%)`,
                  }}
                />
                <div className="relative flex items-start justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: `${t.color}55`,
                      background: `${t.color}1a`,
                      color: t.color,
                    }}
                  >
                    <t.icon className="h-6 w-6" />
                  </div>
                  {t.badge && (
                    <span
                      className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{
                        borderColor: `${t.color}55`,
                        background: `${t.color}1a`,
                        color: t.color,
                      }}
                    >
                      {t.badge}
                    </span>
                  )}
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

        {/* Forum CTA */}
        <motion.div
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
          <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <MessagesSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-text sm:text-2xl">
                  Want a discussion section instead?
                </h2>
                <p className="mt-2 max-w-xl text-sm text-text-secondary">
                  Talk pro scene, hardware, scrim hunts or just shitpost — head
                  over to the Forum. Threaded discussions with sections per
                  topic and nested replies.
                </p>
              </div>
            </div>
            <Link
              href="/forum"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-bold text-primary transition-transform hover:translate-x-1"
            >
              Open Forum <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
