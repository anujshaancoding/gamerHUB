import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  requireAdmin,
  slugify,
  isValidSlug,
  isValidGame,
} from "@/lib/pro/admin-guard";

const VALID_STATUSES = ["upcoming", "live", "completed", "cancelled"] as const;
type EventStatus = (typeof VALID_STATUSES)[number];
function isValidStatus(s: unknown): s is EventStatus {
  return typeof s === "string" && (VALID_STATUSES as readonly string[]).includes(s);
}

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { admin } = guard;

  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    const { data, error } = await admin
      .from("pro_events")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ event: data });
  }

  const game = request.nextUrl.searchParams.get("game");
  let q = admin
    .from("pro_events")
    .select("*")
    .order("starts_at", { ascending: false });
  if (game && isValidGame(game)) q = q.eq("game", game);
  const { data, error } = await q;
  if (error) {
    logger.error("Admin pro events list error", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
  return NextResponse.json({ events: data || [] });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { admin } = guard;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const game = body.game;
  const startsAt = body.starts_at;
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!isValidGame(game)) return NextResponse.json({ error: "Invalid game" }, { status: 400 });
  if (typeof startsAt !== "string" || !startsAt.trim())
    return NextResponse.json({ error: "starts_at required" }, { status: 400 });

  const slugInput =
    typeof body.slug === "string" && body.slug.trim()
      ? slugify(body.slug)
      : slugify(`${game}-${name}`);
  if (!isValidSlug(slugInput))
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const status = isValidStatus(body.status) ? body.status : "upcoming";

  const insert = {
    slug: slugInput,
    game,
    name,
    short_name: (body.short_name as string | null) || null,
    region: (body.region as string) || "India",
    status,
    starts_at: startsAt,
    ends_at: (body.ends_at as string | null) || null,
    venue: (body.venue as string | null) || null,
    prize_pool: typeof body.prize_pool === "number" ? body.prize_pool : null,
    prize_currency: (body.prize_currency as string) || "INR",
    description: (body.description as string | null) || null,
    banner_url: (body.banner_url as string | null) || null,
    official_url: (body.official_url as string | null) || null,
    stream_url: (body.stream_url as string | null) || null,
    is_featured: body.is_featured === true,
  };

  const { data, error } = await admin
    .from("pro_events")
    .insert(insert)
    .select()
    .single();
  if (error) {
    logger.error("Admin pro event insert error", error);
    const msg = /duplicate|unique/i.test(error.message)
      ? "An event with that slug already exists"
      : "Failed to create event";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ event: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { admin } = guard;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { id, ...rest } = body;
  if (typeof id !== "string") return NextResponse.json({ error: "id required" }, { status: 400 });

  const ALLOWED = new Set([
    "slug", "name", "short_name", "region", "status", "starts_at", "ends_at",
    "venue", "prize_pool", "prize_currency", "description", "banner_url",
    "official_url", "stream_url", "is_featured",
  ]);
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (ALLOWED.has(k)) updates[k] = v;
  }
  if (typeof updates.slug === "string" && !isValidSlug(updates.slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (updates.status !== undefined && !isValidStatus(updates.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates supplied" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("pro_events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    logger.error("Admin pro event update error", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
  return NextResponse.json({ event: data });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { admin } = guard;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await admin.from("pro_events").delete().eq("id", id);
  if (error) {
    logger.error("Admin pro event delete error", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
