import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Join a challenge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get challenge details
    const { data: challengeData, error: challengeError } = await supabase
      .from("community_challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    const challenge = challengeData as {
      status: string;
      ends_at: string;
      max_participants: number | null;
      objectives: { target: number }[];
    } | null;

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Check if challenge is active
    if (challenge.status !== "active") {
      return NextResponse.json(
        { error: "Challenge is not active" },
        { status: 400 }
      );
    }

    // Check if challenge hasn't expired
    if (new Date(challenge.ends_at) < new Date()) {
      return NextResponse.json(
        { error: "Challenge has expired" },
        { status: 400 }
      );
    }

    // Check if user already joined
    const { data: existingProgress } = await supabase
      .from("challenge_progress")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .single();

    if (existingProgress) {
      return NextResponse.json(
        { error: "You have already joined this challenge" },
        { status: 400 }
      );
    }

    // Check max participants
    if (challenge.max_participants) {
      const { count } = await supabase
        .from("challenge_progress")
        .select("*", { count: "exact", head: true })
        .eq("challenge_id", challengeId);

      if ((count || 0) >= challenge.max_participants) {
        return NextResponse.json(
          { error: "Challenge has reached maximum participants" },
          { status: 400 }
        );
      }
    }

    // Initialize progress based on objectives
    const objectives = (challenge.objectives as { target: number }[]) || [];
    const initialProgress = objectives.map((obj, index) => ({
      objective_index: index,
      current: 0,
      target: obj.target || 0,
      completed: false,
    }));

    // Create progress entry
    const { data: progress, error: progressError } = await supabase
      .from("challenge_progress")
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        status: "in_progress",
        progress: initialProgress,
      } as never)
      .select()
      .single();

    if (progressError) {
      console.error("Error joining challenge:", progressError);
      return NextResponse.json(
        { error: "Failed to join challenge" },
        { status: 500 }
      );
    }

    return NextResponse.json({ progress }, { status: 201 });
  } catch (error) {
    console.error("Join challenge error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
