import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { GamingMood, MoodIntensity } from "@/types/mood";
import { GAMING_MOODS, calculateMoodCompatibility } from "@/types/mood";
import { getUser } from "@/lib/auth/get-user";

// GET - Find players with compatible moods
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetMood = searchParams.get("mood") as GamingMood | null;
    const gameId = searchParams.get("game_id");
    const compatibleOnly = searchParams.get("compatible_only") !== "false";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // Get current user's mood
    const { data: userMood } = await db
      .from("user_mood")
      .select("mood, intensity")
      .eq("user_id", user.id)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const myMood = userMood?.mood as GamingMood | null;
    const myIntensity = (userMood?.intensity || 3) as MoodIntensity;

    // Build query for active moods
    let query = db
      .from("user_mood")
      .select(`
        id,
        mood,
        intensity,
        note,
        game_id,
        expires_at,
        created_at,
        user_id,
        users!inner (
          id,
          username,
          avatar_url
        )
      `)
      .neq("user_id", user.id)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(limit * 2); // Fetch more to filter

    // Filter by specific mood
    if (targetMood && GAMING_MOODS[targetMood]) {
      query = query.eq("mood", targetMood);
    }

    // Filter by game
    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    const { data: otherMoods, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate compatibility and filter
    const playersWithCompatibility = (otherMoods || []).map((moodEntry: any) => {
      const theirMood = moodEntry.mood as GamingMood;
      const theirIntensity = moodEntry.intensity as MoodIntensity;

      let compatibility;
      if (myMood) {
        compatibility = calculateMoodCompatibility(
          myMood,
          myIntensity,
          theirMood,
          theirIntensity
        );
      } else {
        // If user has no mood set, just show base compatibility
        compatibility = {
          score: 50,
          level: "okay" as const,
          reason: "Set your mood to see compatibility",
        };
      }

      return {
        user: moodEntry.users,
        mood: {
          id: moodEntry.id,
          mood: theirMood,
          intensity: theirIntensity,
          note: moodEntry.note,
          game_id: moodEntry.game_id,
          expires_at: moodEntry.expires_at,
          created_at: moodEntry.created_at,
        },
        compatibility,
      };
    });

    // Filter by compatibility if requested
    let filtered = playersWithCompatibility;
    if (compatibleOnly && myMood) {
      filtered = playersWithCompatibility.filter(
        (p) => p.compatibility.level !== "poor"
      );
    }

    // Sort by compatibility score
    filtered.sort((a, b) => b.compatibility.score - a.compatibility.score);

    // Limit results
    const results = filtered.slice(0, limit);

    return NextResponse.json({
      players: results,
      userMood: myMood
        ? {
            mood: myMood,
            intensity: myIntensity,
            moodInfo: GAMING_MOODS[myMood],
          }
        : null,
    });
  } catch (error) {
    console.error("Find compatible players error:", error);
    return NextResponse.json(
      { error: "Failed to find compatible players" },
      { status: 500 }
    );
  }
}
