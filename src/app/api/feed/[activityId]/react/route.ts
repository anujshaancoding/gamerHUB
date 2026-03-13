import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// POST - Toggle reaction on activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { activityId } = await params;
    const body = await request.json().catch(() => ({}));
    const reactionType = body.reactionType || "like";

    // Toggle reaction using RPC — untyped RPC function
    const { data, error } = await db.rpc("toggle_activity_reaction", {
      p_user_id: user.id,
      p_activity_id: activityId,
      p_reaction_type: reactionType,
    });

    if (error) {
      console.error("Error toggling reaction:", error);
      return NextResponse.json(
        { error: "Failed to toggle reaction" },
        { status: 500 }
      );
    }

    const result = data as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      action: result.action,
      reactionType: result.reaction_type,
    });
  } catch (error) {
    console.error("React error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
