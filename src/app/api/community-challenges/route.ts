import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// GET - List active community challenges
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const seasonId = searchParams.get("season_id");
    const gameId = searchParams.get("game_id");
    const periodType = searchParams.get("period_type");
    const difficulty = searchParams.get("difficulty");
    const status = searchParams.get("status") || "active";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get current user for progress info
    const user = await getUser();

    let query = db
      .from("community_challenges")
      .select(
        `
        *,
        game:games(*),
        season:seasons(id, name, slug),
        progress:challenge_progress(count)
      `,
        { count: "exact" }
      )
      .order("starts_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (seasonId) {
      query = query.eq("season_id", seasonId);
    }

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    if (periodType) {
      query = query.eq("period_type", periodType);
    }

    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching challenges:", error);
      return NextResponse.json(
        { error: "Failed to fetch challenges" },
        { status: 500 }
      );
    }

    // Get user progress for each challenge if logged in
    let userProgressMap: Record<string, unknown> = {};
    const challengeData = data as any[];
    if (user && challengeData) {
      const challengeIds = challengeData.map((c: any) => c.id);
      const { data: progressData } = await db
        .from("challenge_progress")
        .select("*")
        .eq("user_id", user.id)
        .in("challenge_id", challengeIds);

      if (progressData) {
        userProgressMap = (progressData as any[]).reduce(
          (acc: Record<string, unknown>, p: any) => {
            acc[p.challenge_id] = p;
            return acc;
          },
          {} as Record<string, unknown>
        );
      }
    }

    // Get completion counts
    const completionCounts = await Promise.all(
      (challengeData || []).map(async (challenge: any) => {
        const { count: completedCount } = await db
          .from("challenge_progress")
          .select("*", { count: "exact", head: true })
          .eq("challenge_id", challenge.id)
          .eq("status", "completed");
        return { id: challenge.id, completed: completedCount || 0 };
      })
    );

    const completionMap = completionCounts.reduce(
      (acc, c) => {
        acc[c.id] = c.completed;
        return acc;
      },
      {} as Record<string, number>
    );

    // Transform data
    const challenges = (challengeData || []).map((challenge: any) => ({
      ...challenge,
      participant_count: challenge.progress?.[0]?.count || 0,
      completion_count: completionMap[challenge.id] || 0,
      user_progress: userProgressMap[challenge.id] || null,
    }));

    return NextResponse.json({
      challenges,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Challenges list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
