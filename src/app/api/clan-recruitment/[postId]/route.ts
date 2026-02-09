import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ClanMember, ClanRecruitmentPost } from "@/types/database";

interface RouteParams {
  params: Promise<{ postId: string }>;
}

// GET - Get recruitment post details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { postId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clan_recruitment_posts")
      .select(
        `
        *,
        clan:clans(
          *,
          primary_game:games!clans_primary_game_id_fkey(*),
          clan_members(
            *,
            profile:profiles(*)
          ),
          clan_games(
            *,
            game:games(*)
          )
        ),
        game:games(*),
        created_by_profile:profiles!clan_recruitment_posts_created_by_fkey(*)
      `
      )
      .eq("id", postId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Recruitment post not found" },
        { status: 404 }
      );
    }

    // Increment views count
    const postData = data as { views_count?: number };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase
      .from("clan_recruitment_posts") as any)
      .update({ views_count: (postData.views_count || 0) + 1 })
      .eq("id", postId);

    return NextResponse.json({ post: data });
  } catch (error) {
    console.error("Recruitment post fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update recruitment post
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get post to check clan_id
    const { data: postData } = await supabase
      .from("clan_recruitment_posts")
      .select("clan_id")
      .eq("id", postId)
      .single();

    const post = postData as unknown as Pick<ClanRecruitmentPost, "clan_id"> | null;

    if (!post) {
      return NextResponse.json(
        { error: "Recruitment post not found" },
        { status: 404 }
      );
    }

    // Check if user is an officer
    const { data: membership } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", post.clan_id)
      .eq("user_id", user.id)
      .single();

    const member = membership as unknown as Pick<ClanMember, "role"> | null;

    if (!member || !["leader", "co_leader", "officer"].includes(member.role)) {
      return NextResponse.json(
        { error: "Only clan officers can update recruitment posts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      "title",
      "description",
      "game_id",
      "requirements",
      "positions_available",
      "is_active",
      "expires_at",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("clan_recruitment_posts")
      .update(updates as never)
      .eq("id", postId)
      .select(
        `
        *,
        clan:clans(id, name, tag, slug, avatar_url),
        game:games(*),
        created_by_profile:profiles!clan_recruitment_posts_created_by_fkey(*)
      `
      )
      .single();

    if (error) {
      console.error("Failed to update recruitment post:", error);
      return NextResponse.json(
        { error: "Failed to update recruitment post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: data });
  } catch (error) {
    console.error("Update recruitment post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete recruitment post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get post to check clan_id
    const { data: postData } = await supabase
      .from("clan_recruitment_posts")
      .select("clan_id")
      .eq("id", postId)
      .single();

    const post = postData as unknown as Pick<ClanRecruitmentPost, "clan_id"> | null;

    if (!post) {
      return NextResponse.json(
        { error: "Recruitment post not found" },
        { status: 404 }
      );
    }

    // Check if user is an officer
    const { data: membership } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", post.clan_id)
      .eq("user_id", user.id)
      .single();

    const member = membership as unknown as Pick<ClanMember, "role"> | null;

    if (!member || !["leader", "co_leader", "officer"].includes(member.role)) {
      return NextResponse.json(
        { error: "Only clan officers can delete recruitment posts" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("clan_recruitment_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("Failed to delete recruitment post:", error);
      return NextResponse.json(
        { error: "Failed to delete recruitment post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete recruitment post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
