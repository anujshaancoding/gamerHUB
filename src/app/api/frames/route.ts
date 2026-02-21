import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProfileFrame } from "@/types/database";

// GET - List all frames
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: frames, error } = await supabase
      .from("profile_frames")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching frames:", error);
      return NextResponse.json(
        { error: "Failed to fetch frames" },
        { status: 500 }
      );
    }

    // Get current user's unlocked frames
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let unlockedFrameIds: string[] = [];
    if (user) {
      const { data: userFrames } = await supabase
        .from("user_frames")
        .select("frame_id")
        .eq("user_id", user.id);
      unlockedFrameIds =
        (userFrames as { frame_id: string }[] | null)?.map((f) => f.frame_id) || [];
    }

    const typedFrames = frames as ProfileFrame[] | null;
    const framesWithStatus = typedFrames?.map((frame) => ({
      ...frame,
      is_unlocked: unlockedFrameIds.includes(frame.id),
      requires_premium: frame.unlock_type === "special" || frame.unlock_type === "purchase",
    }));

    return NextResponse.json({ frames: framesWithStatus || [] });
  } catch (error) {
    console.error("Frames list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
