import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import type { ProGame } from "@/lib/pro/types";

const VALID_GAMES: ProGame[] = ["valorant"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ game: string; slug: string }> }
) {
  try {
    const { game, slug } = await params;
    if (!VALID_GAMES.includes(game as ProGame)) {
      return NextResponse.json({ error: "Invalid game" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: player, error: playerErr } = await admin
      .from("pro_players")
      .select(
        `
        id, slug, game, ign, real_name, team_id, role, country, region,
        photo_url, bio, age, date_of_birth, total_earnings, earnings_currency,
        peak_rank, current_rank, national_rank, socials, is_active, is_featured,
        created_at, updated_at,
        team:pro_teams!team_id(id, slug, name, short_name, logo_url, region, founded_year, socials)
        `
      )
      .eq("game", game)
      .eq("slug", slug)
      .single();

    if (playerErr || !player) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const playerRow = player as unknown as { id: string };

    const [{ data: statsRows }, { data: gearRow }] = await Promise.all([
      admin
        .from("pro_player_stats")
        .select("*")
        .eq("player_id", playerRow.id)
        .order("is_current", { ascending: false })
        .order("season", { ascending: false }),
      admin
        .from("pro_player_gear")
        .select("*")
        .eq("player_id", playerRow.id)
        .single(),
    ]);

    const stats = (statsRows || []) as Array<{ is_current: boolean }>;
    const current_stats = stats.find((s) => s.is_current) || null;
    const past_seasons = stats.filter((s) => !s.is_current);

    return NextResponse.json(
      {
        player,
        current_stats,
        past_seasons,
        gear: gearRow || null,
      },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } }
    );
  } catch (err) {
    console.error("Pro player detail API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
