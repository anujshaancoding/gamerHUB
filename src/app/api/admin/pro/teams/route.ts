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

  const game = request.nextUrl.searchParams.get("game");
  let q = admin
    .from("pro_teams")
    .select("id, slug, name, short_name, game, logo_url, region, founded_year, socials, is_active, updated_at")
    .order("name", { ascending: true });
  if (game && isValidGame(game)) q = q.eq("game", game);
  const { data, error } = await q;
  if (error) {
    logger.error("Admin pro teams list error", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
  return NextResponse.json({ teams: data || [] });
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
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!isValidGame(game)) return NextResponse.json({ error: "Invalid game" }, { status: 400 });

  const slugInput =
    typeof body.slug === "string" && body.slug.trim()
      ? slugify(body.slug)
      : slugify(name);
  if (!isValidSlug(slugInput))
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const insert = {
    slug: slugInput,
    name,
    short_name: (body.short_name as string | null) || null,
    game,
    logo_url: (body.logo_url as string | null) || null,
    region: (body.region as string) || "India",
    founded_year: typeof body.founded_year === "number" ? body.founded_year : null,
    socials: (body.socials as Record<string, unknown>) || {},
    is_active: body.is_active === false ? false : true,
  };

  const { data, error } = await admin
    .from("pro_teams")
    .insert(insert)
    .select()
    .single();
  if (error) {
    logger.error("Admin pro team insert error", error);
    const msg = /duplicate|unique/i.test(error.message)
      ? "A team with that slug already exists"
      : "Failed to create team";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ team: data }, { status: 201 });
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

  const ALLOWED = new Set(["slug", "name", "short_name", "logo_url", "region", "founded_year", "socials", "is_active"]);
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (ALLOWED.has(k)) updates[k] = v;
  }
  if (typeof updates.slug === "string" && !isValidSlug(updates.slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates supplied" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("pro_teams")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    logger.error("Admin pro team update error", error);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
  return NextResponse.json({ team: data });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { admin } = guard;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await admin.from("pro_teams").delete().eq("id", id);
  if (error) {
    logger.error("Admin pro team delete error", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
