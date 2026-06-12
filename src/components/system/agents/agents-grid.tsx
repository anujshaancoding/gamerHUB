"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AGENTS,
  ROLES,
  ROLE_META,
  DIFFICULTY_META,
  STARTER_PICKS,
  agentIcon,
  getAgent,
  type AgentRole,
  type Difficulty,
} from "@/lib/data/valorant-agents";

type RoleFilter = "All" | AgentRole;
type DiffFilter = "All" | Difficulty;

const DIFFS: Difficulty[] = [1, 2, 3];

export function AgentsGrid() {
  const [role, setRole] = useState<RoleFilter>("All");
  const [diff, setDiff] = useState<DiffFilter>("All");

  const roleFilters: RoleFilter[] = ["All", ...ROLES];
  const agents = AGENTS.filter(
    (a) =>
      (role === "All" || a.role === role) &&
      (diff === "All" || a.difficulty === diff)
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-2 flex items-center gap-3">
        <span className="h-6 w-1 rounded-full bg-primary" />
        <h1 className="text-3xl font-black uppercase tracking-tight text-text sm:text-4xl">
          Valorant Agents
        </h1>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-text-muted">
        Every agent, every ability, explained. Tap any agent for a full
        breakdown of their kit.
      </p>

      {/* New player guide */}
      <div className="mb-7 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-1 flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: `${DIFFICULTY_META[1].color}1f`,
              color: DIFFICULTY_META[1].color,
            }}
          >
            New to Valorant?
          </span>
        </div>
        <h2 className="text-lg font-black text-text sm:text-xl">
          Start with one of these three
        </h2>
        <p className="mb-4 mt-1 max-w-2xl text-sm text-text-muted">
          Don&apos;t pick by who looks coolest — your first agent should teach
          you the game, not fight you. Each of these covers a different job, so
          pick the one that sounds like how you want to play.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {STARTER_PICKS.map((pick) => {
            const agent = getAgent(pick.slug);
            if (!agent) return null;
            const color = ROLE_META[agent.role].color;
            return (
              <Link
                key={pick.slug}
                href={`/agents/${agent.slug}`}
                className="group flex gap-3 rounded-xl border border-border bg-background p-3 transition-all hover:border-[color:var(--hover)]"
                style={{ ["--hover" as string]: color }}
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
                  <Image
                    src={agentIcon(agent.uuid)}
                    alt={agent.name}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-text">
                    {agent.name}
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color }}
                    >
                      {agent.role}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
                    {pick.reason}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Role filter */}
      <div className="mb-3 flex flex-wrap gap-2">
        {roleFilters.map((f) => {
          const isActive = role === f;
          const c = f === "All" ? "var(--primary)" : ROLE_META[f].color;
          return (
            <button
              key={f}
              onClick={() => setRole(f)}
              className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-all"
              style={{
                borderColor: isActive ? c : "var(--border)",
                background: isActive ? `${c}1f` : "transparent",
                color: isActive ? c : "var(--text-muted)",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Difficulty filter */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-text-muted">
          Difficulty
        </span>
        {(["All", ...DIFFS] as DiffFilter[]).map((f) => {
          const isActive = diff === f;
          const c =
            f === "All" ? "var(--primary)" : DIFFICULTY_META[f].color;
          const label = f === "All" ? "All" : DIFFICULTY_META[f].label;
          return (
            <button
              key={String(f)}
              onClick={() => setDiff(f)}
              className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-all"
              style={{
                borderColor: isActive ? c : "var(--border)",
                background: isActive ? `${c}1f` : "transparent",
                color: isActive ? c : "var(--text-muted)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Active difficulty explanation */}
      {diff !== "All" && (
        <p className="mb-5 max-w-2xl text-xs leading-relaxed text-text-muted">
          {DIFFICULTY_META[diff].blurb}
        </p>
      )}
      {diff === "All" && <div className="mb-5" />}

      {agents.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-muted">
          No agents match that combination. Try widening the filters.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {agents.map((agent, i) => {
            const color = ROLE_META[agent.role].color;
            const d = DIFFICULTY_META[agent.difficulty];
            return (
              <motion.div
                key={agent.slug}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3) }}
              >
                <Link
                  href={`/agents/${agent.slug}`}
                  className="group relative block overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:border-[color:var(--hover)] hover:-translate-y-1"
                  style={{ ["--hover" as string]: color }}
                >
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(70% 70% at 50% 0%, ${color}30 0%, transparent 70%)`,
                    }}
                  />
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={agentIcon(agent.uuid)}
                      alt={agent.name}
                      width={240}
                      height={240}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <span
                      className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm"
                      style={{
                        background: `${d.color}26`,
                        color: d.color,
                        border: `1px solid ${d.color}59`,
                      }}
                      title={`${d.label} to learn`}
                    >
                      {d.label}
                    </span>
                  </div>
                  <div className="relative p-3">
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color }}
                    >
                      {agent.role}
                    </p>
                    <p className="truncate text-sm font-bold text-text">
                      {agent.name}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
