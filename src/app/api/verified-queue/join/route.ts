import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  type JoinQueueRequest,
  canAccessVerifiedQueue,
} from "@/types/verified-queue";

// POST /api/verified-queue/join - Join the verified queue
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: JoinQueueRequest = await request.json();
    const { game_id, game_mode, rank, region, min_behavior_score = 50 } = body;

    if (!game_id || !region) {
      return NextResponse.json(
        { error: "game_id and region are required" },
        { status: 400 }
      );
    }

    // Check verified profile
    const { data: profile, error: profileError } = await supabase
      .from("verified_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Verified profile not found" },
        { status: 404 }
      );
    }

    // Check eligibility
    if (!canAccessVerifiedQueue(profile)) {
      let reason = "Not eligible for verified queue";
      if (profile.status !== "verified") {
        reason = "Account not verified";
      } else if (profile.behavior_score < 50) {
        reason = "Behavior score too low (minimum 50 required)";
      } else if (profile.active_strikes > 0) {
        reason = "You have active strikes on your account";
      }

      return NextResponse.json(
        { error: reason, eligible: false },
        { status: 403 }
      );
    }

    // Check for existing queue entry
    const { data: existingEntry } = await supabase
      .from("verified_queue_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "searching")
      .single();

    if (existingEntry) {
      return NextResponse.json(
        { error: "Already in queue", entry: existingEntry },
        { status: 400 }
      );
    }

    // Create queue entry
    const { data: entry, error: entryError } = await supabase
      .from("verified_queue_entries")
      .insert({
        user_id: user.id,
        game_id,
        game_mode,
        rank,
        region,
        min_behavior_score: Math.max(min_behavior_score, 50),
        status: "searching",
      })
      .select()
      .single();

    if (entryError) {
      console.error("Failed to create queue entry:", entryError);
      return NextResponse.json(
        { error: "Failed to join queue" },
        { status: 500 }
      );
    }

    // Try to find matches (simplified matching logic)
    const { data: potentialMatches } = await supabase
      .from("verified_queue_entries")
      .select(
        `
        *,
        user:profiles!verified_queue_entries_user_id_fkey(
          id,
          username,
          avatar_url
        ),
        verified_profile:verified_profiles!verified_queue_entries_user_id_fkey(
          behavior_score,
          behavior_rating
        )
      `
      )
      .eq("game_id", game_id)
      .eq("region", region)
      .eq("status", "searching")
      .neq("user_id", user.id)
      .gte("min_behavior_score", 50)
      .limit(10);

    return NextResponse.json({
      entry,
      potentialMatches: potentialMatches || [],
      message: "Successfully joined the verified queue",
    });
  } catch (error) {
    console.error("Join verified queue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/verified-queue/join - Leave the queue
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cancel any searching entries
    const { data, error } = await supabase
      .from("verified_queue_entries")
      .update({ status: "cancelled" })
      .eq("user_id", user.id)
      .eq("status", "searching")
      .select();

    if (error) {
      console.error("Failed to leave queue:", error);
      return NextResponse.json(
        { error: "Failed to leave queue" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Successfully left the queue",
      cancelled: data?.length || 0,
    });
  } catch (error) {
    console.error("Leave queue error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/verified-queue/join - Get current queue status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current queue entries
    const { data: entries, error } = await supabase
      .from("verified_queue_entries")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["searching", "matched"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to get queue status:", error);
      return NextResponse.json(
        { error: "Failed to get queue status" },
        { status: 500 }
      );
    }

    const currentEntry = entries?.find((e) => e.status === "searching");
    const recentMatches = entries?.filter((e) => e.status === "matched");

    return NextResponse.json({
      inQueue: !!currentEntry,
      currentEntry,
      recentMatches,
    });
  } catch (error) {
    console.error("Get queue status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
