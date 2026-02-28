import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { balanceTeams } from "@/lib/matchmaking/openai";
import { getUser } from "@/lib/auth/get-user";

// POST - Balance teams from a list of players
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { playerIds, gameId } = body;

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length < 2) {
      return NextResponse.json(
        { error: "At least 2 player IDs required" },
        { status: 400 }
      );
    }

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Get skill profiles for all players
    const { data: profiles, error: profilesError } = await db
      .from("player_skill_profiles")
      .select(`
        *,
        profiles!user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq("game_id", gameId)
      .in("user_id", playerIds);

    if (profilesError || !profiles) {
      return NextResponse.json(
        { error: "Failed to fetch player profiles" },
        { status: 500 }
      );
    }

    // Create profiles for players who don't have one
    const existingUserIds = profiles.map((p) => p.user_id);
    const missingUserIds = playerIds.filter(
      (id: string) => !existingUserIds.includes(id)
    );

    for (const userId of missingUserIds) {
      await db.rpc("get_or_create_skill_profile", {
        p_user_id: userId,
        p_game_id: gameId,
      });
    }

    // Fetch again if we created new profiles
    let allProfiles = profiles;
    if (missingUserIds.length > 0) {
      const { data: updatedProfiles } = await db
        .from("player_skill_profiles")
        .select(`
          *,
          profiles!user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("game_id", gameId)
        .in("user_id", playerIds);

      allProfiles = updatedProfiles || profiles;
    }

    // Format for AI
    const playerProfiles = allProfiles.map((p) => ({
      userId: p.user_id,
      username: p.profiles?.username || "Unknown",
      gameId,
      skillRating: p.skill_rating,
      aggressionScore: p.aggression_score,
      teamworkScore: p.teamwork_score,
      communicationScore: p.communication_score,
      consistencyScore: p.consistency_score,
      preferredRoles: p.preferred_roles || [],
      preferredAgents: p.preferred_agents || [],
      avgKda: p.avg_kda || 0,
      winRate: p.win_rate || 50,
      recentForm: p.recent_form,
      languagePreferences: p.language_preferences || ["en"],
    }));

    // Get AI-balanced teams
    const result = await balanceTeams(playerProfiles, gameId);

    // Store the balance request
    await db.from("team_balance_requests").insert({
      requester_id: user.id,
      game_id: gameId,
      player_ids: playerIds,
      team_a_ids: result.teamA,
      team_b_ids: result.teamB,
      balance_score: result.balanceScore,
      ai_reasoning: result.reasoning,
      alternatives: result.alternatives,
    });

    // Enrich with player data
    const getPlayerInfo = (userId: string) => {
      const profile = allProfiles.find((p) => p.user_id === userId);
      return profile
        ? {
            id: profile.user_id,
            username: profile.profiles?.username,
            displayName: profile.profiles?.display_name,
            avatarUrl: profile.profiles?.avatar_url,
            skillRating: profile.skill_rating,
          }
        : { id: userId, username: "Unknown" };
    };

    return NextResponse.json({
      teamA: result.teamA.map(getPlayerInfo),
      teamB: result.teamB.map(getPlayerInfo),
      balanceScore: result.balanceScore,
      reasoning: result.reasoning,
      alternatives: result.alternatives.map((alt) => ({
        teamA: alt.teamA.map(getPlayerInfo),
        teamB: alt.teamB.map(getPlayerInfo),
        score: alt.score,
        reasoning: alt.reasoning,
      })),
    });
  } catch (error) {
    console.error("Team balance error:", error);
    return NextResponse.json(
      { error: "Failed to balance teams" },
      { status: 500 }
    );
  }
}
