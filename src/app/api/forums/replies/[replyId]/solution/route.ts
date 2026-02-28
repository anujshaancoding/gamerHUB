import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// POST - Mark a reply as the solution
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    const { replyId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get reply and its post
    const { data: reply, error: replyError } = await db
      .from("forum_replies")
      .select("id, post_id, is_deleted")
      .eq("id", replyId)
      .single();

    if (replyError || !reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    if (reply.is_deleted) {
      return NextResponse.json(
        { error: "Cannot mark deleted reply as solution" },
        { status: 400 }
      );
    }

    // Mark as solution (function checks ownership)
    const { data: success, error: solError } = await db.rpc(
      "mark_reply_as_solution",
      {
        p_post_id: reply.post_id,
        p_reply_id: replyId,
        p_user_id: user.id,
      }
    );

    if (solError) {
      console.error("Error marking solution:", solError);
      return NextResponse.json(
        { error: "Failed to mark solution" },
        { status: 500 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: "Only the post author can mark a solution" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Solution error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
