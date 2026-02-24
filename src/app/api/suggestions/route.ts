import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMutualFriends, getSimilarRankPlayers } from "@/lib/supabase/rpc-types";
import type { Profile, UserGame, Game } from "@/types/database";

export interface SuggestedUser {
  user_id: string;
  profile: Profile & { user_games: (UserGame & { game: Game })[] };
  suggestion_reason: {
    type: "mutual" | "similar_rank" | "random";
    mutual_friend_count?: number;
    mutual_friend_names?: string[];
    common_games?: { game_name: string; user_rank: string; their_rank: string }[];
  };
}

interface MutualFriendResult {
  user_id: string;
  mutual_friend_count: number;
  mutual_friend_ids: string[];
}

interface SimilarRankResult {
  user_id: string;
  common_games_count: number;
  matching_games: { game_id: string; game_name: string; user_rank: string; their_rank: string }[];
}

type ProfileWithGames = Profile & { user_games: (UserGame & { game: Game })[] };

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    const result: {
      mutual_friends: SuggestedUser[];
      similar_rank: SuggestedUser[];
      random_users: SuggestedUser[];
    } = {
      mutual_friends: [],
      similar_rank: [],
      random_users: [],
    };

    // Get mutual friends suggestions
    if (type === "all" || type === "mutual") {
      const { data: mutualData, error: mutualError } = await getMutualFriends(
        supabase,
        user.id,
        limit
      );

      if (mutualError) {
        console.error("Error fetching mutual friends:", mutualError);
      } else if (mutualData && mutualData.length > 0) {
        const userIds = mutualData.map((m) => m.user_id);

        // Fetch profiles for these users
        const { data: profilesRaw } = await supabase
          .from("profiles")
          .select(`
            *,
            user_games (
              *,
              game:games (*)
            )
          `)
          .in("id", userIds);
        const profiles = profilesRaw as ProfileWithGames[] | null;

        // Fetch mutual friend names
        const allMutualIds = [...new Set(mutualData.flatMap(m => m.mutual_friend_ids))];
        const { data: mutualProfilesRaw } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", allMutualIds);
        const mutualProfiles = mutualProfilesRaw as { id: string; username: string; display_name: string | null }[] | null;

        const mutualProfileMap = new Map(
          (mutualProfiles || []).map((p) => [p.id, p.display_name || p.username])
        );

        result.mutual_friends = mutualData.map((m) => {
          const profile = profiles?.find((p) => p.id === m.user_id);
          return {
            user_id: m.user_id,
            profile: profile as ProfileWithGames,
            suggestion_reason: {
              type: "mutual" as const,
              mutual_friend_count: m.mutual_friend_count,
              mutual_friend_names: m.mutual_friend_ids
                .slice(0, 3)
                .map((id) => mutualProfileMap.get(id) || "Unknown"),
            },
          };
        }).filter((s) => s.profile);
      }
    }

    // Get similar rank suggestions
    if (type === "all" || type === "similar_rank") {
      const { data: similarData, error: similarError } = await getSimilarRankPlayers(
        supabase,
        user.id,
        2,
        limit
      );

      if (similarError) {
        console.error("Error fetching similar rank players:", similarError);
      } else if (similarData && similarData.length > 0) {
        const userIds = similarData.map((s) => s.user_id);

        // Fetch profiles for these users
        const { data: profilesRaw2 } = await supabase
          .from("profiles")
          .select(`
            *,
            user_games (
              *,
              game:games (*)
            )
          `)
          .in("id", userIds);
        const profiles2 = profilesRaw2 as ProfileWithGames[] | null;

        result.similar_rank = similarData.map((s) => {
          const profile = profiles2?.find((p) => p.id === s.user_id);
          const matchingGames = s.matching_games as SimilarRankResult["matching_games"] | undefined;
          return {
            user_id: s.user_id,
            profile: profile as ProfileWithGames,
            suggestion_reason: {
              type: "similar_rank" as const,
              common_games: matchingGames?.slice(0, 3).map((g) => ({
                game_name: g.game_name,
                user_rank: g.user_rank,
                their_rank: g.their_rank,
              })),
            },
          };
        }).filter((s) => s.profile);
      }
    }

    // If no suggestions found, return random users as fallback
    const includeRandom = searchParams.get("includeRandom") === "true";
    if ((type === "all" && includeRandom) || type === "random") {
      const totalSuggestions = result.mutual_friends.length + result.similar_rank.length;

      if (totalSuggestions === 0 || type === "random") {
        try {
          // Get current user's friends to exclude them
          const { data: friendsData, error: friendsError } = await supabase
            .from("friends_view")
            .select("friend_id, user_id")
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

          if (friendsError) {
            console.error("Error fetching friends for random users:", friendsError);
          }

          const friendIds = new Set(
            friendsData?.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id)) || []
          );

          // Get random users excluding current user and friends
          const { data: randomProfilesRaw, error: randomError } = await supabase
            .from("profiles")
            .select(`
              *,
              user_games (
                *,
                game:games (*)
              )
            `)
            .neq("id", user.id)
            .limit(limit);

          if (randomError) {
            console.error("Error fetching random profiles:", randomError);
          } else {
            const randomProfiles = (randomProfilesRaw as ProfileWithGames[] | null) || [];

            // Filter out friends
            const filteredProfiles = randomProfiles.filter(
              (profile) => !friendIds.has(profile.id)
            );

            result.random_users = filteredProfiles.map((profile) => ({
              user_id: profile.id,
              profile,
              suggestion_reason: {
                type: "random" as const,
              },
            }));
          }
        } catch (randomError) {
          console.error("Error in random users fallback:", randomError);
          // Continue without random users - don't break the API
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Suggestions API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
