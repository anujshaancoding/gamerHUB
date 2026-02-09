import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get current user's ranking
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seasonId = searchParams.get("season_id");
    const gameId = searchParams.get("game_id");

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

    // Get user's season points
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
      `
      )
      .eq("season_id", targetSeasonId as string)
      .eq("user_id", user.id);

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    const { data: userPoints, error } = await query;

    if (error) {
      console.error("Error fetching user ranking:", error);
      return NextResponse.json(
        { error: "Failed to fetch user ranking" },
        { status: 500 }
      );
    }

    if (!userPoints || userPoints.length === 0) {
      return NextResponse.json({
        ranking: null,
        message: "No ranking data found for this season",
      });
    }

    // Get the user's rank by counting users with more points
    const rankings = await Promise.all(
      (userPoints as any[]).map(async (points: any) => {
        let rankQuery = supabase
          .from("season_points")
          .select("*", { count: "exact", head: true })
          .eq("season_id", targetSeasonId as string)
          .gt("total_points", points.total_points);

        if (points.game_id) {
          rankQuery = rankQuery.eq("game_id", points.game_id);
        }

        const { count } = await rankQuery;
        const computedRank = (count || 0) + 1;

        return {
          ...points,
          username: points.profile?.username || "Unknown",
          display_name: points.profile?.display_name || null,
          avatar_url: points.profile?.avatar_url || null,
          game_name: points.game?.name || null,
          game_slug: points.game?.slug || null,
          computed_rank: computedRank,
          rank_change: points.previous_rank
            ? points.previous_rank - computedRank
            : 0,
        };
      })
    );

    return NextResponse.json({
      rankings,
      season_id: targetSeasonId,
    });
  } catch (error) {
    console.error("User ranking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
