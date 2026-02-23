import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserPermissionContext } from "@/lib/api/check-permission";
import { getUserTier, can } from "@/lib/permissions";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET - Get single blog post by slug
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Get current user for like status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(
        `
        *,
        author:profiles!blog_posts_author_id_fkey(
          id, username, display_name, avatar_url, bio
        ),
        game:games!blog_posts_game_id_fkey(
          id, slug, name, icon_url, banner_url
        )
      `
      )
      .eq("slug", slug)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user has liked the post
    let userHasLiked = false;
    let userHasBookmarked = false;

    if (user) {
      const [likeResult, bookmarkResult] = await Promise.all([
        supabase
          .from("blog_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("blog_bookmarks")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      userHasLiked = !!likeResult.data;
      userHasBookmarked = !!bookmarkResult.data;
    }

    // View counting is handled client-side with sessionStorage dedup
    // to prevent inflated counts from bots, crawlers, and repeat visits

    // Get blog author info
    const { data: blogAuthor } = await supabase
      .from("blog_authors")
      .select("*")
      .eq("user_id", post.author_id)
      .single();

    return NextResponse.json({
      post: {
        ...post,
        user_has_liked: userHasLiked,
        user_has_bookmarked: userHasBookmarked,
        author: {
          ...post.author,
          blog_author: blogAuthor,
        },
      },
    });
  } catch (error) {
    console.error("Blog fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update blog post
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get post and verify ownership
    const { data: existingPost } = await supabase
      .from("blog_posts")
      .select("id, author_id, status")
      .eq("slug", slug)
      .single();

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingPost.author_id !== user.id) {
      // Check if user is an editor/admin
      const { data: author } = await supabase
        .from("blog_authors")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!author || !["editor", "admin"].includes(author.role)) {
        return NextResponse.json(
          { error: "Not authorized to update this post" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const allowedFields = [
      "title",
      "content",
      "content_json",
      "excerpt",
      "featured_image_url",
      "game_id",
      "category",
      "tags",
      "template",
      "color_palette",
      "status",
      "meta_title",
      "meta_description",
      "allow_comments",
      "is_featured",
      "is_pinned",
    ];

    // Editor+ can set editor_notes on blog posts
    if (body.editor_notes !== undefined) {
      const permCtx = await getUserPermissionContext(supabase);
      const tier = permCtx ? getUserTier(permCtx) : "free";
      if (can.suggestEdits(tier)) {
        allowedFields.push("editor_notes");
      }
    }

    // Restrict "news" category to editors and admins only
    if (body.category === "news") {
      const permCtx = await getUserPermissionContext(supabase);
      const tier = permCtx ? getUserTier(permCtx) : "free";
      if (!can.useNewsCategory(tier)) {
        return NextResponse.json(
          { error: 'The "News" category is restricted to editors and administrators' },
          { status: 403 }
        );
      }
    }

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Handle publishing
    if (updates.status === "published" && existingPost.status !== "published") {
      updates.published_at = new Date().toISOString();
    }

    updates.updated_at = new Date().toISOString();

    const updateSelect = `
      *,
      author:profiles!blog_posts_author_id_fkey(
        id, username, display_name, avatar_url
      ),
      game:games!blog_posts_game_id_fkey(
        id, slug, name, icon_url
      )
    `;

    let { data: post, error: updateError } = await supabase
      .from("blog_posts")
      .update(updates as never)
      .eq("slug", slug)
      .select(updateSelect)
      .single();

    // If update failed (possibly due to template/color_palette columns missing),
    // retry without those fields
    if (updateError && (updates.template || updates.color_palette)) {
      delete updates.template;
      delete updates.color_palette;

      const retry = await supabase
        .from("blog_posts")
        .update(updates as never)
        .eq("slug", slug)
        .select(updateSelect)
        .single();

      post = retry.data;
      updateError = retry.error;
    }

    if (updateError) {
      console.error("Error updating blog post:", updateError);
      return NextResponse.json(
        { error: "Failed to update post" },
        { status: 500 }
      );
    }

    // On-demand ISR revalidation — instant freshness after update
    revalidatePath(`/blog/${slug}`);
    revalidatePath("/blog");
    revalidatePath("/community");

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Blog update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete blog post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get post and verify ownership
    const { data: existingPost } = await supabase
      .from("blog_posts")
      .select("id, author_id, status")
      .eq("slug", slug)
      .single();

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only allow deletion of drafts by author, or by editors/admins
    const isAuthor = existingPost.author_id === user.id;
    const isDraft = existingPost.status === "draft";

    if (!isAuthor || !isDraft) {
      // Check if user is a blog editor/admin or a site admin
      const [{ data: author }, { data: profile }] = await Promise.all([
        supabase
          .from("blog_authors")
          .select("role")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single(),
      ]);

      const isBlogAdmin = author && ["editor", "admin"].includes(author.role);
      const isSiteAdmin = profile?.is_admin;

      if (!isBlogAdmin && !isSiteAdmin) {
        return NextResponse.json(
          { error: "Cannot delete published posts" },
          { status: 403 }
        );
      }
    }

    // Use admin client for deletion to bypass RLS — permission checks above
    // already verified the user is authorized to delete this post
    const admin = createAdminClient();
    const { error: deleteError } = await admin
      .from("blog_posts")
      .delete()
      .eq("slug", slug);

    if (deleteError) {
      console.error("Error deleting blog post:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }

    // On-demand ISR revalidation — remove stale cached page
    revalidatePath(`/blog/${slug}`);
    revalidatePath("/blog");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blog delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
