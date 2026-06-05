// "Best agents for your rank" recommendation layer. Pure editorial mapping —
// no API, no DB. Each (rank band, role) combination yields an ordered list of
// agent slugs with a short "why this works at this rank" blurb. Slugs reference
// the existing dataset in src/lib/data/valorant-agents.ts.

import { AGENTS, type AgentRole } from "@/lib/data/valorant-agents";

export const RANK_BANDS = [
  "iron",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "ascendant",
  "immortal",
  "radiant",
] as const;
export type RankBand = (typeof RANK_BANDS)[number];

export const RANK_BAND_LABEL: Record<RankBand, string> = {
  iron: "Iron",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
  ascendant: "Ascendant",
  immortal: "Immortal",
  radiant: "Radiant",
};

export const ROLE_SLUGS = ["duelist", "initiator", "controller", "sentinel"] as const;
export type RoleSlug = (typeof ROLE_SLUGS)[number];

export const ROLE_LABEL: Record<RoleSlug, AgentRole> = {
  duelist: "Duelist",
  initiator: "Initiator",
  controller: "Controller",
  sentinel: "Sentinel",
};

export interface AgentRec {
  slug: string;
  why: string;
}

// Skill bands used to choose recommendations. Low ranks favour simple,
// self-sufficient kits; high ranks favour utility that rewards coordination.
type Band = "low" | "mid" | "high";
function bandFor(rank: RankBand): Band {
  if (["iron", "bronze", "silver"].includes(rank)) return "low";
  if (["gold", "platinum", "diamond"].includes(rank)) return "mid";
  return "high";
}

// Per-role recommendations keyed by skill band. Slugs must exist in AGENTS.
const RECS: Record<RoleSlug, Record<Band, AgentRec[]>> = {
  duelist: {
    low: [
      { slug: "reyna", why: "Self-heals and dismisses on kills — forgiving when your aim wins fights but your positioning doesn't." },
      { slug: "phoenix", why: "Self-contained kit: heal, flash, wall. You can make plays without relying on teammates." },
      { slug: "raze", why: "Nades and Boom Bot do damage for you — great for clearing corners at lower ranks." },
    ],
    mid: [
      { slug: "jett", why: "Mobility and Updraft reward map knowledge and crosshair placement that click in mid ranks." },
      { slug: "raze", why: "Satchel plays and util damage scale well once you learn lineups and timings." },
      { slug: "phoenix", why: "Flexible solo-impact agent that still works when team coordination is patchy." },
    ],
    high: [
      { slug: "jett", why: "The competitive standard duelist — dash entries and Op plays demand and reward precision." },
      { slug: "raze", why: "Highest util damage in the role; satchel movement is a high-skill-ceiling weapon." },
      { slug: "neon", why: "Fast aggressive entries punish slow rotations — strong in coordinated high-rank play." },
    ],
  },
  initiator: {
    low: [
      { slug: "skye", why: "Flashes plus a healing dog — easy value even if your team isn't communicating." },
      { slug: "breach", why: "Stuns and flashes through walls create free space without precise lineups." },
    ],
    mid: [
      { slug: "sova", why: "Recon darts give you info to win rounds — lineups start paying off around mid ranks." },
      { slug: "skye", why: "Flash + info + heal flexibility makes you useful on any comp as you climb." },
      { slug: "kayo", why: "Suppression and flashes shut down enemy util — strong once you understand timings." },
    ],
    high: [
      { slug: "sova", why: "Mastered recon and shock-dart lineups are a high-rank win condition." },
      { slug: "fade", why: "Reveals + decay enable coordinated executes that high-rank teams convert." },
      { slug: "kayo", why: "Knife suppression neutralises enemy abilities in tightly-played rounds." },
    ],
  },
  controller: {
    low: [
      { slug: "brimstone", why: "Point-and-click smokes from the map — no lineups to learn, perfect for beginners." },
      { slug: "omen", why: "Reposition smokes anywhere on the map; flexible and forgiving to learn." },
    ],
    mid: [
      { slug: "omen", why: "TP plays and dynamic smokes reward the game sense you build in mid ranks." },
      { slug: "viper", why: "Wall + Orb control whole sites — high value once you learn standard setups." },
    ],
    high: [
      { slug: "viper", why: "Post-plant control and one-ways are a meta staple in high-rank executes." },
      { slug: "omen", why: "Flexible smokes plus TP info plays scale with coordinated teams." },
      { slug: "astra", why: "Pre-placed stars enable scripted executes that high-rank teams run." },
    ],
  },
  sentinel: {
    low: [
      { slug: "sage", why: "Wall, slows, heal and a revive — the most beginner-friendly defensive kit in the game." },
      { slug: "killjoy", why: "Set-and-forget turret and alarm bot hold angles for you while you learn." },
    ],
    mid: [
      { slug: "killjoy", why: "Lockdown and util placement anchor sites — rewards the map sense you gain mid-climb." },
      { slug: "cypher", why: "Trips and cam give flank info; strong once you learn common setups." },
    ],
    high: [
      { slug: "cypher", why: "Information control and dry-peel flank watch are high-rank fundamentals." },
      { slug: "killjoy", why: "Ultimate and util placements swing high-rank post-plant rounds." },
      { slug: "chamber", why: "Aggressive sentinel peeks with TP/teleport reward strong aim at high ranks." },
    ],
  },
};

export function recsFor(rank: RankBand, role: RoleSlug): AgentRec[] {
  const band = bandFor(rank);
  const list = RECS[role][band] ?? [];
  // Only return slugs that resolve to a real agent (guards against drift).
  return list.filter((r) => AGENTS.some((a) => a.slug === r.slug));
}

export function isRankBand(v: string | undefined | null): v is RankBand {
  return !!v && (RANK_BANDS as readonly string[]).includes(v);
}
export function isRoleSlug(v: string | undefined | null): v is RoleSlug {
  return !!v && (ROLE_SLUGS as readonly string[]).includes(v);
}
