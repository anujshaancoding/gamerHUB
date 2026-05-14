import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/pro/admin-guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { admin } = guard;
  const { id } = await params;

  const { data, error } = await admin
    .from("pro_player_stats")
    .select("*")
    .eq("player_id", id)
    .order("is_current", { ascending: false })
    .order("season", { ascending: false });
  if (error) {
    logger.error("Admin pro stats list error", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
  return NextResponse.json({ stats: data || [] });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { admin } = guard;
  const { id: playerId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const season = typeof body.season === "string" ? body.season.trim() : "";
  if (!season) return NextResponse.json({ error: "Season is required" }, { status: 400 });

  const row = {
    player_id: playerId,
    season,
    is_current: body.is_current === true,
    matches_played: numOrNull(body.matches_played),
    wins: numOrNull(body.wins),
    losses: numOrNull(body.losses),
    k_d_ratio: numOrNull(body.k_d_ratio),
    adr: numOrNull(body.adr),
    hs_pct: numOrNull(body.hs_pct),
    acs: numOrNull(body.acs),
    game_stats: (body.game_stats as Record<string, unknown>) || {},
    source_url: (body.source_url as string | null) || null,
    fetched_at: new Date().toISOString(),
  };

  // If marking as current, demote any existing current row for this player
  if (row.is_current) {
    await admin
      .from("pro_player_stats")
      .update({ is_current: false })
      .eq("player_id", playerId);
  }

  const { data, error } = await admin
    .from("pro_player_stats")
    .upsert(row, { onConflict: "player_id,season" })
    .select()
    .single();
  if (error) {
    logger.error("Admin pro stats upsert error", error);
    return NextResponse.json({ error: "Failed to save stats" }, { status: 500 });
  }
  return NextResponse.json({ stats: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { admin } = guard;
  const { id: playerId } = await params;

  const season = request.nextUrl.searchParams.get("season");
  if (!season) return NextResponse.json({ error: "season required" }, { status: 400 });

  const { error } = await admin
    .from("pro_player_stats")
    .delete()
    .eq("player_id", playerId)
    .eq("season", season);
  if (error) {
    logger.error("Admin pro stats delete error", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

function numOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
  return null;
}
