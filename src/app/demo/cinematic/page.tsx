"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Map, Gift, Play } from "lucide-react";
import { VALORANT as V } from "@/lib/theme/valorant-theme";
import {
  AGENTS,
  agentPortrait,
  agentBackground,
} from "@/lib/data/valorant-agents";
import { DemoSwitcher } from "@/components/demo/demo-switcher";

const SHOW = ["jett", "reyna", "sova", "viper", "neon"]
  .map((s) => AGENTS.find((a) => a.slug === s)!)
  .filter(Boolean);

export default function CinematicDemo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % SHOW.length), 4000);
    return () => clearInterval(t);
  }, []);
  const agent = SHOW[i];

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{ background: V.bgDeep }}
    >
      {/* rotating key art bg */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${i}`}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 0.35, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1 }}
          className="absolute inset-0"
        >
          <Image
            src={agentBackground(agent.uuid)}
            alt=""
            fill
            priority
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(80% 80% at 50% 40%, transparent 0%, ${V.bgDeep} 75%)`,
        }}
      />

      {/* nav */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <span className="text-2xl font-black uppercase tracking-tight">
          gg<span style={{ color: V.red }}>Lobby</span>
        </span>
        <Link
          href="/register"
          className="text-sm font-black uppercase tracking-[0.2em]"
          style={{ color: V.cream }}
        >
          Sign up →
        </Link>
      </header>

      {/* center stage */}
      <section className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-6 px-6 lg:grid-cols-2">
        <div>
          <motion.p
            key={`role-${i}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-black uppercase tracking-[0.4em]"
            style={{ color: V.red }}
          >
            {agent.role} · {agent.origin}
          </motion.p>
          <AnimatePresence mode="wait">
            <motion.h1
              key={`name-${i}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
              className="mt-3 text-7xl font-black uppercase leading-[0.8] tracking-tighter sm:text-9xl"
            >
              {agent.name}
            </motion.h1>
          </AnimatePresence>
          <p
            className="mt-6 max-w-sm text-base"
            style={{ color: V.textMuted }}
          >
            The complete VALORANT companion for the Indian community. Master
            every agent. Then enter the lobby.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/agents"
              className="flex items-center gap-3 rounded-full px-8 py-4 text-sm font-black uppercase tracking-widest"
              style={{ background: V.red, color: V.cream }}
            >
              <Play className="h-4 w-4 fill-current" /> Enter the lobby
            </Link>
            <div className="flex gap-1.5">
              {SHOW.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setI(idx)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: idx === i ? 28 : 10,
                    background: idx === i ? V.red : V.border,
                  }}
                  aria-label={`Agent ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative hidden justify-center lg:flex">
          <AnimatePresence mode="wait">
            <motion.div
              key={`art-${i}`}
              initial={{ opacity: 0, scale: 0.92, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.96, x: -30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Image
                src={agentPortrait(agent.uuid)}
                alt={agent.name}
                width={820}
                height={1080}
                priority
                className="h-auto w-[560px] drop-shadow-2xl xl:w-[680px]"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* floating community bar */}
      <div className="relative z-20 mx-auto mb-8 w-full max-w-7xl px-6">
        <div
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-4 backdrop-blur"
          style={{
            background: `${V.surface}cc`,
            border: `1px solid ${V.border}`,
          }}
        >
          <p
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: V.textMuted }}
          >
            Join the <span style={{ color: V.cream }}>community</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/agents", icon: Swords, l: "Agents" },
              { href: "/maps", icon: Map, l: "Lineups" },
              { href: "/giveaway", icon: Gift, l: "Giveaway" },
            ].map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-wider"
                style={{ background: V.bgDeep, color: V.cream }}
              >
                <x.icon className="h-4 w-4" style={{ color: V.red }} /> {x.l}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <DemoSwitcher />
    </div>
  );
}
