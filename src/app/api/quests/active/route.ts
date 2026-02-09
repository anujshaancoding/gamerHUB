import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { privateCachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";
import type { UserQuestWithDetails } from "@/types/database";

// GET - Get current user's active quests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const questType = searchParams.get("type");

    let query = supabase
      .from("user_quests")
      .select(
        `
        *,
        quest:quest_definitions(*)
      `
      )
      .eq("user_id", user.id)
      .in("status", ["active", "completed"])
      .gt("expires_at", new Date().toISOString())
      .order("assigned_at", { ascending: false });

    if (questType) {
      query = query.eq("period_type", questType);
    }

    const { data: quests, error } = await query;

    if (error) {
      console.error("Error fetching quests:", error);
      return NextResponse.json(
        { error: "Failed to fetch quests" },
        { status: 500 }
      );
    }

    // Group by type
    const typedQuests = quests as UserQuestWithDetails[] | null;
    const dailyQuests = typedQuests?.filter((q) => q.period_type === "daily") || [];
    const weeklyQuests = typedQuests?.filter((q) => q.period_type === "weekly") || [];

    // Calculate reset times
    const now = new Date();
    const utcNow = new Date(now.toISOString());

    // Daily reset: next midnight UTC
    const nextDailyReset = new Date(utcNow);
    nextDailyReset.setUTCDate(nextDailyReset.getUTCDate() + 1);
    nextDailyReset.setUTCHours(0, 0, 0, 0);

    // Weekly reset: next Monday midnight UTC
    const nextWeeklyReset = new Date(utcNow);
    const daysUntilMonday = ((8 - nextWeeklyReset.getUTCDay()) % 7) || 7;
    nextWeeklyReset.setUTCDate(nextWeeklyReset.getUTCDate() + daysUntilMonday);
    nextWeeklyReset.setUTCHours(0, 0, 0, 0);

    return privateCachedResponse({
      daily: dailyQuests,
      weekly: weeklyQuests,
      resets: {
        daily: nextDailyReset.toISOString(),
        weekly: nextWeeklyReset.toISOString(),
      },
    }, CACHE_DURATIONS.USER_DATA);
  } catch (error) {
    console.error("Quests fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
