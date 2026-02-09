import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Equip a frame
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { frame_id } = body;

    // If frame_id is null, unequip current frame
    if (frame_id === null) {
      const { error } = await supabase
        .from("user_progression")
        .update({ active_frame_id: null } as never)
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to unequip frame:", error);
        return NextResponse.json(
          { error: "Failed to unequip frame" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, active_frame_id: null });
    }

    // Verify user owns this frame
    const { data: userFrame } = await supabase
      .from("user_frames")
      .select("id")
      .eq("user_id", user.id)
      .eq("frame_id", frame_id)
      .single();

    if (!userFrame) {
      return NextResponse.json(
        { error: "Frame not unlocked" },
        { status: 400 }
      );
    }

    // Update active frame
    const { error } = await supabase
      .from("user_progression")
      .update({ active_frame_id: frame_id } as never)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to equip frame:", error);
      return NextResponse.json(
        { error: "Failed to equip frame" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, active_frame_id: frame_id });
  } catch (error) {
    console.error("Frame equip error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
