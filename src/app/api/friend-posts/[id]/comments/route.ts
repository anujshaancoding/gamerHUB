import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - List comments for a friend post
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;
    const db = createAdminClient();

    // 1. Fetch comments
    const { data: comments, error } = await db
      .from("friend_post_comments")
      .select("id, content, created_at, user_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Fetch comments error:", error);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    if (!comments || (comments as any[]).length === 0) {
      return NextResponse.json({ comments: [] });
    }

    // 2. Get unique user IDs and fetch their profiles
    const userIds = [...new Set((comments as any[]).map((c: any) => c.user_id).filter(Boolean))];

    const { data: profiles } = await db
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_verified")
      .in("id", userIds);

    const profileMap: Record<string, any> = {};
    for (const profile of (profiles || []) as any[]) {
      profileMap[profile.id] = profile;
    }

    // 3. Combine comments with user profiles
    const commentsWithUsers = (comments as any[]).map((comment: any) => ({
      ...comment,
      user: profileMap[comment.user_id] || null,
    }));

    return NextResponse.json({ comments: commentsWithUsers });
  } catch (error) {
    console.error("Comments GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a comment to a friend post
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;
    const db = createAdminClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const content = body.content?.trim();

    if (!content || content.length > 500) {
      return NextResponse.json(
        { error: "Comment must be between 1 and 500 characters" },
        { status: 400 }
      );
    }

    const { data, error } = await db.rpc("add_friend_post_comment", {
      p_post_id: postId,
      p_user_id: user.id,
      p_content: content,
    });

    if (error) {
      console.error("Add comment error:", error);
      return NextResponse.json(
        { error: "Failed to add comment" },
        { status: 500 }
      );
    }

    // Send notification to post owner (not to self)
    try {
      const { data: post } = await db
        .from("friend_posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (post && post.user_id !== user.id) {
        const { data: profile } = await db
          .from("profiles")
          .select("display_name, username")
          .eq("id", user.id)
          .single();

        const commenterName = profile?.display_name || profile?.username || "Someone";

        await db.from("notifications").insert({
          user_id: post.user_id,
          type: "post_comment",
          title: `${commenterName} commented on your post`,
          body: content.length > 100 ? content.slice(0, 100) + "…" : content,
          icon: "💬",
          action_url: `/community?post=${postId}`,
          action_label: "View post",
          metadata: { post_id: postId, commenter_id: user.id },
          is_read: false,
          is_archived: false,
        });
      }
    } catch (notifError) {
      // Don't fail the comment if notification fails
      console.error("Failed to create comment notification:", notifError);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Comment POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const db = createAdminClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 }
      );
    }

    const { data, error } = await db.rpc("delete_friend_post_comment", {
      p_comment_id: commentId,
      p_user_id: user.id,
    });

    if (error) {
      console.error("Delete comment error:", error);
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Comment DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
