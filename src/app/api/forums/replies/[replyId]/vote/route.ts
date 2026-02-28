import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// POST - Vote on a reply
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

    const body = await request.json();
    const { voteType } = body;

    // Validate vote type
    if (![1, -1].includes(voteType)) {
      return NextResponse.json(
        { error: "Invalid vote type" },
        { status: 400 }
      );
    }

    // Check if reply exists
    const { data: reply, error: replyError } = await db
      .from("forum_replies")
      .select("id, is_deleted, author_id")
      .eq("id", replyId)
      .single();

    if (replyError || !reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    if (reply.is_deleted) {
      return NextResponse.json(
        { error: "Cannot vote on deleted reply" },
        { status: 400 }
      );
    }

    // Prevent self-voting
    if (reply.author_id === user.id) {
      return NextResponse.json(
        { error: "Cannot vote on your own reply" },
        { status: 400 }
      );
    }

    // Toggle vote
    const { data: result, error: voteError } = await db.rpc(
      "toggle_forum_vote",
      {
        p_user_id: user.id,
        p_vote_type: voteType,
        p_post_id: null,
        p_reply_id: replyId,
      }
    );

    if (voteError) {
      console.error("Error voting:", voteError);
      return NextResponse.json(
        { error: "Failed to vote" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      score: result.score,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
