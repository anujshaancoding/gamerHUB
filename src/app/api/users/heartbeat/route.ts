import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getPool } from "@/lib/db/index";
import { getUser } from "@/lib/auth/get-user";

/**
 * POST /api/users/heartbeat
 *
 * Updates the current user's is_online flag and last_seen timestamp,
 * and records activity in user_activity_days.
 * Used as a fallback heartbeat when Socket.io is not connected.
 */
export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = createClient();
    await db
      .from("profiles")
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq("id", user.id);

    // Also record activity (same as Socket.io heartbeat)
    const sql = getPool();
    await sql`SELECT record_heartbeat_activity(${user.id})`.catch((err) => {
      console.error("[Heartbeat API] record_heartbeat_activity failed:", err?.message || err);
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
