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
    .from("pro_player_gear")
    .select("*")
    .eq("player_id", id)
    .single();
  if (error && error.code !== "PGRST116") {
    logger.error("Admin pro gear fetch error", error);
    return NextResponse.json({ error: "Failed to fetch gear" }, { status: 500 });
  }
  return NextResponse.json({ gear: data || null });
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

  const platform = body.platform;
  if (platform !== "pc" && platform !== "mobile") {
    return NextResponse.json({ error: "platform must be 'pc' or 'mobile'" }, { status: 400 });
  }

  const row = {
    player_id: playerId,
    platform,
    device_model: (body.device_model as string | null) || null,
    cpu: (body.cpu as string | null) || null,
    gpu: (body.gpu as string | null) || null,
    ram: (body.ram as string | null) || null,
    monitor: (body.monitor as string | null) || null,
    monitor_hz: typeof body.monitor_hz === "number" ? body.monitor_hz : null,
    mouse: (body.mouse as string | null) || null,
    keyboard: (body.keyboard as string | null) || null,
    headphones: (body.headphones as string | null) || null,
    mousepad: (body.mousepad as string | null) || null,
    grip_style: (body.grip_style as string | null) || null,
    controllers: (body.controllers as string | null) || null,
    sensitivities: (body.sensitivities as Record<string, unknown>) || {},
    ingame_settings: (body.ingame_settings as Record<string, unknown>) || {},
    layout_image_url: (body.layout_image_url as string | null) || null,
    notes: (body.notes as string | null) || null,
    source_url: (body.source_url as string | null) || null,
    last_verified_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("pro_player_gear")
    .upsert(row, { onConflict: "player_id" })
    .select()
    .single();
  if (error) {
    logger.error("Admin pro gear upsert error", error);
    return NextResponse.json({ error: "Failed to save gear" }, { status: 500 });
  }
  return NextResponse.json({ gear: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { admin } = guard;
  const { id: playerId } = await params;

  const { error } = await admin
    .from("pro_player_gear")
    .delete()
    .eq("player_id", playerId);
  if (error) {
    logger.error("Admin pro gear delete error", error);
    return NextResponse.json({ error: "Failed to delete gear" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
