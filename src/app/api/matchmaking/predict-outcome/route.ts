import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { predictMatchOutcome } from "@/lib/matchmaking/openai";

// POST - Predict outcome of a match
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { teamAIds, teamBIds, gameId } = body;

    if (!teamAIds?.length || !teamBIds?.length || !gameId) {
      return NextResponse.json(
        { error: "Team A IDs, Team B IDs, and Game ID are required" },
        { status: 400 }
      );
    }

    // Get skill profiles for all players
    const allPlayerIds = [...teamAIds, ...teamBIds];

    const { data: profiles, error: profilesError } = await supabase
      .from("player_skill_profiles")
      .select(`
        *,
        profiles!user_id (
          username
        )
      `)
      .eq("game_id", gameId)
      .in("user_id", allPlayerIds);

    if (profilesError) {
      return NextResponse.json(
        { error: "Failed to fetch player profiles" },
        { status: 500 }
      );
    }

    // Create default profiles for missing players
    const existingUserIds = profiles?.map((p) => p.user_id) || [];
    const missingUserIds = allPlayerIds.filter(
      (id: string) => !existingUserIds.includes(id)
    );

    for (const userId of missingUserIds) {
      await supabase.rpc("get_or_create_skill_profile", {
        p_user_id: userId,
        p_game_id: gameId,
      });
    }

    // Fetch again if needed
    let allProfiles = profiles || [];
    if (missingUserIds.length > 0) {
      const { data: updatedProfiles } = await supabase
        .from("player_skill_profiles")
        .select(`
          *,
          profiles!user_id (
            username
          )
        `)
        .eq("game_id", gameId)
        .in("user_id", allPlayerIds);

      allProfiles = updatedProfiles || [];
    }

    // Format teams for AI
    const formatPlayer = (userId: string) => {
      const profile = allProfiles.find((p) => p.user_id === userId);
      return {
        userId,
        username: profile?.profiles?.username || "Unknown",
        gameId,
        skillRating: profile?.skill_rating || 1500,
        aggressionScore: profile?.aggression_score || 50,
        teamworkScore: profile?.teamwork_score || 50,
        communicationScore: profile?.communication_score || 50,
        consistencyScore: profile?.consistency_score || 50,
        preferredRoles: profile?.preferred_roles || [],
        preferredAgents: profile?.preferred_agents || [],
        avgKda: profile?.avg_kda || 0,
        winRate: profile?.win_rate || 50,
        recentForm: profile?.recent_form || 50,
        languagePreferences: profile?.language_preferences || ["en"],
      };
    };

    const teamA = teamAIds.map(formatPlayer);
    const teamB = teamBIds.map(formatPlayer);

    // Get AI prediction
    const prediction = await predictMatchOutcome(teamA, teamB, gameId);

    return NextResponse.json({
      prediction,
      teams: {
        teamA: teamA.map((p) => ({
          userId: p.userId,
          username: p.username,
          skillRating: p.skillRating,
        })),
        teamB: teamB.map((p) => ({
          userId: p.userId,
          username: p.username,
          skillRating: p.skillRating,
        })),
      },
    });
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { error: "Failed to predict outcome" },
      { status: 500 }
    );
  }
}
