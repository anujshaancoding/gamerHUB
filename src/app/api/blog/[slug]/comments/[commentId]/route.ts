import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserPermissionContext } from "@/lib/api/check-permission";
import { getUserTier, can } from "@/lib/permissions";

interface RouteParams {
  params: Promise<{ slug: string; commentId: string }>;
}

// DELETE - Soft-delete a blog comment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, commentId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Get the comment
    const { data: comment } = await admin
      .from("blog_comments")
      .select("id, author_id, post_id, status")
      .eq("id", commentId)
      .single();

    if (!comment || comment.status === "deleted") {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Get the post to check ownership
    const { data: post } = await admin
      .from("blog_posts")
      .select("id, author_id, slug, comments_count")
      .eq("slug", slug)
      .single();

    if (!post || comment.post_id !== post.id) {
      return NextResponse.json(
        { error: "Comment not found on this post" },
        { status: 404 }
      );
    }

    // Permission check:
    // 1. Comment author can delete their own comment
    // 2. Post author can delete any comment on their post
    // 3. Editor+ can delete any comment
    const isCommentAuthor = comment.author_id === user.id;
    const isPostAuthor = post.author_id === user.id;

    if (!isCommentAuthor && !isPostAuthor) {
      const permCtx = await getUserPermissionContext(supabase);
      const tier = permCtx ? getUserTier(permCtx) : "free";
      if (!can.deleteAnyComment(tier)) {
        return NextResponse.json(
          { error: "Not authorized to delete this comment" },
          { status: 403 }
        );
      }
    }

    // Soft-delete: set status to 'deleted'
    const { error: updateError } = await admin
      .from("blog_comments")
      .update({
        status: "deleted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (updateError) {
      console.error("Error deleting comment:", updateError);
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }

    // Decrement comments_count since the DB trigger only fires on real DELETE,
    // not on UPDATE (soft-delete)
    await admin
      .from("blog_posts")
      .update({
        comments_count: Math.max(0, (post.comments_count ?? 1) - 1),
      })
      .eq("id", post.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comment delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
