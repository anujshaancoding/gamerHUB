import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get challenge details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;
    const supabase = await createClient();

    // Get current user for progress info
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("community_challenges")
      .select(
        `
        *,
        game:games(*),
        season:seasons(*)
      `
      )
      .eq("id", challengeId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Challenge not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching challenge:", error);
      return NextResponse.json(
        { error: "Failed to fetch challenge" },
        { status: 500 }
      );
    }

    // Get participant and completion counts
    const { count: participantCount } = await supabase
      .from("challenge_progress")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challengeId);

    const { count: completionCount } = await supabase
      .from("challenge_progress")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challengeId)
      .eq("status", "completed");

    // Get user's progress if logged in
    let userProgress = null;
    if (user) {
      const { data: progressData } = await supabase
        .from("challenge_progress")
        .select("*")
        .eq("challenge_id", challengeId)
        .eq("user_id", user.id)
        .single();

      userProgress = progressData;
    }

    return NextResponse.json({
      challenge: {
        ...(data as any),
        participant_count: participantCount || 0,
        completion_count: completionCount || 0,
        user_progress: userProgress,
      },
    });
  } catch (error) {
    console.error("Challenge detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
