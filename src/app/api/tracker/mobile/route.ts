/**
 * POST /api/tracker/mobile
 *   body: { game: "bgmi" | "freefire", rawStats: <game-specific>, screenshotUrl?: string }
 *
 * Auth-required. Runs the appropriate analyzer, saves the upload to
 * player_stat_uploads tied to the user, and returns insights.
 *
 * GET /api/tracker/mobile?game=bgmi|freefire&limit=20
 *   Returns the current user's upload history for that game.
 */
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { getPool } from "@/lib/db";
import { analyzeBgmi } from "@/lib/tracker/bgmi-analyzer";
import { analyzeFreeFire } from "@/lib/tracker/freefire-analyzer";
import type { BgmiManualStats, FreeFireManualStats, MobileInsights } from "@/lib/tracker/mobile-types";

export const dynamic = "force-dynamic";

function err(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

function isPositiveNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

function validateBgmi(input: unknown): BgmiManualStats | null {
  if (typeof input !== "object" || input === null) return null;
  const r = input as Record<string, unknown>;
  if (typeof r.inGameName !== "string" || r.inGameName.length === 0 || r.inGameName.length > 32) return null;
  if (typeof r.tier !== "string" || r.tier.length === 0) return null;
  if (typeof r.topWeapon !== "string") return null;
  if (typeof r.favoriteMap !== "string") return null;
  if (!isPositiveNumber(r.matchesPlayed) || r.matchesPlayed > 1_000_000) return null;
  if (!isPositiveNumber(r.wins) || r.wins > r.matchesPlayed) return null;
  if (!isPositiveNumber(r.kills)) return null;
  if (!isPositiveNumber(r.deaths)) return null;
  if (!isPositiveNumber(r.damageDealt)) return null;
  if (!isPositiveNumber(r.headshotPct) || r.headshotPct > 100) return null;
  if (!isPositiveNumber(r.longestKill) || r.longestKill > 2000) return null;
  if (!isPositiveNumber(r.survivalTimeMin) || r.survivalTimeMin > 120) return null;
  return r as unknown as BgmiManualStats;
}

function validateFreeFire(input: unknown): FreeFireManualStats | null {
  if (typeof input !== "object" || input === null) return null;
  const r = input as Record<string, unknown>;
  if (typeof r.inGameName !== "string" || r.inGameName.length === 0 || r.inGameName.length > 32) return null;
  if (typeof r.rank !== "string" || r.rank.length === 0) return null;
  if (typeof r.topWeapon !== "string") return null;
  if (typeof r.favoriteCharacter !== "string") return null;
  if (typeof r.favoriteMap !== "string") return null;
  if (!isPositiveNumber(r.matchesPlayed) || r.matchesPlayed > 1_000_000) return null;
  if (!isPositiveNumber(r.wins) || r.wins > r.matchesPlayed) return null;
  if (!isPositiveNumber(r.kills)) return null;
  if (!isPositiveNumber(r.damageDealt)) return null;
  if (!isPositiveNumber(r.headshotPct) || r.headshotPct > 100) return null;
  if (!isPositiveNumber(r.survivalTimeMin) || r.survivalTimeMin > 60) return null;
  return r as unknown as FreeFireManualStats;
}

function isValidScreenshotUrl(url: unknown): url is string | undefined {
  if (url === undefined || url === null) return true;
  if (typeof url !== "string") return false;
  // Only accept our own /uploads/... paths to prevent injection of arbitrary URLs.
  return /^\/uploads\//.test(url) && url.length < 512;
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return err("UNAUTHORIZED", "Sign in to save your stats.", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("INVALID_FORMAT", "Invalid JSON body.", 400);
  }

  if (typeof body !== "object" || body === null) {
    return err("INVALID_FORMAT", "Invalid request body.", 400);
  }
  const b = body as Record<string, unknown>;
  const game = b.game;
  const rawStats = b.rawStats;
  const screenshotUrl = b.screenshotUrl;

  if (game !== "bgmi" && game !== "freefire") {
    return err("INVALID_FORMAT", "game must be 'bgmi' or 'freefire'.", 400);
  }
  if (!isValidScreenshotUrl(screenshotUrl)) {
    return err("INVALID_FORMAT", "Invalid screenshot URL.", 400);
  }

  let insights: MobileInsights;
  let validated: BgmiManualStats | FreeFireManualStats;
  if (game === "bgmi") {
    const v = validateBgmi(rawStats);
    if (!v) return err("INVALID_FORMAT", "Some BGMI fields are missing or invalid.", 400);
    validated = v;
    insights = analyzeBgmi(v);
  } else {
    const v = validateFreeFire(rawStats);
    if (!v) return err("INVALID_FORMAT", "Some Free Fire fields are missing or invalid.", 400);
    validated = v;
    insights = analyzeFreeFire(v);
  }

  const finalScreenshot = typeof screenshotUrl === "string" ? screenshotUrl : null;
  if (finalScreenshot) insights.screenshotUrl = finalScreenshot;

  // Persist
  try {
    const sql = getPool();
    const validatedJson = JSON.stringify(validated);
    const insightsJson = JSON.stringify(insights);
    const rows = await sql`
      INSERT INTO player_stat_uploads (user_id, game, screenshot_url, raw_stats, insights, visibility)
      VALUES (
        ${user.id}::uuid,
        ${game},
        ${finalScreenshot},
        ${validatedJson}::jsonb,
        ${insightsJson}::jsonb,
        'private'
      )
      RETURNING id, uploaded_at
    `;
    const saved = rows[0] as { id: string; uploaded_at: Date };
    return NextResponse.json({
      ok: true,
      insights,
      saved: { id: saved.id, uploadedAt: saved.uploaded_at },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "DB write failed";
    // Still return the insights so the user sees their analysis even if DB is down.
    return NextResponse.json(
      { ok: true, insights, saved: null, persistError: msg },
      { status: 200 }
    );
  }
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return err("UNAUTHORIZED", "Sign in to view your stats history.", 401);

  const game = req.nextUrl.searchParams.get("game");
  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10) || 20, 1), 100);

  if (game !== "bgmi" && game !== "freefire") {
    return err("INVALID_FORMAT", "game must be 'bgmi' or 'freefire'.", 400);
  }

  try {
    const sql = getPool();
    const rows = await sql`
      SELECT id, game, screenshot_url, raw_stats, insights, uploaded_at, visibility
      FROM player_stat_uploads
      WHERE user_id = ${user.id}::uuid
        AND game = ${game}
      ORDER BY uploaded_at DESC
      LIMIT ${limit}
    `;
    return NextResponse.json({ ok: true, uploads: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "DB read failed";
    return NextResponse.json({ ok: false, error: { code: "UPSTREAM_ERROR", message: msg } }, { status: 500 });
  }
}
