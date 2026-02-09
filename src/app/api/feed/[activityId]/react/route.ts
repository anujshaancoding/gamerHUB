import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Toggle reaction on activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { activityId } = await params;
    const body = await request.json().catch(() => ({}));
    const reactionType = body.reactionType || "like";

    // Toggle reaction using RPC - eslint-disable for untyped RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("toggle_activity_reaction", {
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

    return NextResponse.json({
      success: true,
      action: data.action,
      reactionType: data.reaction_type,
    });
  } catch (error) {
    console.error("React error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
