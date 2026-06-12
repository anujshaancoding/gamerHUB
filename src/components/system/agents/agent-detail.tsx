"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, MapPin, Lightbulb } from "lucide-react";
import {
  type Agent,
  type AbilityKey,
  ROLE_META,
  agentPortrait,
  agentBackground,
} from "@/lib/data/valorant-agents";
import { getMap, mapListIcon } from "@/lib/data/valorant-maps";
import { bestMapsForAgent, playstyleForAgent } from "@/lib/data/valorant-meta";

const SLIDE_MS = 4500;

/** Ability icon with a graceful fallback to the key letter when there is
 *  no resolved icon URL or the image fails to load. */
function AbilityIcon({
  src,
  fallback,
  className,
}: {
  src?: string;
  fallback: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  // Reset the error state when the source changes (the button keys are
  // stable C/Q/E/X across agents, so this component is reused).
  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) {
    return <span className="font-bold">{fallback}</span>;
  }

  return (
    <Image
      src={src}
      alt=""
      width={40}
      height={40}
      onError={() => setErrored(true)}
      className={className ?? "h-7 w-7 object-contain"}
    />
  );
}

/** Top 3 maps this agent is strongest on. */
function BestMaps({ slug, color }: { slug: string; color: string }) {
  const picks = bestMapsForAgent(slug);
  if (picks.length === 0) return null;

  return (
    <section className="mt-10 sm:mt-14">
      <h2 className="flex items-center gap-2 text-lg font-bold text-text sm:text-xl">
        <MapPin className="h-5 w-5" style={{ color }} />
        Best Maps
        <span className="text-sm font-normal text-text-dim">
          (top {picks.length})
        </span>
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        Where this agent&apos;s kit has the most impact.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {picks.map((pick, i) => {
          const map = getMap(pick.map);
          if (!map) return null;
          return (
            <Link
              key={pick.map}
              href={`/maps/${map.slug}`}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-surface/80 p-4 transition-colors hover:border-border-light"
            >
              <span
                className="absolute left-0 top-0 h-full w-1"
                style={{ background: color }}
              />
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-background sm:h-16 sm:w-16">
                <Image
                  src={mapListIcon(map.uuid)}
                  alt={map.name}
                  fill
                  sizes="64px"
                  className="object-cover opacity-90 transition-transform group-hover:scale-105"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color }}
                  >
                    #{i + 1}
                  </span>
                  <h3 className="truncate text-base font-bold text-text">
                    {map.name}
                  </h3>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {pick.reason}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** How to play / extract the most value from this agent. */
function HowToPlay({ slug, color }: { slug: string; color: string }) {
  const play = playstyleForAgent(slug);
  if (!play) return null;

  return (
    <section className="mt-10 sm:mt-14">
      <h2 className="flex items-center gap-2 text-lg font-bold text-text sm:text-xl">
        <Lightbulb className="h-5 w-5" style={{ color }} />
        How to Play
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
        {play.summary}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {play.tips.map((tip, i) => (
          <div
            key={i}
            className="relative flex gap-3 overflow-hidden rounded-2xl border border-border bg-surface/80 p-4"
          >
            <span
              className="absolute left-0 top-0 h-full w-1"
              style={{ background: color }}
            />
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums"
              style={{ background: `${color}1f`, color }}
            >
              {i + 1}
            </span>
            <p className="text-xs leading-relaxed text-text-secondary sm:text-sm">
              {tip}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AgentDetail({
  agent,
  abilityIcons = {},
}: {
  agent: Agent;
  abilityIcons?: Partial<Record<AbilityKey, string>>;
}) {
  const [active, setActive] = useState(0);
  const role = ROLE_META[agent.role];
  const color = role.color;
  const ability = agent.abilities[active];

  // Carousel: the two distinct large assets the CDN actually has —
  // the character render and the cinematic key art.
  const slides = [
    { src: agentPortrait(agent.uuid), kind: "portrait" as const },
    { src: agentBackground(agent.uuid), kind: "art" as const },
  ];
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setSlide((s) => (s + 1) % slides.length),
      SLIDE_MS
    );
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.uuid]);

  return (
    <div className="relative -m-4 lg:-m-6 min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.20]"
        style={{
          background: `radial-gradient(60% 60% at 75% 35%, ${color}55 0%, transparent 70%)`,
        }}
      />
      {/* Giant darkened agent silhouette — the "shadow" aesthetic */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[95%] sm:w-[75%] lg:w-[62%]">
        <Image
          src={agentPortrait(agent.uuid)}
          alt=""
          fill
          priority
          className="object-contain object-right-bottom opacity-[0.13] blur-[3px] saturate-0 brightness-[0.35] scale-110"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:py-5">
        <Link
          href="/agents"
          className="inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" /> All agents
        </Link>

        <div className="relative mt-3 grid items-center gap-6 lg:mt-3 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-0">
          {/* Left: identity + abilities — sits above the image (z-20) */}
          <div className="relative z-20 order-2 lg:order-1">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{ borderColor: `${color}66`, color }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: color }}
              />
              {agent.role}
            </span>

            <h1 className="mt-3 text-5xl font-black uppercase leading-[0.95] tracking-tight text-text sm:text-7xl lg:text-8xl">
              {agent.name}
            </h1>

            <p className="mt-3 max-w-xl text-base text-text-secondary sm:text-lg">
              {agent.tagline}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
              <span>
                <span className="text-text-dim">Origin</span>{" "}
                <span className="text-text">{agent.origin}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-text-dim">Difficulty</span>
                <span className="flex gap-1">
                  {[1, 2, 3].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-5 rounded-full"
                      style={{
                        background:
                          d <= agent.difficulty ? color : "var(--border-light)",
                      }}
                    />
                  ))}
                </span>
              </span>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-text-secondary">
              {agent.bio}
            </p>

            {/* Ability rail */}
            <div className="mt-7">
              <div className="flex gap-2 sm:gap-3">
                {agent.abilities.map((ab, i) => (
                  <button
                    key={ab.key}
                    onClick={() => setActive(i)}
                    aria-label={ab.name}
                    className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-lg font-bold transition-all sm:h-16 sm:w-16"
                    style={{
                      borderColor: i === active ? color : "var(--border)",
                      background:
                        i === active ? `${color}1f` : "var(--surface)",
                      color: i === active ? color : "var(--text-muted)",
                    }}
                  >
                    <AbilityIcon
                      src={abilityIcons[ab.key]}
                      fallback={ab.key}
                      className={`h-8 w-8 object-contain transition-opacity sm:h-9 sm:w-9 ${
                        i === active ? "opacity-100" : "opacity-55"
                      }`}
                    />
                    <span className="absolute bottom-1 right-1.5 text-[10px] font-bold leading-none opacity-70">
                      {ab.key}
                    </span>
                    {ab.kind === "Ultimate" && (
                      <span
                        className="absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                        style={{ background: color, color: "#0a0a0f" }}
                      >
                        ult
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: `${color}1f` }}
                      >
                        <AbilityIcon
                          src={abilityIcons[ability.key]}
                          fallback={ability.key}
                          className="h-7 w-7 object-contain"
                        />
                      </span>
                      <h3 className="text-xl font-bold text-text">
                        {ability.name}
                      </h3>
                    </div>
                    <span
                      className="rounded-md px-2 py-1 text-xs font-semibold"
                      style={{ background: `${color}1f`, color }}
                    >
                      {ability.cost}
                    </span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-wider text-text-dim">
                    {ability.kind} ability · key {ability.key}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    {ability.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right: auto-rotating hero carousel — behind the text (z-0),
              pulled left so the copy can overlap on top of it */}
          <div className="relative z-0 order-1 flex justify-center lg:order-2 lg:-ml-24 lg:justify-end xl:-ml-32">
            <div className="relative aspect-[4/5] w-[320px] sm:w-[460px] lg:w-[600px] lg:translate-x-2 xl:w-[720px] xl:translate-x-6 2xl:w-[800px]">
              <div
                className="absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{ background: `${color}45` }}
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  {slides[slide].kind === "portrait" ? (
                    <Image
                      src={slides[slide].src}
                      alt={`${agent.name} — Valorant ${agent.role}`}
                      fill
                      priority
                      sizes="(max-width: 1024px) 80vw, 50vw"
                      className="object-contain object-bottom drop-shadow-2xl"
                    />
                  ) : (
                    <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-border/60">
                      <Image
                        src={slides[slide].src}
                        alt={`${agent.name} key art`}
                        fill
                        sizes="(max-width: 1024px) 80vw, 50vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Carousel dots */}
              <div className="absolute bottom-1 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    aria-label={`Show ${slides[i].kind === "portrait" ? "agent render" : "key art"}`}
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: i === slide ? 22 : 8,
                      background: i === slide ? color : "var(--border-light)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <HowToPlay slug={agent.slug} color={color} />
        <BestMaps slug={agent.slug} color={color} />
      </div>
    </div>
  );
}
