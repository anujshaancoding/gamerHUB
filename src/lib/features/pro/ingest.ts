/**
 * Pro-scene ingest — direct vlr.gg scrape edition.
 *
 * Serverless replacement for infra/ingest/vlr-ingest.mjs. Instead of hitting a
 * self-hosted vlrggapi, it scrapes vlr.gg directly (see ./vlr-scrape) and runs
 * the SAME upserts the .mjs ingest does: pro_ingest_runs row, pro_players
 * (ON CONFLICT(slug) WHERE data_source='vlr'), flip is_current, then
 * pro_player_stats (ON CONFLICT(player_id, season)).
 *
 * Provenance is preserved: only rows we own (data_source='vlr') are touched;
 * hand-curated ('manual') players are never overwritten (match by slug).
 *
 * The helper functions (num/intOf/clutchAttempts/slugify/agentsOf) and the
 * normalize() mapping are ported verbatim from infra/ingest/vlr-ingest.mjs.
 *
 * The stats page is the SAME world board whether or not a country is requested
 * (vlr's `country=` param is a no-op there — see ./vlr-scrape), so we scrape it
 * ONCE and derive the India list by the per-row flag. World rank = world order;
 * national rank = order among India-flagged rows.
 */

import { getPool } from "@/lib/db/index";
import { scrapeVlrStats, type Segment } from "./vlr-scrape";

const SOURCE_URL = "vlr.gg-direct";

// ── Coercion helpers (ported verbatim from infra/ingest/vlr-ingest.mjs) ────────

