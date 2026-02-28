import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// GET - Get replies for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const db = createClient();
    const user = await getUser();

    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "oldest"; // oldest, newest, top
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (db as any)
      .from("forum_replies")
      .select(`
        id,
        post_id,
        parent_id,
        content,
        vote_score,
        is_solution,
        created_at,
        updated_at,
        author:profiles!author_id (
          id,
          username,
          display_name,
          avatar_url,
          level,
          title
        )
      `, { count: "exact" })
      .eq("post_id", postId)
      .eq("is_deleted", false);

    // Sort
    switch (sort) {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "top":
        query = query
          .order("is_solution", { ascending: false })
          .order("vote_score", { ascending: false })
          .order("created_at", { ascending: true });
        break;
      case "oldest":
      default:
        query = query
          .order("is_solution", { ascending: false })
          .order("created_at", { ascending: true });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: replies, error, count } = await query;

    if (error) {
      console.error("Error fetching replies:", error);
      return NextResponse.json(
        { error: "Failed to fetch replies" },
        { status: 500 }
      );
    }

    // Get user's votes if authenticated
    let userVotes: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repliesArray = replies as any[] | null;
    if (user && repliesArray && repliesArray.length > 0) {
      const replyIds = repliesArray.map((r) => r.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: votes } = await (db as any)
        .from("forum_votes")
        .select("reply_id, vote_type")
        .eq("user_id", user.id)
        .in("reply_id", replyIds);

      if (votes) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userVotes = (votes as any[]).reduce((acc, v) => {
          if (v.reply_id) acc[v.reply_id] = v.vote_type;
          return acc;
        }, {} as Record<string, number>);
      }
    }

    // Add user votes to replies
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repliesWithVotes = repliesArray?.map((reply: any) => ({
      ...reply,
      user_vote: userVotes[reply.id] || null,
    }));

    // Organize into nested structure (top-level and children)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topLevelReplies = repliesWithVotes?.filter((r: any) => !r.parent_id) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childReplies = repliesWithVotes?.filter((r: any) => r.parent_id) || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nestedReplies = topLevelReplies.map((parent: any) => ({
      ...parent,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: childReplies.filter((c: any) => c.parent_id === parent.id),
    }));

    return NextResponse.json({
      replies: nestedReplies,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Replies fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a reply
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if post exists and is not locked - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error: postError } = await (db as any)
      .from("forum_posts")
      .select("id, is_locked, is_deleted")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.is_deleted) {
      return NextResponse.json(
        { error: "Cannot reply to deleted post" },
        { status: 400 }
      );
    }

    if (post.is_locked) {
      return NextResponse.json(
        { error: "This post is locked" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, parentId } = body;

    if (!content || content.length < 2) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // If replying to another reply, verify parent exists
    if (parentId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: parentReply } = await (db as any)
        .from("forum_replies")
        .select("id, is_deleted")
        .eq("id", parentId)
        .eq("post_id", postId)
        .single();

      if (!parentReply || parentReply.is_deleted) {
        return NextResponse.json(
          { error: "Parent reply not found" },
          { status: 404 }
        );
      }
    }

    // Create reply using function - eslint-disable for untyped RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: replyId, error: replyError } = await (db as any).rpc(
      "create_forum_reply",
      {
        p_post_id: postId,
        p_author_id: user.id,
        p_content: content,
        p_parent_id: parentId || null,
      }
    );

    if (replyError) {
      console.error("Error creating reply:", replyError);
      return NextResponse.json(
        { error: "Failed to create reply" },
        { status: 500 }
      );
    }

    // Fetch the created reply - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reply } = await (db as any)
      .from("forum_replies")
      .select(`
        id,
        content,
        vote_score,
        created_at,
        author:profiles!author_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq("id", replyId)
      .single();

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Reply creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
