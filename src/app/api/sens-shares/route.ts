import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";
import { SENS_GAMES } from "@/lib/features/tools/sens-share-types";

const ALLOWED_GAMES = SENS_GAMES.map((g) => g.id);

export async function GET(req: NextRequest) {
  const db = createClient();
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game");
  const sort = searchParams.get("sort") || "top"; // top, recent
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "30"));
  const offset = parseInt(searchParams.get("offset") || "0");

  const user = await getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = (db as any)
    .from("sens_shares")
    .select(`
      id, author_id, game, platform, title, sensitivities, ingame_settings,
      device_model, grip_style, rank, notes, copy_count, vote_score,
      is_featured, created_at, updated_at,
      author:profiles!author_id (
        id, username, display_name, avatar_url
      )
    `, { count: "exact" })
    .eq("is_deleted", false);

  if (game && ALLOWED_GAMES.includes(game as (typeof ALLOWED_GAMES)[number])) {
    q = q.eq("game", game);
  }

  if (sort === "recent") {
    q = q.order("created_at", { ascending: false });
  } else {
    q = q.order("is_featured", { ascending: false }).order("vote_score", { ascending: false }).order("created_at", { ascending: false });
  }

  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) {
    console.error("sens-shares list error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }

  // Attach user_vote
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let shares = (data as any[]) || [];
  if (user && shares.length > 0) {
    const ids = shares.map((s) => s.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: votes } = await (db as any)
      .from("sens_share_votes")
      .select("share_id, vote_type")
      .eq("user_id", user.id)
      .in("share_id", ids);
    const byId: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (votes || []).forEach((v: any) => { byId[v.share_id] = v.vote_type; });
    shares = shares.map((s) => ({ ...s, user_vote: byId[s.id] ?? null }));
  }

  return NextResponse.json({ shares, total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    game, platform, title, sensitivities, ingame_settings,
    device_model, grip_style, rank, notes,
  } = body || {};

  if (!game || !ALLOWED_GAMES.includes(game)) return NextResponse.json({ error: "Invalid game" }, { status: 400 });
  if (!platform || !["pc", "mobile"].includes(platform)) return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  if (!title || typeof title !== "string" || title.length < 4 || title.length > 100) {
    return NextResponse.json({ error: "Title must be 4–100 chars" }, { status: 400 });
  }
  if (!sensitivities || typeof sensitivities !== "object") {
    return NextResponse.json({ error: "sensitivities is required" }, { status: 400 });
  }

  const db = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from("sens_shares")
    .insert({
      author_id: user.id,
      game,
      platform,
      title: title.trim(),
      sensitivities,
      ingame_settings: ingame_settings || {},
      device_model: device_model || null,
      grip_style: grip_style || null,
      rank: rank || null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("sens-share create error:", error);
    return NextResponse.json({ error: "Failed to publish" }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
