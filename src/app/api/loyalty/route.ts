/**
 * Loyalty API.
 *
 *  GET  /api/loyalty                 auth — my record (grants signup + daily)
 *  POST /api/loyalty                 auth — { action, code? }
 *      action: "link_valorant" | "share_rank_card" | "refer"
 *      code:   referral code (for action "refer")
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/db/client";
import {
  syncUser,
  awardAction,
  applyReferral,
  getRecord,
  tierFor,
} from "@/lib/loyalty/loyalty";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const record = await syncUser(user);
  return NextResponse.json({ record, tier: tierFor(record.points) });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Make sure the user has a record first.
  await syncUser(user);

  let body: { action?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, code } = body;

  if (action === "refer") {
    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }
    const ok = await applyReferral(user.id, code);
    const record = await getRecord(user.id);
    return NextResponse.json({ applied: ok, record });
  }

  if (action === "link_valorant") {
    // Only award once a REAL Riot account is actually linked. We never trust
    // the client here — we check for an active game_connections row server-side.
    const db = createClient();
    const { data: conn } = await db
      .from("game_connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", "riot")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!conn) {
      // Not linked yet — tell the client to start the Riot OAuth flow.
      return NextResponse.json({
        awarded: false,
        linked: false,
        record: await getRecord(user.id),
      });
    }

    const { awarded, record } = await awardAction(user.id, action);
    return NextResponse.json({ awarded, linked: true, record });
  }

  if (action === "share_rank_card") {
    const { awarded, record } = await awardAction(user.id, action);
    return NextResponse.json({ awarded, record });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
