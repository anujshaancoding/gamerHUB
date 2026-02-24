import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ clanId: string; postId: string }>;
}

// PATCH - Update wall post (pin/unpin, edit content, toggle reaction)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId, postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Handle reaction toggle separately
    if (body.reaction) {
      const { data: post } = await supabase
        .from("clan_wall_posts")
        .select("reactions")
        .eq("id", postId)
        .eq("clan_id", clanId)
        .single();

      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      const reactions = (post.reactions as Record<string, string[]>) || {};
      const emoji = body.reaction as string;
      const userList = reactions[emoji] || [];

      if (userList.includes(user.id)) {
        reactions[emoji] = userList.filter((id) => id !== user.id);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...userList, user.id];
      }

      const { data, error } = await supabase
        .from("clan_wall_posts")
        .update({ reactions } as never)
        .eq("id", postId)
        .eq("clan_id", clanId)
        .select(
          `
          *,
          profile:profiles(id, username, display_name, avatar_url, is_premium)
        `
        )
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to update reaction" },
          { status: 500 }
        );
      }

      return NextResponse.json({ post: data });
    }

    // Handle pin/unpin (leaders/co-leaders only)
    if (body.is_pinned !== undefined) {
      const { data: membership } = await supabase
        .from("clan_members")
        .select("role")
        .eq("clan_id", clanId)
        .eq("user_id", user.id)
        .single();

      if (
        !membership ||
        !["leader", "co_leader"].includes((membership as any).role)
      ) {
        return NextResponse.json(
          { error: "Only leaders can pin posts" },
          { status: 403 }
        );
      }

      const { data, error } = await supabase
        .from("clan_wall_posts")
        .update({ is_pinned: body.is_pinned } as never)
        .eq("id", postId)
        .eq("clan_id", clanId)
        .select(
          `
          *,
          profile:profiles(id, username, display_name, avatar_url, is_premium)
        `
        )
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to update post" },
          { status: 500 }
        );
      }

      return NextResponse.json({ post: data });
    }

    // Handle content edit (author only)
    if (body.content !== undefined) {
      const { data: post } = await supabase
        .from("clan_wall_posts")
        .select("user_id")
        .eq("id", postId)
        .eq("clan_id", clanId)
        .single();

      if (!post || (post as any).user_id !== user.id) {
        return NextResponse.json(
          { error: "You can only edit your own posts" },
          { status: 403 }
        );
      }

      if (!body.content || body.content.trim().length === 0) {
        return NextResponse.json(
          { error: "Content is required" },
          { status: 400 }
        );
      }

      if (body.content.length > 280) {
        return NextResponse.json(
          { error: "Content must be 280 characters or less" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("clan_wall_posts")
        .update({
          content: body.content.trim(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", postId)
        .eq("clan_id", clanId)
        .select(
          `
          *,
          profile:profiles(id, username, display_name, avatar_url, is_premium)
        `
        )
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to update post" },
          { status: 500 }
        );
      }

      return NextResponse.json({ post: data });
    }

    return NextResponse.json(
      { error: "No valid update fields" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update wall post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete wall post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId, postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is post author or leader/co-leader
    const { data: post } = await supabase
      .from("clan_wall_posts")
      .select("user_id")
      .eq("id", postId)
      .eq("clan_id", clanId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if ((post as any).user_id !== user.id) {
      const { data: membership } = await supabase
        .from("clan_members")
        .select("role")
        .eq("clan_id", clanId)
        .eq("user_id", user.id)
        .single();

      if (
        !membership ||
        !["leader", "co_leader"].includes((membership as any).role)
      ) {
        return NextResponse.json(
          { error: "You can only delete your own posts" },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from("clan_wall_posts")
      .delete()
      .eq("id", postId)
      .eq("clan_id", clanId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete wall post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
