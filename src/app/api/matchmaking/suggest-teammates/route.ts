import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { suggestTeammates, generatePlayerEmbedding, generatePlaystyleSummary } from "@/lib/matchmaking/openai";
import { getUser } from "@/lib/auth/get-user";

// POST - Get AI-suggested teammates
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gameId, numSuggestions = 5 } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Get or create user's skill profile
    const { data: profileId } = await db.rpc(
      "get_or_create_skill_profile",
      {
        p_user_id: user.id,
        p_game_id: gameId,
      }
    );

    // Get user's profile
    const { data: userProfile } = await db
      .from("player_skill_profiles")
      .select("*, profiles!user_id(username)")
      .eq("id", profileId)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: "Could not find or create skill profile" },
        { status: 500 }
      );
    }

    // If user doesn't have an embedding yet, generate one
    if (!userProfile.ai_embedding) {
      const playerData = {
        userId: user.id,
        username: userProfile.profiles?.username || "Unknown",
        gameId,
        skillRating: userProfile.skill_rating,
        aggressionScore: userProfile.aggression_score,
        teamworkScore: userProfile.teamwork_score,
        communicationScore: userProfile.communication_score,
        consistencyScore: userProfile.consistency_score,
        preferredRoles: userProfile.preferred_roles || [],
        preferredAgents: userProfile.preferred_agents || [],
        avgKda: userProfile.avg_kda || 0,
        winRate: userProfile.win_rate || 50,
        recentForm: userProfile.recent_form,
        languagePreferences: userProfile.language_preferences || ["en"],
      };

      const [embedding, playstyle] = await Promise.all([
        generatePlayerEmbedding(playerData),
        generatePlaystyleSummary(playerData),
      ]);

      await db
        .from("player_skill_profiles")
        .update({
          ai_embedding: JSON.stringify(embedding),
          ai_playstyle_summary: playstyle.summary,
          ai_strengths: playstyle.strengths,
          ai_weaknesses: playstyle.weaknesses,
        })
        .eq("id", profileId);
    }

    // Find candidate teammates (similar skill level, not already in a suggestion)
    const { data: candidates } = await db
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
      .neq("user_id", user.id)
      .gte("skill_rating", userProfile.skill_rating - 300)
      .lte("skill_rating", userProfile.skill_rating + 300)
      .limit(50);

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        suggestions: [],
        message: "No candidates found. Invite more players to join!",
      });
    }

    // Format for AI
    const playerProfile = {
      userId: user.id,
      username: userProfile.profiles?.username || "Unknown",
      gameId,
      skillRating: userProfile.skill_rating,
      aggressionScore: userProfile.aggression_score,
      teamworkScore: userProfile.teamwork_score,
      communicationScore: userProfile.communication_score,
      consistencyScore: userProfile.consistency_score,
      preferredRoles: userProfile.preferred_roles || [],
      preferredAgents: userProfile.preferred_agents || [],
      avgKda: userProfile.avg_kda || 0,
      winRate: userProfile.win_rate || 50,
      recentForm: userProfile.recent_form,
      languagePreferences: userProfile.language_preferences || ["en"],
    };

    const candidateProfiles = candidates.map((c) => ({
      userId: c.user_id,
      username: c.profiles?.username || "Unknown",
      gameId,
      skillRating: c.skill_rating,
      aggressionScore: c.aggression_score,
      teamworkScore: c.teamwork_score,
      communicationScore: c.communication_score,
      consistencyScore: c.consistency_score,
      preferredRoles: c.preferred_roles || [],
      preferredAgents: c.preferred_agents || [],
      avgKda: c.avg_kda || 0,
      winRate: c.win_rate || 50,
      recentForm: c.recent_form,
      languagePreferences: c.language_preferences || ["en"],
    }));

    // Get AI suggestions
    const suggestions = await suggestTeammates(
      playerProfile,
      candidateProfiles,
      numSuggestions
    );

    // Store suggestions in database
    for (const suggestion of suggestions) {
      await db.from("match_suggestions").insert({
        user_id: user.id,
        game_id: gameId,
        suggestion_type: "teammate",
        suggested_user_ids: suggestion.suggestedUserIds,
        compatibility_score: suggestion.compatibilityScore,
        ai_reasoning: suggestion.reasoning,
        match_factors: suggestion.matchFactors,
      });
    }

    // Enrich suggestions with user data
    const enrichedSuggestions = suggestions.map((s) => {
      const candidate = candidates.find(
        (c) => c.user_id === s.suggestedUserIds[0]
      );
      return {
        ...s,
        suggestedUser: candidate
          ? {
              id: candidate.user_id,
              username: candidate.profiles?.username,
              displayName: candidate.profiles?.display_name,
              avatarUrl: candidate.profiles?.avatar_url,
              skillRating: candidate.skill_rating,
              preferredRoles: candidate.preferred_roles,
            }
          : null,
      };
    });

    return NextResponse.json({ suggestions: enrichedSuggestions });
  } catch (error) {
    console.error("Teammate suggestion error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
