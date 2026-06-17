/**
 * Lineups API — dynamic, admin-managed Valorant lineup content.
 *
 *  GET    /api/lineups?map=ascent&agent=viper   public, returns lineups
 *  POST   /api/lineups                          admin only, add a lineup
 *  DELETE /api/lineups?id=<id>                  admin only, remove a lineup
 *
 * Storage is the `valorant_lineups` Postgres table (migration 022). It used to
 * be a JSON file on the upload volume, but that silently loses writes on
 * serverless, so it now lives in the database. Column names are snake_case in
 * the DB and mapped to/from the camelCase `Lineup` type here.
 */

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/db/client";
import type { Lineup, NewLineup } from "@/lib/data/lineup-types";

/** Map a snake_case DB row to the camelCase Lineup type the client expects. */
function toLineup(r: Record<string, unknown>): Lineup {
  const created = r.created_at;
  return {
    id: r.id as string,
    map: r.map as string,
    agent: r.agent as string,
    ability: r.ability as string,
    side: r.side as Lineup["side"],
    site: r.site as string,
    fromCallout: (r.from_callout as string) ?? "",
    toCallout: (r.to_callout as string) ?? "",
    title: r.title as string,
    description: (r.description as string) ?? "",
    difficulty: Number(r.difficulty) as Lineup["difficulty"],
    videoUrl: (r.video_url as string) ?? undefined,
    youtubeId: (r.youtube_id as string) ?? undefined,
    createdAt: created instanceof Date ? created.toISOString() : (created as string),
  };
}

async function requireAdmin(): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const user = await getUser();
  if (!user) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { createAdminClient } = await import("@/lib/db/admin");
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return { ok: false, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const map = searchParams.get("map");
  const agent = searchParams.get("agent");
  const side = searchParams.get("side");

  const db = createClient();
  let query = db.from("valorant_lineups").select("*");
  if (map) query = query.eq("map", map);
  if (agent) query = query.eq("agent", agent);
  if (side) query = query.eq("side", side);
  // Newest first.
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) {
    // Stay resilient on the public read path — a DB hiccup shouldn't 500 the
    // maps page; serve an empty list rather than an error.
    console.error("lineups GET failed:", error.message);
    return NextResponse.json({ lineups: [] });
  }

  const lineups = ((data as Record<string, unknown>[]) ?? []).map(toLineup);
  // Lineups only change on admin POST/DELETE, so this read is safe to cache.
  // Browser holds it 60s; any proxy/CDN serves it for 5min and revalidates in
  // the background for a day — kills the cold refetch on every map visit.
  return NextResponse.json(
    { lineups },
    {
      headers: {
        "Cache-Control":
          "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  let body: NewLineup;
  try {
    body = (await request.json()) as NewLineup;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const required = ["map", "agent", "ability", "side", "site", "title"] as const;
  for (const f of required) {
    if (!body[f as keyof NewLineup]) {
      return NextResponse.json({ error: `Missing field: ${f}` }, { status: 400 });
    }
  }

  const db = createClient();
  const { data, error } = await db
    .from("valorant_lineups")
    .insert({
      id: nanoid(10),
      map: body.map,
      agent: body.agent,
      ability: body.ability,
      side: body.side,
      site: body.site,
      from_callout: body.fromCallout ?? "",
      to_callout: body.toCallout ?? "",
      title: body.title,
      description: body.description ?? "",
      difficulty: body.difficulty ?? 1,
      video_url: body.videoUrl ?? null,
      youtube_id: body.youtubeId ?? null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    console.error("lineups POST failed:", error?.message);
    return NextResponse.json({ error: "Failed to save lineup" }, { status: 500 });
  }

  return NextResponse.json({ lineup: toLineup(data as Record<string, unknown>) }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = createClient();
  const { data, error } = await db
    .from("valorant_lineups")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    console.error("lineups DELETE failed:", error.message);
    return NextResponse.json({ error: "Failed to delete lineup" }, { status: 500 });
  }
  // The builder returns the deleted row(s) — an array or a single object
  // depending on shape. Either way, nothing back means no row matched the id.
  const deleted = Array.isArray(data) ? data.length > 0 : Boolean(data);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
