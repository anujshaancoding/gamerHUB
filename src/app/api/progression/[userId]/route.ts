import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";

// GET - Get specific user's progression
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const db = createClient();

    const { data: progression, error } = await db
      .from("user_progression")
      .select(
        `
        *,
        active_title:titles(*),
        active_frame:profile_frames(*),
        active_theme:profile_themes(*)
      `
      )
      .eq("user_id", userId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Progression not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ progression });
  } catch (error) {
    console.error("Progression fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
