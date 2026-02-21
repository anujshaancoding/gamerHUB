import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Toggle like on a listing comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { comment_id } = body;

    if (!comment_id) {
      return NextResponse.json({ error: "comment_id is required" }, { status: 400 });
    }

    // Verify comment exists and belongs to this listing
    const { data: comment } = await supabase
      .from("community_listing_comments")
      .select("id, likes_count")
      .eq("id", comment_id)
      .eq("listing_id", listingId)
      .single();

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("community_listing_comment_likes")
      .select("id")
      .eq("comment_id", comment_id)
      .eq("user_id", user.id)
      .single();

    if (existingLike) {
      // Unlike
      await supabase
        .from("community_listing_comment_likes")
        .delete()
        .eq("comment_id", comment_id)
        .eq("user_id", user.id);

      // Decrement likes count
      await supabase
        .from("community_listing_comments")
        .update({ likes_count: Math.max(0, (comment.likes_count || 1) - 1) } as never)
        .eq("id", comment_id);

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await supabase.from("community_listing_comment_likes").insert({
        comment_id,
        user_id: user.id,
      } as never);

      // Increment likes count
      await supabase
        .from("community_listing_comments")
        .update({ likes_count: (comment.likes_count || 0) + 1 } as never)
        .eq("id", comment_id);

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Listing comment like toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
