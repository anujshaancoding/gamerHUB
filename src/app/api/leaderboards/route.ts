import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";

// GET - Get leaderboard entries
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const seasonId = searchParams.get("season_id");
    const gameId = searchParams.get("game_id");
    const region = searchParams.get("region");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // If no season_id provided, get current active season
    let targetSeasonId = seasonId;
    if (!targetSeasonId) {
      const { data: currentSeason } = await supabase
        .from("seasons")
        .select("id")
        .eq("status", "active")
        .order("season_number", { ascending: false })
        .limit(1)
        .single();

      const season = currentSeason as { id: string } | null;
      if (!season) {
        return NextResponse.json(
          { error: "No active season found" },
          { status: 404 }
        );
      }
      targetSeasonId = season.id;
    }

    let query = supabase
      .from("season_points")
      .select(
        `
        *,
        profile:profiles!season_points_user_id_fkey(
          username,
          display_name,
          avatar_url
        ),
        game:games(
          name,
          slug,
          icon_url
        )
      `,
        { count: "exact" }
      )
      .eq("season_id", targetSeasonId as string)
      .order("total_points", { ascending: false })
      .range(offset, offset + limit - 1);

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    if (region) {
      query = query.eq("region", region);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return NextResponse.json(
        { error: "Failed to fetch leaderboard" },
        { status: 500 }
      );
    }

    // Transform and add computed rank
    const entries = (data || []).map((entry: any, index: number) => ({
      ...entry,
      username: entry.profile?.username || "Unknown",
      display_name: entry.profile?.display_name || null,
      avatar_url: entry.profile?.avatar_url || null,
      game_name: entry.game?.name || null,
      game_slug: entry.game?.slug || null,
      computed_rank: offset + index + 1,
      rank_change: entry.previous_rank
        ? entry.previous_rank - (entry.current_rank || offset + index + 1)
        : 0,
    }));

    return cachedResponse({
      entries,
      total: count || 0,
      limit,
      offset,
      season_id: targetSeasonId,
    }, CACHE_DURATIONS.LEADERBOARD);
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
