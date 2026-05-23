// ggLobby V2 — Valorant patch hub data.
//
// CURATED EDITORIAL CONTENT. This is hand-maintained by the ggLobby team
// against the official Riot patch notes — it is intentionally NOT scraped, so
// each entry can be worded for SEO and reader value. To publish a new patch,
// prepend one ValorantPatch object to PATCHES (newest first). No code changes
// are needed anywhere else: routes, sitemap, metadata and the tier list all
// derive from this array.
//
// Agent slugs reference @/lib/data/valorant-agents; map slugs reference
// @/lib/data/valorant-maps. Keep them in sync with those files.

export type Tier = "S" | "A" | "B" | "C" | "D";

export const TIER_ORDER: Tier[] = ["S", "A", "B", "C", "D"];

export const TIER_META: Record<
  Tier,
  { label: string; blurb: string; className: string }
> = {
  S: {
    label: "S",
    blurb: "Meta-defining — pick or ban worthy on most maps.",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  A: {
    label: "A",
    blurb: "Strong and reliable — a safe pick into most comps.",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  B: {
    label: "B",
    blurb: "Solid situationally — map or comp dependent.",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  C: {
    label: "C",
    blurb: "Niche — needs a specific map or setup to shine.",
    className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  D: {
    label: "D",
    blurb: "Off-meta — outclassed by other picks right now.",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
};

export type ChangeKind = "buff" | "nerf" | "rework" | "new" | "neutral";

export const CHANGE_META: Record<
  ChangeKind,
  { label: string; className: string }
> = {
  buff: { label: "Buff", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  nerf: { label: "Nerf", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  rework: { label: "Rework", className: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  new: { label: "New", className: "bg-primary/15 text-primary border-primary/30" },
  neutral: { label: "Adjust", className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
};

export interface PatchChange {
  /** What changed — agent/map/weapon/system name. */
  subject: string;
  category: "agent" | "map" | "weapon" | "system";
  /** Agent, map or weapon slug, when the subject is one (drives links/art). */
  slug?: string;
  kind: ChangeKind;
  /** Concrete bullet notes, lifted/condensed from the official notes. */
  notes: string[];
}

export interface TierListSnapshot {
  /** Agent slugs grouped by tier (every active agent should appear once). */
  agents: Record<Tier, string[]>;
  /** Active-duty map pool grouped by how favourable they currently play. */
  maps: Record<Tier, string[]>;
}

export interface ValorantPatch {
  /** Riot version string, e.g. "11.00". */
  version: string;
  /** URL slug, e.g. "11-00". */
  slug: string;
  /** Display title, e.g. "Patch 11.00". */
  title: string;
  /** Release date, ISO (YYYY-MM-DD). */
  date: string;
  /** 1–2 sentence editorial overview for cards + meta description. */
  summary: string;
  /** 3–5 TL;DR bullets. */
  headline: string[];
  changes: PatchChange[];
  /** Meta tier list as of this patch. */
  tierList: TierListSnapshot;
  /** Link to the official Riot patch notes for verification. */
  source: string;
}

// ─── Patches (newest first) ─────────────────────────────────────────────────

export const PATCHES: ValorantPatch[] = [
  {
    version: "12.09",
    slug: "12-09",
    title: "Patch 12.09",
    date: "2026-05-12",
    summary:
      "A balance-pass patch ahead of the next ranked stretch: Neon loses her airborne speed and bunny-hop entry, and every shotgun becomes far less reliable on the move. AMD Anti-Lag 2 support and a round of agent bug fixes round it out.",
    headline: [
      "Neon's High Gear no longer grants air speed — the bunny-hop entry is gone.",
      "All shotguns are far less accurate while moving; Bucky, Judge and Shorty take direct nerfs.",
      "Bucky's close-range pellet damage cut across the board.",
      "AMD Anti-Lag 2 support added to reduce input latency on supported hardware.",
    ],
    changes: [
      {
        subject: "Neon",
        category: "agent",
        slug: "neon",
        kind: "nerf",
        notes: [
          "High Gear no longer grants a speed bonus while airborne — sprint air speed now matches melee speed, removing the bunny-hop entry.",
          "High Gear fuel only regenerates on kills while Overdrive is active; passive regeneration is unchanged.",
          "Slide VFX updated so its direction and origin read more clearly.",
        ],
      },
      {
        subject: "Bucky",
        category: "weapon",
        slug: "bucky",
        kind: "nerf",
        notes: [
          "Close-range pellet damage (0–8 m) cut — head 40 → 34, body 20 → 17, legs 17 → 14.",
          "Moving spread sharply increased: walking 0.075 → 1.0, running 0.1 → 2.0, jumping 1.25 → 4.0.",
          "Minimum spread increased 2.6 → 3.0.",
        ],
      },
      {
        subject: "Judge",
        category: "weapon",
        slug: "judge",
        kind: "nerf",
        notes: [
          "Moving spread sharply increased: walking 0.075 → 1.0, running 0.75 → 2.0, jumping 2.25 → 4.0.",
          "Minimum spread increased 2.25 → 2.5 (PC only until Patch 12.11).",
        ],
      },
      {
        subject: "Shorty",
        category: "weapon",
        slug: "shorty",
        kind: "nerf",
        notes: [
          "Fire rate reduced 3.33 → 3.0 rounds per second.",
          "Moving spread sharply increased: walking 0.075 → 1.0, running 0.1 → 2.0, jumping 1.25 → 4.0.",
        ],
      },
      {
        subject: "AMD Anti-Lag 2",
        category: "system",
        kind: "new",
        notes: [
          "Added support for AMD Anti-Lag 2 to cut input latency in GPU-bound scenarios.",
          "Requires compatible AMD hardware and graphics drivers from March 9, 2026 or later.",
        ],
      },
      {
        subject: "Matchmaking",
        category: "system",
        kind: "neutral",
        notes: [
          "Riot is testing MMR tuning for modes beyond Competitive, Unrated and Swiftplay for more consistent games.",
          "Agent bug fixes this patch: Chamber, Jett, Sage, Viper and a Neon Fast Lane exploit.",
        ],
      },
    ],
    tierList: {
      agents: {
        S: ["jett", "sova", "omen", "killjoy"],
        A: ["raze", "skye", "kayo", "viper", "cypher", "fade"],
        B: [
          "breach",
          "gekko",
          "brimstone",
          "astra",
          "clove",
          "chamber",
          "sage",
          "vyse",
          "neon",
        ],
        C: ["phoenix", "reyna", "iso", "harbor", "deadlock"],
        D: ["yoru", "miks"],
      },
      maps: {
        S: ["ascent", "lotus"],
        A: ["haven", "pearl"],
        B: ["split", "fracture"],
        C: ["breeze"],
        D: [],
      },
    },
    source:
      "https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-12-09/",
  },
  {
    version: "11.00",
    slug: "11-00",
    title: "Patch 11.00",
    date: "2026-05-13",
    summary:
      "The Act start shakes up the controller meta: Clove and Vyse take direct nerfs, Sunset returns to the competitive pool and the Outlaw gets a small economy bump. Initiators remain the backbone of the meta.",
    headline: [
      "Clove's Pick-me-up haste duration cut — solo-controller tempo toned down.",
      "Vyse's Razorvine and Arc Rose costs up; her ambush setups are more committal.",
      "Sunset rotated back into the competitive map pool; Fracture out.",
      "Outlaw price down to 2200 — the double-Op eco gets a touch stronger.",
    ],
    changes: [
      {
        subject: "Clove",
        category: "agent",
        slug: "clove",
        kind: "nerf",
        notes: [
          "Pick-me-up haste duration reduced 5s → 4s.",
          "Not Dead Yet revive window reduced; you must commit sooner after death.",
        ],
      },
      {
        subject: "Vyse",
        category: "agent",
        slug: "vyse",
        kind: "nerf",
        notes: [
          "Razorvine cost increased 100 → 200.",
          "Arc Rose now a single charge by default (was two).",
        ],
      },
      {
        subject: "Cypher",
        category: "agent",
        slug: "cypher",
        kind: "buff",
        notes: [
          "Trapwire reveal duration increased — easier to convert flank info into a trade.",
        ],
      },
      {
        subject: "Sunset",
        category: "map",
        slug: "sunset",
        kind: "neutral",
        notes: [
          "Rotated back into the competitive / ranked map pool.",
          "Minor mid-courtyard cover adjustments to ease attacker mid takes.",
        ],
      },
      {
        subject: "Fracture",
        category: "map",
        slug: "fracture",
        kind: "neutral",
        notes: ["Rotated out of the competitive pool this Act."],
      },
      {
        subject: "Outlaw",
        category: "weapon",
        slug: "outlaw",
        kind: "buff",
        notes: ["Price reduced 2400 → 2200 to make the double-Op buy more viable."],
      },
    ],
    tierList: {
      agents: {
        S: ["jett", "sova", "omen", "killjoy"],
        A: ["raze", "skye", "kayo", "viper", "cypher", "fade", "neon"],
        B: ["breach", "gekko", "brimstone", "astra", "clove", "chamber", "sage", "vyse"],
        C: ["phoenix", "reyna", "iso", "harbor", "deadlock"],
        D: ["yoru", "miks"],
      },
      maps: {
        S: ["ascent", "lotus"],
        A: ["haven", "split", "sunset"],
        B: ["icebox", "pearl"],
        C: ["bind", "abyss"],
        D: ["breeze"],
      },
    },
    source: "https://playvalorant.com/en-us/news/game-updates/",
  },
];

// ─── Accessors ──────────────────────────────────────────────────────────────

/** All patches, newest first (PATCHES is maintained in that order). */
export function getAllPatches(): ValorantPatch[] {
  return PATCHES;
}

/** The current/most recent patch. */
export function getLatestPatch(): ValorantPatch | null {
  return PATCHES[0] ?? null;
}

export function getPatch(slug: string): ValorantPatch | null {
  return PATCHES.find((p) => p.slug === slug) ?? null;
}

/** Slugs for generateStaticParams + sitemap. */
export function getAllPatchSlugs(): string[] {
  return PATCHES.map((p) => p.slug);
}
