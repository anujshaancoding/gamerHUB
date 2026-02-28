import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// POST - Toggle like on a blog post
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get post ID from slug
    const { data: post } = await db
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if already liked
    const { data: existingLike } = await db
      .from("blog_likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingLike) {
      // Unlike
      await db
        .from("blog_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);

      revalidatePath(`/blog/${slug}`);
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await db.from("blog_likes").insert({
        post_id: post.id,
        user_id: user.id,
      } as never);

      revalidatePath(`/blog/${slug}`);
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Blog like error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
