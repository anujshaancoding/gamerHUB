import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getProPlayersByGames, getPopularProPlayers } from "@/lib/db/rpc-types";
import type { Profile, UserGame, Game } from "@/types/database";

export interface ProPlayer {
  user_id: string;
  profile: Profile & { user_games: (UserGame & { game: Game })[] };
  follower_count: number;
  common_games?: { game_id: string; game_name: string; rank: string }[];
  is_followed_by_viewer: boolean;
}

interface ProPlayerResult {
  user_id: string;
  follower_count: number;
  common_games?: { game_id: string; game_name: string; rank: string }[];
}

interface PopularProResult {
  user_id: string;
  follower_count: number;
}

type ProfileWithGames = Profile & { user_games: (UserGame & { game: Game })[] };

export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("game_id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    let proPlayers: ProPlayer[] = [];

    if (user) {
      // Get pro players who play user's games
      const { data: proData, error: proError } = await getProPlayersByGames(
        db,
        user.id,
        limit
      );

      if (proError) {
        console.error("Error fetching pro players by games:", proError);
      } else if (proData && proData.length > 0) {
        const userIds = proData.map((p) => p.user_id);

        // Fetch profiles
        let profilesQuery = db
          .from("profiles")
          .select(`
            *,
            user_games (
              *,
              game:games (*)
            )
          `)
          .in("id", userIds);

        const { data: profilesRaw } = await profilesQuery;
        const profiles = profilesRaw as ProfileWithGames[] | null;

        // Check which ones the user follows
        const { data: followDataRaw } = await db
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .in("following_id", userIds);

        const followData = followDataRaw as { following_id: string }[] | null;
        const followedIds = new Set((followData || []).map((f) => f.following_id));

        proPlayers = proData.map((p) => {
          const profile = profiles?.find((pr) => pr.id === p.user_id);
          return {
            user_id: p.user_id,
            profile: profile as ProfileWithGames,
            follower_count: p.follower_count,
            common_games: p.common_games as { game_id: string; game_name: string; rank: string }[] | undefined,
            is_followed_by_viewer: followedIds.has(p.user_id),
          };
        }).filter((p) => p.profile);
      }
    }

    // If no pro players found (user not logged in or no games), get popular pro players
    if (proPlayers.length === 0) {
      const { data: popularData, error: popularError } = await getPopularProPlayers(
        db,
        limit
      );

      if (popularError) {
        console.error("Error fetching popular pro players:", popularError);
      } else if (popularData && popularData.length > 0) {
        const userIds = popularData.map((p) => p.user_id);

        // Fetch profiles
        let profilesQuery = db
          .from("profiles")
          .select(`
            *,
            user_games (
              *,
              game:games (*)
            )
          `)
          .in("id", userIds);

        if (gameId) {
          profilesQuery = profilesQuery.filter("user_games.game_id", "eq", gameId);
        }

        const { data: profilesRaw2 } = await profilesQuery;
        const profiles = profilesRaw2 as ProfileWithGames[] | null;

        // Check follows if user is logged in
        let followedIds = new Set<string>();
        if (user) {
          const { data: followDataRaw } = await db
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id)
            .in("following_id", userIds);
          const followData = followDataRaw as { following_id: string }[] | null;
          followedIds = new Set((followData || []).map((f) => f.following_id));
        }

        proPlayers = popularData.map((p) => {
          const profile = profiles?.find((pr) => pr.id === p.user_id);
          return {
            user_id: p.user_id,
            profile: profile as ProfileWithGames,
            follower_count: p.follower_count,
            is_followed_by_viewer: followedIds.has(p.user_id),
          };
        }).filter((p) => p.profile);
      }
    }

    return NextResponse.json({
      pro_players: proPlayers,
      total: proPlayers.length,
    });
  } catch (error) {
    console.error("Pro players API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
