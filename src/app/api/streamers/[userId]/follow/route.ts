import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Toggle follow on a streamer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get streamer profile
    const { data: streamer, error: streamerError } = await supabase
      .from("streamer_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (streamerError || !streamer) {
      return NextResponse.json(
        { error: "Streamer not found" },
        { status: 404 }
      );
    }

    // Can't follow yourself
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Toggle follow
    const { data: result, error } = await supabase.rpc(
      "toggle_streamer_follow",
      {
        p_user_id: user.id,
        p_streamer_id: streamer.id,
      }
    );

    if (error) {
      console.error("Error toggling follow:", error);
      return NextResponse.json(
        { error: "Failed to toggle follow" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Follow toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
