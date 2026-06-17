/**
 * Retention / pruning cron.
 *
 *   GET|POST /api/cron/prune            delete rows past their retention window
 *   GET|POST /api/cron/prune?dryRun=1   report what WOULD be deleted, delete nothing
 *
 * Auth: Authorization: Bearer ${CRON_SECRET} (same as /api/cron/automation).
 * Meant to be hit on a schedule (Cloudflare Worker / Netlify scheduled fn).
 *
 * Keeps the high-churn operational tables small so the DB stays under Neon's
 * free 0.5 GB tier. USER-FACING data is deliberately excluded — see below.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db/index";

function verifyCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // Header only — query params leak into server logs.
  const authHeader = request.headers.get("authorization");
  return !!authHeader && authHeader === `Bearer ${secret}`;
}

/**
 * Retention windows. ONLY operational/derived data (logs, activity feeds,
 * snapshots, regenerable translation cache). DMs (`messages`) and
 * `game_match_history` are USER-FACING and intentionally NOT listed — pruning
 * them is a product/legal decision, not an infra default.
 */
const RETENTION: { table: string; column: string; days: number }[] = [
  { table: "automation_logs",       column: "created_at", days: 60 },
  { table: "activity_feed",         column: "created_at", days: 90 },
  { table: "clan_activity_log",     column: "created_at", days: 90 },
  { table: "leaderboard_snapshots", column: "created_at", days: 90 },
  { table: "chat_translations",     column: "created_at", days: 30 },
];

async function prune(dryRun: boolean): Promise<Record<string, number>> {
  const sql = getPool();
  const results: Record<string, number> = {};

  for (const { table, column, days } of RETENTION) {
    // table/column come from the hardcoded list above (never user input); the
    // retention window is parameterized.
    try {
      if (dryRun) {
        const rows = await sql.unsafe(
          `SELECT COUNT(*)::int AS n FROM ${table} WHERE ${column} < now() - ($1 || ' days')::interval`,
          [String(days)],
        );
        results[table] = Number((rows[0] as { n?: number })?.n ?? 0);
      } else {
        const res = await sql.unsafe(
          `DELETE FROM ${table} WHERE ${column} < now() - ($1 || ' days')::interval`,
          [String(days)],
        );
        results[table] = res.count ?? 0;
      }
    } catch (e) {
      // A missing table (not yet migrated) must not fail the whole sweep.
      results[table] = -1;
      console.error(`prune ${table} failed:`, (e as Error).message);
    }
  }

  return results;
}

async function handle(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  try {
    const tables = await prune(dryRun);
    const total = Object.values(tables)
      .filter((n) => n > 0)
      .reduce((a, b) => a + b, 0);
    return NextResponse.json({ ok: true, dryRun, total, tables });
  } catch (error) {
    console.error("Prune cron error:", error);
    return NextResponse.json({ ok: false, error: "Prune failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
