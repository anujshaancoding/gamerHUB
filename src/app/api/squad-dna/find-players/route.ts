import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { FindPlayersRequest, DNATraits, DNAWeights } from "@/types/squad-dna";
import { calculateCompatibility } from "@/types/squad-dna";
import { getUser } from "@/lib/auth/get-user";

// POST - Find compatible players
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: FindPlayersRequest = await request.json();
    const minCompatibility = body.minCompatibility || 50;
    const limit = Math.min(body.limit || 20, 50);

    // Get current user's DNA profile
    let userProfileQuery = db
      .from("squad_dna_profiles")
      .select("*")
      .eq("user_id", user.id);

    if (body.gameId) {
      userProfileQuery = userProfileQuery.eq("game_id", body.gameId);
    } else {
      userProfileQuery = userProfileQuery.is("game_id", null);
    }

    const { data: userProfile, error: userProfileError } = await userProfileQuery.single();

    if (userProfileError || !userProfile) {
      return NextResponse.json(
        { error: "Please create your DNA profile first" },
        { status: 400 }
      );
    }

    // Get all other users' DNA profiles
    let candidatesQuery = db
      .from("squad_dna_profiles")
      .select(`
        *,
        users!inner(id, username, avatar_url)
      `)
      .neq("user_id", user.id);

    if (body.gameId) {
      candidatesQuery = candidatesQuery.eq("game_id", body.gameId);
    }

    const { data: candidates, error: candidatesError } = await candidatesQuery;

    if (candidatesError) throw candidatesError;

    // Calculate compatibility for each candidate
    const matches = (candidates || []).map((candidate) => {
      const compatibility = calculateCompatibility(
        userProfile.traits as DNATraits,
        candidate.traits as DNATraits,
        userProfile.weights as DNAWeights,
        candidate.weights as DNAWeights
      );

      return {
        user: {
          id: candidate.users.id,
          username: candidate.users.username,
          avatar_url: candidate.users.avatar_url,
        },
        dnaProfile: candidate.traits as DNATraits,
        compatibility,
      };
    });

    // Filter by minimum compatibility and sort
    const filteredMatches = matches
      .filter((m) => m.compatibility.overallScore >= minCompatibility)
      .sort((a, b) => b.compatibility.overallScore - a.compatibility.overallScore);

    // Get common games for top matches
    const topMatches = filteredMatches.slice(0, limit);

    // Fetch common games
    const { data: userGames } = await db
      .from("game_stats")
      .select("game_id, games(name)")
      .eq("user_id", user.id);

    const userGameIds = new Set(userGames?.map((g) => g.game_id) || []);

    const enrichedMatches = await Promise.all(
      topMatches.map(async (match) => {
        const { data: matchGames } = await db
          .from("game_stats")
          .select("game_id, games(name)")
          .eq("user_id", match.user.id);

        const commonGames = (matchGames || [])
          .filter((g) => userGameIds.has(g.game_id))
          .map((g) => (g.games as any)?.name || "Unknown");

        return {
          ...match,
          commonGames,
        };
      })
    );

    return NextResponse.json({
      matches: enrichedMatches,
      total: filteredMatches.length,
      criteria: {
        minCompatibility,
        gameId: body.gameId,
      },
    });
  } catch (error) {
    console.error("Find players error:", error);
    return NextResponse.json(
      { error: "Failed to find players" },
      { status: 500 }
    );
  }
}
