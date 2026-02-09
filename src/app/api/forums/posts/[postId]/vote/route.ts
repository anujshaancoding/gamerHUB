import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Vote on a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from("forum_posts")
      .select("id, is_deleted, author_id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.is_deleted) {
      return NextResponse.json(
        { error: "Cannot vote on deleted post" },
        { status: 400 }
      );
    }

    // Prevent self-voting
    if (post.author_id === user.id) {
      return NextResponse.json(
        { error: "Cannot vote on your own post" },
        { status: 400 }
      );
    }

    // Toggle vote
    const { data: result, error: voteError } = await supabase.rpc(
      "toggle_forum_vote",
      {
        p_user_id: user.id,
        p_vote_type: voteType,
        p_post_id: postId,
        p_reply_id: null,
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