// vlr values arrive as strings, sometimes with a trailing % or as "" — coerce.
function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace("%", "").trim();
  if (s === "" || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function intOf(v: unknown): number | null {
  const n = num(v);
  return n === null ? null : Math.round(n);
}
// "12/35" (won/attempts) -> 35; bare number -> that number.
function clutchAttempts(v: unknown): number | null {
  if (v == null) return null;
  const m = String(v).match(/\/\s*(\d+)/);
  if (m) return Number(m[1]);
  return intOf(v);
}
function slugify(s: unknown): string {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function agentsOf(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === "string" && v.trim()) return v.split(/[,\s]+/).filter(Boolean);
  return [];
}

// ── Normalized record (ported verbatim, + scraped country) ─────────────────────

interface NormalizedPlayer {
  ign: string;
  org: string | null;
  slug: string;
  agents: string[];
  rounds_played: number | null;
  rating: number | null;
  acs: number | null;
  k_d_ratio: number | null;
  kast_pct: number | null;
  adr: number | null;
  kpr: number | null;
  apr: number | null;
  fkpr: number | null;
  fdpr: number | null;
  hs_pct: number | null;
  clutch_pct: number | null;
  clutch_attempts: number | null;
  /** Per-row flag ISO-2 from the scrape (e.g. "in"); used for India filtering. */
  flag: string | null;
  world_rank?: number | null;
  national_rank?: number | null;
  country?: string | null;
}

// Map one vlr segment -> normalized record we control.
function normalize(seg: Segment): NormalizedPlayer {
  const ign = (seg.player || "").trim();
  return {
    ign,
    org: (seg.org || "").trim() || null,
    slug: slugify(ign),
    agents: agentsOf(seg.agents),
    rounds_played: intOf(seg.rounds_played),
    rating: num(seg.rating),
    acs: num(seg.average_combat_score),
    k_d_ratio: num(seg.kill_deaths),
    kast_pct: num(seg.kill_assists_survived_traded),
    adr: num(seg.average_damage_per_round),
    kpr: num(seg.kills_per_round),
    apr: num(seg.assists_per_round),
    fkpr: num(seg.first_kills_per_round),
    fdpr: num(seg.first_deaths_per_round),
    hs_pct: num(seg.headshot_percentage),
    clutch_pct: num(seg.clutch_success_percentage),
    clutch_attempts: clutchAttempts(seg.clutch_attempts),
    flag: seg.country,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export interface RunProIngestArgs {
  /** When false, scrape + merge + report but write nothing (dry run). */
  apply: boolean;
  /** How many world players to keep (default 50). */
  worldLimit?: number;
  /** How many india players to keep (default 50). */
  indiaLimit?: number;
  /** 'all' or days (default '90'). Becomes the season key `vlr-<timespan>`. */
  timespan?: string;
}

export interface RunProIngestResult {
  playersUpserted: number;
  statsUpserted: number;
  worldCount: number;
  indiaCount: number;
  uniqueCount: number;
  applied: boolean;
  /** Present only on a dry run — a small preview of the merged set. */
  preview?: Array<{
    ign: string;
    org: string | null;
    rating: number | null;
    acs: number | null;
    kast: number | null;
    world: number | null;
    india: number | null;
  }>;
}

/**
 * Scrape vlr.gg once, derive world + India lists, merge, and run the upserts.
 * On `apply: false` nothing is written and a preview of the top merged rows is
 * returned instead.
 */
export async function runProIngest(args: RunProIngestArgs): Promise<RunProIngestResult> {
  const apply = args.apply;
  const worldLimit = args.worldLimit ?? 50;
  const indiaLimit = args.indiaLimit ?? 50;
  const timespan = args.timespan ?? "90";
  const season = `vlr-${timespan}`;

  // Scrape the (single) world board once and normalize.
  const board = (await scrapeVlrStats({ timespan }))
    .map(normalize)
    .filter((p) => p.ign);

  // Guard against a silent break: if vlr.gg restructures (or blocks us), the
  // scrape returns far too few rows. Refuse to write a near-empty leaderboard
  // over good data — record an 'error' run and throw so the cron 500s loudly.
  const MIN_BOARD = 20;
  if (board.length < MIN_BOARD) {
    if (apply) {
      await getPool()`
        INSERT INTO pro_ingest_runs (source, scope, timespan, status, error, finished_at)
        VALUES ('vlr-scrape', 'all', ${timespan}, 'error',
          ${`scrape returned only ${board.length} rows — aborted`}, NOW())
      `;
    }
    throw new Error(
      `vlr.gg scrape returned only ${board.length} players (<${MIN_BOARD}) — aborting to avoid clobbering data.`,
    );
  }

  // World leaderboard: top N by board order (vlr sorts by rating desc).
  const world = board.slice(0, worldLimit);

  // India leaderboard: India-flagged rows, preserving board order, top N.
  const india = board.filter((p) => p.flag === "in").slice(0, indiaLimit);

  // Merge: world rank by world order; national rank by india order; country.
  const bySlug = new Map<string, NormalizedPlayer>();
  world.forEach((p, i) => bySlug.set(p.slug, { ...p, world_rank: i + 1, country: null }));
  india.forEach((p, i) => {
    const ex = bySlug.get(p.slug) || { ...p, world_rank: null };
    bySlug.set(p.slug, {
      ...ex,
      ...p,
      world_rank: ex.world_rank ?? null,
      national_rank: i + 1,
      country: "IN",
    });
  });
  const players = [...bySlug.values()];

  if (!apply) {
    return {
      playersUpserted: 0,
      statsUpserted: 0,
      worldCount: world.length,
      indiaCount: india.length,
      uniqueCount: players.length,
      applied: false,
      preview: players.slice(0, 10).map((p) => ({
        ign: p.ign,
        org: p.org,
        rating: p.rating,
        acs: p.acs,
        kast: p.kast_pct,
        world: p.world_rank ?? null,
        india: p.national_rank ?? null,
      })),
    };
  }

  const sql = getPool();
  let playersUpserted = 0;
  let statsUpserted = 0;

  const [run] = await sql`
    INSERT INTO pro_ingest_runs (source, scope, timespan, status)
    VALUES ('vlr-scrape', 'all', ${timespan}, 'running') RETURNING id
  `;

  try {
    for (const p of players) {
      // Upsert the player. Only ever (re)write rows we own (data_source='vlr');
      // a clash on slug with a curated 'manual' row is left untouched.
      const [row] = await sql`
        INSERT INTO pro_players (slug, game, ign, country, data_source, main_agents,
                                 world_rank, national_rank, last_synced_at, updated_at)
        VALUES (${p.slug}, 'valorant', ${p.ign}, ${p.country || "IN"}, 'vlr', ${p.agents},
                ${p.world_rank ?? null}, ${p.national_rank ?? null}, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET
          ign = EXCLUDED.ign,
          main_agents = EXCLUDED.main_agents,
          world_rank = EXCLUDED.world_rank,
          national_rank = EXCLUDED.national_rank,
          country = COALESCE(EXCLUDED.country, pro_players.country),
          last_synced_at = NOW(),
          updated_at = NOW()
        WHERE pro_players.data_source = 'vlr'
        RETURNING id
      `;
      if (!row) continue; // skipped: slug owned by a curated 'manual' player
      playersUpserted++;

      // Flip any previous current row, then upsert this window's stats.
      await sql`
        UPDATE pro_player_stats SET is_current = FALSE
        WHERE player_id = ${row.id} AND is_current = TRUE AND season <> ${season}
      `;
      await sql`
        INSERT INTO pro_player_stats (player_id, season, is_current, rounds_played,
          rating, acs, k_d_ratio, kast_pct, adr, kpr, apr, fkpr, fdpr, hs_pct,
          clutch_pct, clutch_attempts, source_url, fetched_at, updated_at)
        VALUES (${row.id}, ${season}, TRUE, ${p.rounds_played},
          ${p.rating}, ${p.acs}, ${p.k_d_ratio}, ${p.kast_pct}, ${p.adr}, ${p.kpr},
          ${p.apr}, ${p.fkpr}, ${p.fdpr}, ${p.hs_pct}, ${p.clutch_pct},
          ${p.clutch_attempts}, ${SOURCE_URL}, NOW(), NOW())
        ON CONFLICT (player_id, season) DO UPDATE SET
          is_current = TRUE, rounds_played = EXCLUDED.rounds_played,
          rating = EXCLUDED.rating, acs = EXCLUDED.acs, k_d_ratio = EXCLUDED.k_d_ratio,
          kast_pct = EXCLUDED.kast_pct, adr = EXCLUDED.adr, kpr = EXCLUDED.kpr,
          apr = EXCLUDED.apr, fkpr = EXCLUDED.fkpr, fdpr = EXCLUDED.fdpr,
          hs_pct = EXCLUDED.hs_pct, clutch_pct = EXCLUDED.clutch_pct,
          clutch_attempts = EXCLUDED.clutch_attempts, fetched_at = NOW(), updated_at = NOW()
      `;
      statsUpserted++;
    }

    await sql`
      UPDATE pro_ingest_runs SET status = 'ok', players_upserted = ${playersUpserted},
        stats_upserted = ${statsUpserted}, finished_at = NOW() WHERE id = ${run.id}
    `;
  } catch (err) {
    await sql`
      UPDATE pro_ingest_runs SET status = 'error',
        error = ${String((err as Error)?.message || err)},
        finished_at = NOW() WHERE id = ${run.id}
    `;
    throw err;
  }

  return {
    playersUpserted,
    statsUpserted,
    worldCount: world.length,
    indiaCount: india.length,
    uniqueCount: players.length,
    applied: true,
  };
}
