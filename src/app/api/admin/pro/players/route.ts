import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  requireAdmin,
  slugify,
  isValidSlug,
  isValidGame,
} from "@/lib/pro/admin-guard";

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { admin } = guard;

  const { searchParams } = request.nextUrl;
  const game = searchParams.get("game");
  const search = searchParams.get("search") || "";
  const id = searchParams.get("id");

  if (id) {
    const { data, error } = await admin
      .from("pro_players")
      .select(
        `*, team:pro_teams!team_id(id, slug, name, short_name, logo_url, game, region)`
      )
      .eq("id", id)
      .single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ player: data });
  }

  let q = admin
    .from("pro_players")
    .select(
      `id, slug, game, ign, real_name, role, region, photo_url, peak_rank,
       current_rank, national_rank, is_active, is_featured, team_id, updated_at,
       team:pro_teams!team_id(id, name, short_name)`
    )
    .order("national_rank", { ascending: true, nullsFirst: false })
    .order("ign", { ascending: true });
  if (game && isValidGame(game)) q = q.eq("game", game);
  if (search) q = q.ilike("ign", `%${search}%`);
  const { data, error } = await q;
  if (error) {
    logger.error("Admin pro players list error", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
  return NextResponse.json({ players: data || [] });
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

  const game = body.game;
  const ign = typeof body.ign === "string" ? body.ign.trim() : "";
  if (!isValidGame(game)) return NextResponse.json({ error: "Invalid game" }, { status: 400 });
  if (!ign) return NextResponse.json({ error: "IGN is required" }, { status: 400 });

  const slugInput =
    typeof body.slug === "string" && body.slug.trim()
      ? slugify(body.slug)
      : slugify(`${game}-${ign}`);
  if (!isValidSlug(slugInput))
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const insert = {
    slug: slugInput,
    game,
    ign,
    real_name: (body.real_name as string | null) || null,
    team_id: (body.team_id as string | null) || null,
    role: (body.role as string | null) || null,
    country: (body.country as string) || "IN",
    region: (body.region as string | null) || null,
    photo_url: (body.photo_url as string | null) || null,
    bio: (body.bio as string | null) || null,
    age: typeof body.age === "number" ? body.age : null,
    total_earnings: typeof body.total_earnings === "number" ? body.total_earnings : null,
    earnings_currency: (body.earnings_currency as string) || "INR",
    peak_rank: (body.peak_rank as string | null) || null,
    current_rank: (body.current_rank as string | null) || null,
    national_rank: typeof body.national_rank === "number" ? body.national_rank : null,
    socials: (body.socials as Record<string, unknown>) || {},
    is_active: body.is_active === false ? false : true,
    is_featured: body.is_featured === true,
  };

  const { data, error } = await admin
    .from("pro_players")
    .insert(insert)
    .select()
    .single();
  if (error) {
    logger.error("Admin pro player insert error", error);
    const msg = /duplicate|unique/i.test(error.message)
      ? "A player with that slug already exists"
      : "Failed to create player";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ player: data }, { status: 201 });
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
    "slug",
    "ign",
    "real_name",
    "team_id",
    "role",
    "country",
    "region",
    "photo_url",
    "bio",
    "age",
    "total_earnings",
    "earnings_currency",
    "peak_rank",
    "current_rank",
    "national_rank",
    "socials",
    "is_active",
    "is_featured",
  ]);
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (!ALLOWED.has(k)) continue;
    updates[k] = v;
  }
  if (typeof updates.slug === "string" && !isValidSlug(updates.slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates supplied" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("pro_players")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    logger.error("Admin pro player update error", error);
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
  return NextResponse.json({ player: data });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { admin } = guard;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await admin.from("pro_players").delete().eq("id", id);
  if (error) {
    logger.error("Admin pro player delete error", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
