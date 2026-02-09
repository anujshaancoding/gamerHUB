import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get count of available players matching filters
// This is used for the live "X players available" badge when creating a post
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const game = searchParams.get("game");
    const role = searchParams.get("role");
    const minRating = searchParams.get("minRating");
    const maxRating = searchParams.get("maxRating");
    const region = searchParams.get("region");

    if (!game) {
      return NextResponse.json(
        { error: "Game is required" },
        { status: 400 }
      );
    }

    // Get game ID from slug
    const { data: gameData } = await supabase
      .from("games")
      .select("id")
      .eq("slug", game)
      .single();

    if (!gameData) {
      return NextResponse.json({ count: 0 });
    }

    // Query user_games to find players with matching criteria
    let query = supabase
      .from("user_games")
      .select(
        `
        id,
        user_id,
        role,
        rank,
        profiles!user_games_user_id_fkey(
          id, is_online, region
        )
      `,
        { count: "exact" }
      )
      .eq("game_id", gameData.id)
      .eq("is_public", true);

    // Filter by role if specified
    if (role) {
      query = query.eq("role", role);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching matching count:", error);
      return NextResponse.json({ count: 0 });
    }

    // Filter by rating and region in memory
    let matchingPlayers = data || [];

    if (region) {
      matchingPlayers = matchingPlayers.filter(
        (p: Record<string, unknown>) => {
          const profile = p.profiles as { region?: string } | null;
          return profile?.region === region;
        }
      );
    }

    // Filter by rating if applicable (rank field could be parsed for CS2 rating)
    if (minRating || maxRating) {
      matchingPlayers = matchingPlayers.filter((p: Record<string, unknown>) => {
        const rankStr = p.rank as string | null;
        if (!rankStr) return true; // Include unranked

        // Try to parse rating from rank string (e.g., "15000" or "15k")
        const rating = parseInt(rankStr.replace(/k$/i, "000"));
        if (isNaN(rating)) return true;

        if (minRating && rating < parseInt(minRating)) return false;
        if (maxRating && rating > parseInt(maxRating)) return false;
        return true;
      });
    }

    // Count only online players
    const onlineCount = matchingPlayers.filter(
      (p: Record<string, unknown>) => {
        const profile = p.profiles as { is_online?: boolean } | null;
        return profile?.is_online;
      }
    ).length;

    return NextResponse.json({
      count: onlineCount,
      total: matchingPlayers.length,
    });
  } catch (error) {
    console.error("Matching count error:", error);
    return NextResponse.json({ count: 0 });
  }
}
