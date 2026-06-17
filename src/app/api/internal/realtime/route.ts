/**
 * Internal presence sink — the realtime DO worker POSTs here to persist presence
 * to the DB (the DO can't reach Postgres directly). Mirrors the writes the old
 * in-process Socket.IO server did: profiles.is_online / last_seen / status +
 * record_heartbeat_activity.
 *
 *   POST /api/internal/realtime  { userId, online?, status?, statusUntil? }
 *   Auth: Authorization: Bearer ${REALTIME_SECRET}
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db/index";

function authed(req: NextRequest): boolean {
  const secret = process.env.REALTIME_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!authed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userId?: unknown; online?: unknown; status?: unknown; statusUntil?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = body.userId;
  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const sql = getPool();
  try {
    if (body.online === true) {
      await sql`UPDATE profiles SET is_online = true, last_seen = NOW() WHERE id = ${userId}`;
      await sql`SELECT record_heartbeat_activity(${userId})`.catch(() => {});
    } else if (body.online === false) {
      await sql`UPDATE profiles SET is_online = false, last_seen = NOW() WHERE id = ${userId}`;
    }

    if (typeof body.status === "string") {
      const statusUntil = typeof body.statusUntil === "string" ? body.statusUntil : null;
      await sql`
        UPDATE profiles SET status = ${body.status}, status_until = ${statusUntil}
        WHERE id = ${userId}
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("internal/realtime presence write failed:", (e as Error).message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
