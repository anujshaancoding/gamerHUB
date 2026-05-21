import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import type { ProGame } from "@/lib/pro/types";

const VALID_GAMES: ProGame[] = ["valorant"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  try {
    const { game } = await params;
    if (!VALID_GAMES.includes(game as ProGame)) {
      return NextResponse.json({ error: "Invalid game" }, { status: 400 });
    }

    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const featuredOnly = searchParams.get("featured") === "true";
    const search = searchParams.get("search") || "";

    const admin = createAdminClient();

    let query = admin
      .from("pro_players")
      .select(
        `
        id, slug, game, ign, real_name, team_id, role, country, region,
        photo_url, peak_rank, current_rank, national_rank, socials,
        is_active, is_featured,
        team:pro_teams!team_id(id, slug, name, short_name, logo_url)
        `,
        { count: "exact" }
      )
      .eq("game", game)
      .eq("is_active", true)
      .order("national_rank", { ascending: true, nullsFirst: false })
      .order("ign", { ascending: true })
      .range(offset, offset + limit - 1);

    if (featuredOnly) query = query.eq("is_featured", true);
    if (search) query = query.ilike("ign", `%${search}%`);

    const { data, error, count } = await query;

    if (error) {
      console.error("Pro players list error:", error);
      return NextResponse.json(
        { error: "Failed to load pro players" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { players: data || [], total: count || 0 },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } }
    );
  } catch (err) {
    console.error("Pro players API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
