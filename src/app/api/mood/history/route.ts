import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GamingMood, MoodStatsResponse } from "@/types/mood";
import { GAMING_MOODS } from "@/types/mood";

// GET - Get mood history and stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const days = Math.min(parseInt(searchParams.get("days") || "30"), 90);
    const includeStats = searchParams.get("stats") === "true";

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get mood history
    const { data: history, error } = await supabase
      .from("mood_history")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    let stats: MoodStatsResponse | null = null;

    if (includeStats && history && history.length > 0) {
      // Calculate stats
      const moodCounts: Record<string, number> = {};
      let totalIntensity = 0;
      const outcomeCounts: Record<string, Record<string, number>> = {};

      for (const entry of history) {
        const mood = entry.mood as GamingMood;
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        totalIntensity += entry.intensity;

        if (entry.outcome) {
          if (!outcomeCounts[mood]) {
            outcomeCounts[mood] = { good: 0, neutral: 0, bad: 0 };
          }
          outcomeCounts[mood][entry.outcome]++;
        }
      }

      // Find most common mood
      const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
      const mostCommonMood = sortedMoods[0]?.[0] as GamingMood || "chill";

      // Find best outcome mood
      let bestOutcomeMood: GamingMood = mostCommonMood;
      let bestRatio = 0;

      for (const [mood, outcomes] of Object.entries(outcomeCounts)) {
        const total = outcomes.good + outcomes.neutral + outcomes.bad;
        if (total >= 3) {
          const ratio = outcomes.good / total;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestOutcomeMood = mood as GamingMood;
          }
        }
      }

      // Build mood distribution
      const moodDistribution: Record<GamingMood, number> = {} as Record<GamingMood, number>;
      for (const mood of Object.keys(GAMING_MOODS) as GamingMood[]) {
        moodDistribution[mood] = moodCounts[mood] || 0;
      }

      stats = {
        totalEntries: history.length,
        mostCommonMood,
        averageIntensity: Math.round((totalIntensity / history.length) * 10) / 10,
        moodDistribution,
        bestOutcomeMood,
      };
    }

    return NextResponse.json({
      history: history || [],
      stats,
    });
  } catch (error) {
    console.error("Get mood history error:", error);
    return NextResponse.json(
      { error: "Failed to get mood history" },
      { status: 500 }
    );
  }
}

// PATCH - Update a history entry (e.g., to add outcome)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("id");

    if (!entryId) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.outcome !== undefined) {
      if (!["good", "neutral", "bad"].includes(body.outcome)) {
        return NextResponse.json(
          { error: "Outcome must be 'good', 'neutral', or 'bad'" },
          { status: 400 }
        );
      }
      updates.outcome = body.outcome;
    }

    if (body.duration_minutes !== undefined) {
      updates.duration_minutes = Math.max(0, body.duration_minutes);
    }

    const { data: entry, error } = await supabase
      .from("mood_history")
      .update(updates)
      .eq("id", entryId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Entry not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Update mood history error:", error);
    return NextResponse.json(
      { error: "Failed to update mood history" },
      { status: 500 }
    );
  }
}
