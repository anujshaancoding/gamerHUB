/**
 * Pro-scene ingest cron.
 *
 *   GET|POST /api/cron/ingest            scrape vlr.gg + upsert pro_players/stats
 *   GET|POST /api/cron/ingest?dryRun=1   scrape + report, write nothing
 *
 * Auth: Authorization: Bearer ${CRON_SECRET} (same as /api/cron/automation
 * and /api/cron/prune). Meant to be hit on a schedule by a Netlify scheduled
 * function (the serverless replacement for the old VPS vlr-ingest.mjs cron).
 *
 * The actual scrape + merge + upsert logic lives in
 * src/lib/features/pro/ingest.ts (runProIngest) — this route is just auth +
 * transport. Tunable via query params: ?world=, ?india=, ?timespan=.
 */

import { NextRequest, NextResponse } from "next/server";
import { runProIngest } from "@/lib/features/pro/ingest";

// vlr.gg scrape + sequential upserts can run well past the default 10s; this is
// a long-running cron job, not an interactive request.
export const maxDuration = 60;

function verifyCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // Header only — query params leak into server logs.
  const authHeader = request.headers.get("authorization");
  return !!authHeader && authHeader === `Bearer ${secret}`;
}

function intParam(url: URL, key: string): number | undefined {
  const raw = url.searchParams.get(key);
  if (raw === null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

async function handle(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const timespan = url.searchParams.get("timespan") || undefined;
  const worldLimit = intParam(url, "world");
  const indiaLimit = intParam(url, "india");

  try {
    const result = await runProIngest({
      apply: !dryRun,
      worldLimit,
      indiaLimit,
      timespan,
    });
    return NextResponse.json({ ok: true, dryRun, ...result });
  } catch (error) {
    console.error("Pro ingest cron error:", error);
    return NextResponse.json(
      { ok: false, error: "Pro ingest failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
