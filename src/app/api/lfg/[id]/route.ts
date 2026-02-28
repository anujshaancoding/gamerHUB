import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single LFG post with applications
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = createClient();

    const { data: post, error } = await db
      .from("lfg_posts")
      .select(
        `
        *,
        creator:profiles!lfg_posts_creator_id_fkey(
          id, username, display_name, avatar_url, region, gaming_style
        ),
        game:games!lfg_posts_game_id_fkey(
          id, slug, name, icon_url, banner_url
        ),
        lfg_applications(
          *,
          applicant:profiles!lfg_applications_applicant_id_fkey(
            id, username, display_name, avatar_url, region
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { error: "LFG post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("LFG fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update LFG post
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: existingPost } = await db
      .from("lfg_posts")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!existingPost || existingPost.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to update this post" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      "title",
      "description",
      "looking_for_roles",
      "min_rating",
      "max_rating",
      "accept_unranked",
      "game_mode",
      "voice_required",
      "status",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    updates.updated_at = new Date().toISOString();

    const { data: post, error: updateError } = await db
      .from("lfg_posts")
      .update(updates as never)
      .eq("id", id)
      .select(
        `
        *,
        creator:profiles!lfg_posts_creator_id_fkey(
          id, username, display_name, avatar_url
        ),
        game:games!lfg_posts_game_id_fkey(
          id, slug, name, icon_url
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Error updating LFG post:", updateError);
      return NextResponse.json(
        { error: "Failed to update LFG post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("LFG update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete/Cancel LFG post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: existingPost } = await db
      .from("lfg_posts")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!existingPost || existingPost.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this post" },
        { status: 403 }
      );
    }

    // Soft delete by setting status to cancelled
    const { error: deleteError } = await db
      .from("lfg_posts")
      .update({ status: "cancelled", updated_at: new Date().toISOString() } as never)
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting LFG post:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete LFG post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("LFG delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
