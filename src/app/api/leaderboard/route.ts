import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface LeaderboardProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  region: string | null;
}

interface GameLeaderboardEntry {
  user_id: string;
  xp: number;
  level: number;
  profile: LeaderboardProfile | null;
}

interface GlobalLeaderboardEntry {
  user_id: string;
  total_xp: number;
  level: number;
  active_title: { name: string; color: string | null } | null;
  active_frame: { image_url: string } | null;
  profile: LeaderboardProfile | null;
}

// GET - Get leaderboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") || "xp";
    const gameId = searchParams.get("game_id");
    const region = searchParams.get("region");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get current user for highlighting
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (gameId) {
      // Game-specific leaderboard
      let query = supabase
        .from("user_game_progression")
        .select(
          `
          user_id,
          xp,
          level,
          profile:profiles!user_id(
            username,
            display_name,
            avatar_url,
            region
          )
        `
        )
        .eq("game_id", gameId)
        .order("xp", { ascending: false })
        .range(offset, offset + limit - 1);

      if (region) {
        query = query.eq("profile.region", region);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching game leaderboard:", error);
        return NextResponse.json(
          { error: "Failed to fetch leaderboard" },
          { status: 500 }
        );
      }

      const typedData = data as GameLeaderboardEntry[] | null;
      const entries = (typedData || []).map((entry, index) => ({
        rank: offset + index + 1,
        user_id: entry.user_id,
        username: entry.profile?.username,
        display_name: entry.profile?.display_name,
        avatar_url: entry.profile?.avatar_url,
        level: entry.level,
        xp: entry.xp,
        is_current_user: user?.id === entry.user_id,
      }));

      // Get current user's rank if not in top results
      let userRank = null;
      if (user && !entries.some((e) => e.is_current_user)) {
        const userXpResult = await supabase
          .from("user_game_progression")
          .select("xp")
          .eq("user_id", user.id)
          .eq("game_id", gameId)
          .single();
        const userXp = (userXpResult.data as { xp: number } | null)?.xp || 0;

        const { count } = await supabase
          .from("user_game_progression")
          .select("*", { count: "exact", head: true })
          .eq("game_id", gameId)
          .gt("xp", userXp);

        const { data: userProg } = await supabase
          .from("user_game_progression")
          .select(
            `
            xp,
            level,
            profile:profiles!user_id(username, display_name, avatar_url)
          `
          )
          .eq("user_id", user.id)
          .eq("game_id", gameId)
          .single();

        const typedUserProg = userProg as GameLeaderboardEntry | null;
        if (typedUserProg) {
          userRank = {
            rank: (count || 0) + 1,
            user_id: user.id,
            username: typedUserProg.profile?.username,
            display_name: typedUserProg.profile?.display_name,
            avatar_url: typedUserProg.profile?.avatar_url,
            level: typedUserProg.level,
            xp: typedUserProg.xp,
            is_current_user: true,
          };
        }
      }

      return NextResponse.json({ entries, user_rank: userRank });
    } else {
      // Global leaderboard
      const orderBy = type === "level" ? "level" : "total_xp";

      let query = supabase
        .from("user_progression")
        .select(
          `
          user_id,
          total_xp,
          level,
          active_title:titles(name, color),
          active_frame:profile_frames(image_url),
          profile:profiles!user_id(
            username,
            display_name,
            avatar_url,
            region
          )
        `
        )
        .order(orderBy, { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json(
          { error: "Failed to fetch leaderboard" },
          { status: 500 }
        );
      }

      // Filter by region if needed (post-query for simplicity)
      let filteredData = (data as GlobalLeaderboardEntry[] | null) || [];
      if (region) {
        filteredData = filteredData.filter(
          (entry) => entry.profile?.region === region
        );
      }

      const entries = filteredData.map((entry, index) => ({
        rank: offset + index + 1,
        user_id: entry.user_id,
        username: entry.profile?.username,
        display_name: entry.profile?.display_name,
        avatar_url: entry.profile?.avatar_url,
        level: entry.level,
        total_xp: entry.total_xp,
        active_title: entry.active_title,
        active_frame: entry.active_frame,
        is_current_user: user?.id === entry.user_id,
      }));

      // Get current user's rank if not in top results
      let userRank = null;
      if (user && !entries.some((e) => e.is_current_user)) {
        const { data: userProg } = await supabase
          .from("user_progression")
          .select(
            `
            total_xp,
            level,
            active_title:titles(name, color),
            active_frame:profile_frames(image_url),
            profile:profiles!user_id(username, display_name, avatar_url)
          `
          )
          .eq("user_id", user.id)
          .single();

        const typedUserProg = userProg as GlobalLeaderboardEntry | null;
        if (typedUserProg) {
          const { count } = await supabase
            .from("user_progression")
            .select("*", { count: "exact", head: true })
            .gt(orderBy, orderBy === "level" ? typedUserProg.level : typedUserProg.total_xp);

          userRank = {
            rank: (count || 0) + 1,
            user_id: user.id,
            username: typedUserProg.profile?.username,
            display_name: typedUserProg.profile?.display_name,
            avatar_url: typedUserProg.profile?.avatar_url,
            level: typedUserProg.level,
            total_xp: typedUserProg.total_xp,
            active_title: typedUserProg.active_title,
            active_frame: typedUserProg.active_frame,
            is_current_user: true,
          };
        }
      }

      return NextResponse.json({ entries, user_rank: userRank });
    }
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
