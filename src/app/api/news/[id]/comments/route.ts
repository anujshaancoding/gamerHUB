import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";
import { isNewsHidden } from "@/lib/features/news/visibility";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get comments for a news article
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (await isNewsHidden()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { id: articleId } = await params;
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Verify article exists and is published
    const { data: article } = await db
      .from("news_articles")
      .select("id")
      .eq("id", articleId)
      .eq("status", "published")
      .single();

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Get current user for like status
    const user = await getUser();

    // Get top-level comments
    const { data: comments, error, count } = await db
      .from("news_article_comments")
      .select(
        `
        *,
        author:profiles!news_article_comments_author_id_fkey(
          id, username, display_name, avatar_url
        )
      `,
        { count: "exact" }
      )
      .eq("article_id", articleId)
      .eq("status", "visible")
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching news comments:", error);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    // Batch-fetch replies and likes for all top-level comments to avoid an
    // N+1 (previously 1 replies query + 1 likes query per comment).
    const commentIds = (comments || []).map(
      (c: Record<string, unknown>) => c.id as string
    );

    // One query for all replies, ordered ascending (oldest first) like before.
    const { data: allReplies } = commentIds.length
      ? await db
          .from("news_article_comments")
          .select(
            `
            *,
            author:profiles!news_article_comments_author_id_fkey(
              id, username, display_name, avatar_url
            )
          `
          )
          .in("parent_id", commentIds)
          .eq("status", "visible")
          .order("created_at", { ascending: true })
      : { data: [] };

    const repliesByParent = new Map<string, Record<string, unknown>[]>();
    for (const reply of allReplies || []) {
      const parentId = (reply as Record<string, unknown>).parent_id as string;
      const list = repliesByParent.get(parentId);
      if (list) {
        list.push(reply as Record<string, unknown>);
      } else {
        repliesByParent.set(parentId, [reply as Record<string, unknown>]);
      }
    }

    // One query for the current user's likes across all these comments.
    const likedCommentIds = new Set<string>();
    if (user && commentIds.length) {
      const { data: likes } = await db
        .from("news_article_comment_likes")
        .select("comment_id")
        .in("comment_id", commentIds)
        .eq("user_id", user.id);
      for (const like of likes || []) {
        likedCommentIds.add(
          (like as Record<string, unknown>).comment_id as string
        );
      }
    }

    const commentsWithReplies = (comments || []).map(
      (comment: Record<string, unknown>) => {
        const commentId = comment.id as string;
        return {
          ...comment,
          replies: repliesByParent.get(commentId) || [],
          user_has_liked: likedCommentIds.has(commentId),
        };
      }
    );

    return NextResponse.json({
      comments: commentsWithReplies,
      total: count || 0,
      allow_comments: true,
    });
  } catch (error) {
    console.error("News comments fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a comment to a news article
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    if (await isNewsHidden()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { id: articleId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify article exists and is published
    const { data: article } = await db
      .from("news_articles")
      .select("id")
      .eq("id", articleId)
      .eq("status", "published")
      .single();

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
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

    // Verify parent comment if replying
    if (parent_id) {
      const { data: parentComment } = await db
        .from("news_article_comments")
        .select("id")
        .eq("id", parent_id)
        .eq("article_id", articleId)
        .single();

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 400 }
        );
      }
    }

    const { data: comment, error: commentError } = await db
      .from("news_article_comments")
      .insert({
        article_id: articleId,
        author_id: user.id,
        parent_id: parent_id || null,
        content: content.trim(),
      } as never)
      .select(
        `
        *,
        author:profiles!news_article_comments_author_id_fkey(
          id, username, display_name, avatar_url
        )
      `
      )
      .single();

    if (commentError) {
      console.error("Error creating news comment:", commentError);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("News comment creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
