import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";
import { logger } from "@/lib/logger";

/**
 * GET  /api/pro/follow?player_id=...   — { following: boolean }
 * POST /api/pro/follow                  — { player_id } toggles. Returns { following }.
 */

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ following: false });

  const playerId = request.nextUrl.searchParams.get("player_id");
  if (!playerId) return NextResponse.json({ error: "player_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("pro_player_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("player_id", playerId)
    .single();
  return NextResponse.json({ following: !!data });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const playerId = body.player_id;
  if (typeof playerId !== "string") {
    return NextResponse.json({ error: "player_id required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify player exists & is active
  const { data: player } = await admin
    .from("pro_players")
    .select("id, is_active")
    .eq("id", playerId)
    .single();
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const { data: existing } = await admin
    .from("pro_player_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("player_id", playerId)
    .single();

  if (existing) {
    const { error } = await admin
      .from("pro_player_follows")
      .delete()
      .eq("user_id", user.id)
      .eq("player_id", playerId);
    if (error) {
      logger.error("Pro follow delete error", error);
      return NextResponse.json({ error: "Failed to unfollow" }, { status: 500 });
    }
    return NextResponse.json({ following: false });
  }

  const { error } = await admin
    .from("pro_player_follows")
    .insert({ user_id: user.id, player_id: playerId });
  if (error) {
    logger.error("Pro follow insert error", error);
    return NextResponse.json({ error: "Failed to follow" }, { status: 500 });
  }
  return NextResponse.json({ following: true });
}
