// ggLobby V2 — loyalty / giveaway engine (SERVER ONLY — uses the DB pool).
//
// Points live in Postgres (migration 022): `loyalty_records` (one row per user)
// + `loyalty_events` (append-only grants, idempotent by UNIQUE (user_id, key)).
// This replaced a JSON file on the upload volume, which silently lost writes on
// serverless. The exported API surface is unchanged so callers don't move.
//
// Each award is a single atomic CTE statement (insert the event, bump points
// only if the event was new) — no multi-statement transaction needed, and the
// UNIQUE (user_id, key) constraint is what makes every grant idempotent.
//
// Client components must import from "./constants" instead — importing this
// file from the client bundles server-only code and breaks the build.

import type postgres from "postgres";
import { getPool } from "@/lib/db";
import {
  type LoyaltyAction,
  type LoyaltyRecord,
  ACTION_POINTS,
  tierFor,
} from "./constants";

export {
  ACTION_POINTS,
  ACTION_LABEL,
  TIERS,
  tierFor,
} from "./constants";
export type {
  LoyaltyAction,
  LoyaltyEvent,
  LoyaltyRecord,
} from "./constants";

function refCodeFor(userId: string) {
  return userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toLowerCase() || "gg";
}

function toIso(v: unknown): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

/** Load a full record (with its events) shaped as the LoyaltyRecord type. */
async function loadRecord(
  sql: postgres.Sql,
  userId: string
): Promise<LoyaltyRecord | null> {
  const recRows = await sql`
    SELECT user_id, name, image, points, referral_code, referred_by, updated_at
    FROM loyalty_records WHERE user_id = ${userId}
  `;
  const rec = recRows[0];
  if (!rec) return null;

  const events = await sql`
    SELECT action, points, at, key
    FROM loyalty_events WHERE user_id = ${userId} ORDER BY at ASC, id ASC
  `;

  return {
    userId: rec.user_id as string,
    name: rec.name as string,
    image: (rec.image as string | null) ?? null,
    points: Number(rec.points),
    events: events.map((e) => ({
      action: e.action as LoyaltyAction,
      points: Number(e.points),
      at: toIso(e.at),
      key: e.key as string,
    })),
    referralCode: rec.referral_code as string,
    referredBy: (rec.referred_by as string | null) ?? undefined,
    updatedAt: toIso(rec.updated_at),
  };
}

/** Ensure a record exists; refresh name/image like the old in-memory ensure. */
async function ensureRecord(
  sql: postgres.Sql,
  userId: string,
  name: string,
  image?: string | null
): Promise<void> {
  await sql`
    INSERT INTO loyalty_records (user_id, name, image, referral_code, updated_at)
    VALUES (${userId}, ${name}, ${image ?? null}, ${refCodeFor(userId)}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      name  = COALESCE(NULLIF(EXCLUDED.name, ''), loyalty_records.name),
      image = COALESCE(EXCLUDED.image, loyalty_records.image)
  `;
}

/**
 * Award `action` under idempotency `key`. Returns true only the first time
 * (user_id, key) is seen — the UNIQUE constraint enforces "once". The event
 * insert and the points bump happen in one atomic statement, so points can
 * never drift from the granted events.
 *
 * Since one-time actions (signup, link_valorant) always use key === action, a
 * single (user_id, key) uniqueness also covers the old ONE_TIME check.
 */
async function applyAction(
  sql: postgres.Sql,
  userId: string,
  action: LoyaltyAction,
  key: string
): Promise<boolean> {
  const points = ACTION_POINTS[action];
  const rows = await sql`
    WITH ins AS (
      INSERT INTO loyalty_events (user_id, action, points, key, at)
      VALUES (${userId}, ${action}, ${points}, ${key}, NOW())
      ON CONFLICT (user_id, key) DO NOTHING
      RETURNING points
    ), upd AS (
      UPDATE loyalty_records SET points = points + ${points}, updated_at = NOW()
      WHERE user_id = ${userId} AND EXISTS (SELECT 1 FROM ins)
      RETURNING user_id
    )
    SELECT (SELECT COUNT(*) FROM ins)::int AS inserted
  `;
  return Number(rows[0]?.inserted ?? 0) > 0;
}

/**
 * Called on every authenticated loyalty fetch — grants signup once and the
 * daily check-in (idempotent by date).
 */
export async function syncUser(user: {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}): Promise<LoyaltyRecord> {
  const sql = getPool();
  const name = user.name || user.email.split("@")[0];
  const today = new Date().toISOString().slice(0, 10);

  await ensureRecord(sql, user.id, name, user.image);
  await applyAction(sql, user.id, "signup", "signup");
  await applyAction(sql, user.id, "daily_login", `daily_login:${today}`);

  return (await loadRecord(sql, user.id))!;
}

export async function awardAction(
  userId: string,
  action: Exclude<LoyaltyAction, "signup" | "daily_login">
): Promise<{ awarded: boolean; record: LoyaltyRecord | null }> {
  const sql = getPool();
  const existing = await loadRecord(sql, userId);
  if (!existing) return { awarded: false, record: null };

  const key = action === "share_rank_card" ? `${action}:once` : action;
  const awarded = await applyAction(sql, userId, action, key);

  return { awarded, record: await loadRecord(sql, userId) };
}

/** Records that `userId` was referred by the owner of `referralCode`. */
export async function applyReferral(
  userId: string,
  referralCode: string
): Promise<boolean> {
  const sql = getPool();

  const referrerRows = await sql`
    SELECT user_id FROM loyalty_records
    WHERE referral_code = ${referralCode} AND user_id <> ${userId}
    LIMIT 1
  `;
  const referrer = referrerRows[0];
  if (!referrer) return false;

  // Atomic guard: only the first referral sticks (referred_by IS NULL).
  const updated = await sql`
    UPDATE loyalty_records SET referred_by = ${referrer.user_id as string}, updated_at = NOW()
    WHERE user_id = ${userId} AND referred_by IS NULL
    RETURNING user_id
  `;
  if (updated.length === 0) return false;

  await applyAction(sql, referrer.user_id as string, "refer", `refer:${userId}`);
  return true;
}

export async function getRecord(userId: string): Promise<LoyaltyRecord | null> {
  return loadRecord(getPool(), userId);
}

export async function getLeaderboard(limit = 50) {
  const sql = getPool();
  const rows = await sql`
    SELECT name, image, points FROM loyalty_records
    ORDER BY points DESC LIMIT ${limit}
  `;
  return rows.map((r, i) => ({
    rank: i + 1,
    name: r.name as string,
    image: (r.image as string | null) ?? null,
    points: Number(r.points),
    tier: tierFor(Number(r.points)).name,
  }));
}
