import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get comments for a community listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Verify listing exists and is visible
    const { data: listing } = await supabase
      .from("community_listings")
      .select("id")
      .eq("id", id)
      .in("status", ["active", "completed"])
      .single();

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Get current user for like status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get top-level comments (no parent)
    const { data: comments, error, count } = await supabase
      .from("community_listing_comments")
      .select(
        `
        *,
        author:profiles!community_listing_comments_author_id_fkey(
          id, username, display_name, avatar_url
        )
      `,
        { count: "exact" }
      )
      .eq("listing_id", id)
      .eq("status", "visible")
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching listing comments:", error);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment: Record<string, unknown>) => {
        const { data: replies } = await supabase
          .from("community_listing_comments")
          .select(
            `
            *,
            author:profiles!community_listing_comments_author_id_fkey(
              id, username, display_name, avatar_url
            )
          `
          )
          .eq("parent_id", comment.id)
          .eq("status", "visible")
          .order("created_at", { ascending: true });

        // Check if user has liked this comment
        let userHasLiked = false;
        if (user) {
          const { data: like } = await supabase
            .from("community_listing_comment_likes")
            .select("id")
            .eq("comment_id", comment.id as string)
            .eq("user_id", user.id)
            .single();
          userHasLiked = !!like;
        }

        return {
          ...comment,
          replies: replies || [],
          user_has_liked: userHasLiked,
        };
      })
    );

    return NextResponse.json({
      comments: commentsWithReplies,
      total: count || 0,
      allow_comments: true,
    });
  } catch (error) {
    console.error("Listing comments fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a comment to a community listing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify listing exists and is visible
    const { data: listing } = await supabase
      .from("community_listings")
      .select("id")
      .eq("id", id)
      .in("status", ["active", "completed"])
      .single();

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, parent_id } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Comment must be 2000 characters or less" },
        { status: 400 }
      );
    }

    // Verify parent comment exists if replying
    if (parent_id) {
      const { data: parentComment } = await supabase
        .from("community_listing_comments")
        .select("id")
        .eq("id", parent_id)
        .eq("listing_id", id)
        .single();

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 400 }
        );
      }
    }

    const { data: comment, error: commentError } = await supabase
      .from("community_listing_comments")
      .insert({
        listing_id: id,
        author_id: user.id,
        parent_id: parent_id || null,
        content: content.trim(),
      } as never)
      .select(
        `
        *,
        author:profiles!community_listing_comments_author_id_fkey(
          id, username, display_name, avatar_url
        )
      `
      )
      .single();

    if (commentError) {
      console.error("Error creating listing comment:", commentError);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Listing comment creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
