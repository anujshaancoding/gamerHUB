import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";

// GET - List/search gamers with their games
export async function GET(request: NextRequest) {
  try {
    const db = createAdminClient();
    const { searchParams } = new URL(request.url);

    const region = searchParams.get("region");
    const language = searchParams.get("language");
    const style = searchParams.get("style");
    const onlineOnly = searchParams.get("onlineOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    // 1. Query profiles
    let query = db
      .from("profiles")
      .select("*")
      .order("last_seen", { ascending: false })
      .limit(limit);

    if (region) {
      query = query.eq("region", region);
    }
    if (language) {
      query = query.eq("preferred_language", language);
    }
    if (style) {
      query = query.eq("gaming_style", style);
    }
    if (onlineOnly) {
      query = query.eq("is_online", true);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error("Error fetching gamers:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch gamers", details: profilesError.message },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ gamers: [] });
    }

    const profileIds = (profiles as any[]).map((p: any) => p.id);

    // 2. Get user_games with flat FK join to games table
    const { data: userGamesRows } = await db
      .from("user_games")
      .select("*, game:games!user_games_game_id_fkey(id, slug, name, icon_url)")
      .in("user_id", profileIds);

    // Group user_games by user_id
    const userGamesMap: Record<string, any[]> = {};
    for (const row of (userGamesRows || []) as any[]) {
      if (!userGamesMap[row.user_id]) userGamesMap[row.user_id] = [];
      userGamesMap[row.user_id].push(row);
    }

    // 3. Combine profiles with their games
    const gamers = (profiles as any[]).map((profile: any) => ({
      ...profile,
      user_games: userGamesMap[profile.id] || [],
    }));

    return NextResponse.json({ gamers });
  } catch (error) {
    console.error("Gamers list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
