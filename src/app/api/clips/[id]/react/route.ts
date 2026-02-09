import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ClipReactionType } from "@/types/community";

// POST - Add or update reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clipId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reaction_type }: { reaction_type: ClipReactionType } =
      await request.json();

    if (!reaction_type) {
      return NextResponse.json(
        { error: "Reaction type is required" },
        { status: 400 }
      );
    }

    // Check if clip exists
    const { data: clip } = await supabase
      .from("clips")
      .select("id, like_count")
      .eq("id", clipId)
      .single();

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Check existing reaction
    const { data: existingReaction } = await supabase
      .from("clip_reactions")
      .select("id, reaction_type")
      .eq("clip_id", clipId)
      .eq("user_id", user.id)
      .single();

    if (existingReaction) {
      // Update existing reaction
      if (existingReaction.reaction_type === reaction_type) {
        // Same reaction - remove it
        await supabase
          .from("clip_reactions")
          .delete()
          .eq("id", existingReaction.id);

        // Decrement like count
        await supabase
          .from("clips")
          .update({ like_count: Math.max(0, clip.like_count - 1) })
          .eq("id", clipId);

        return NextResponse.json({
          success: true,
          action: "removed",
          reaction_type: null,
        });
      } else {
        // Different reaction - update it
        await supabase
          .from("clip_reactions")
          .update({ reaction_type })
          .eq("id", existingReaction.id);

        return NextResponse.json({
          success: true,
          action: "updated",
          reaction_type,
        });
      }
    } else {
      // Create new reaction
      await supabase.from("clip_reactions").insert({
        clip_id: clipId,
        user_id: user.id,
        reaction_type,
      });

      // Increment like count
      await supabase
        .from("clips")
        .update({ like_count: clip.like_count + 1 })
        .eq("id", clipId);

      return NextResponse.json({
        success: true,
        action: "added",
        reaction_type,
      });
    }
  } catch (error) {
    console.error("React to clip error:", error);
    return NextResponse.json(
      { error: "Failed to react to clip" },
      { status: 500 }
    );
  }
}

// GET - Get reactions for a clip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clipId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: reactions, error } = await supabase
      .from("clip_reactions")
      .select("reaction_type, user_id")
      .eq("clip_id", clipId);

    if (error) {
      console.error("Fetch reactions error:", error);
      return NextResponse.json(
        { error: "Failed to fetch reactions" },
        { status: 500 }
      );
    }

    // Count reactions by type
    const reactionCounts: Record<string, number> = {};
    let userReaction: string | null = null;

    reactions?.forEach((r) => {
      reactionCounts[r.reaction_type] =
        (reactionCounts[r.reaction_type] || 0) + 1;
      if (user && r.user_id === user.id) {
        userReaction = r.reaction_type;
      }
    });

    return NextResponse.json({
      reactions: reactionCounts,
      total: reactions?.length || 0,
      user_reaction: userReaction,
    });
  } catch (error) {
    console.error("Fetch reactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}
