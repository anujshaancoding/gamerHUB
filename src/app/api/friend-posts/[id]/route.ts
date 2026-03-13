import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { createAdminClient } from "@/lib/db/admin";
import { getUserPermissionContext } from "@/lib/api/check-permission";
import { getUserTier, can } from "@/lib/permissions";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Fetch a single friend post by ID
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = createAdminClient();

    // Fetch the post
    const { data: post, error: postError } = await db
      .from("friend_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Fetch the user profile
    const postRecord = post as Record<string, unknown>;
    const { data: profile } = await db
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_verified")
      .eq("id", postRecord.user_id as string)
      .single();

    return NextResponse.json({
      post: { ...postRecord, user: profile || null },
    });
  } catch (error) {
    console.error("Friend post get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a friend post (editor+ can delete any, author can delete own)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Get the post
    const { data: post } = await admin
      .from("friend_posts")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check permissions: author can delete own, editor+ can delete any
    const isAuthor = post.user_id === user.id;

    if (!isAuthor) {
      const permCtx = await getUserPermissionContext(db);
      const tier = permCtx ? getUserTier(permCtx) : "free";
      if (!can.deleteFreeUserPost(tier)) {
        return NextResponse.json(
          { error: "Not authorized to delete this post" },
          { status: 403 }
        );
      }
    }

    // Delete the post using admin client to bypass RLS
    const { error: deleteError } = await admin
      .from("friend_posts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting friend post:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Friend post delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
