import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CreateClipRequest } from "@/types/community";

// GET - List clips
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("game_id");
    const creatorId = searchParams.get("creator_id");
    const clipType = searchParams.get("type");
    const featured = searchParams.get("featured") === "true";
    const sortBy = searchParams.get("sort") || "recent";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("clips")
      .select(`
        *,
        creator:profiles!clips_creator_id_fkey(id, username, avatar_url),
        game:games(id, slug, name),
        reactions:clip_reactions(id, reaction_type, user_id)
      `, { count: "exact" });

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    if (creatorId) {
      query = query.eq("creator_id", creatorId);
    }

    if (clipType) {
      query = query.eq("clip_type", clipType);
    }

    if (featured) {
      query = query.eq("is_featured", true);
    }

    // Sorting
    if (sortBy === "popular") {
      query = query.order("like_count", { ascending: false });
    } else if (sortBy === "views") {
      query = query.order("view_count", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: clips, error, count } = await query;

    if (error) {
      console.error("Fetch clips error:", error);
      return NextResponse.json(
        { error: "Failed to fetch clips" },
        { status: 500 }
      );
    }

    // Process clips to add user's reaction
    const processedClips = clips?.map((clip) => {
      const userReaction = user
        ? clip.reactions?.find((r: { user_id: string }) => r.user_id === user.id)?.reaction_type
        : null;

      return {
        ...clip,
        user_reaction: userReaction || null,
      };
    });

    return NextResponse.json({
      clips: processedClips,
      total: count,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error("Fetch clips error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clips" },
      { status: 500 }
    );
  }
}

// POST - Create a new clip
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateClipRequest = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!body.video_url?.trim()) {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 }
      );
    }

    const { data: clip, error } = await supabase
      .from("clips")
      .insert({
        creator_id: user.id,
        game_id: body.game_id || null,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        video_url: body.video_url,
        thumbnail_url: body.thumbnail_url || null,
        duration_seconds: body.duration_seconds || null,
        clip_type: body.clip_type || "highlight",
        tags: body.tags || [],
      })
      .select(`
        *,
        creator:profiles!clips_creator_id_fkey(id, username, avatar_url),
        game:games(id, slug, name)
      `)
      .single();

    if (error) {
      console.error("Create clip error:", error);
      return NextResponse.json(
        { error: "Failed to create clip" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clip,
    });
  } catch (error) {
    console.error("Create clip error:", error);
    return NextResponse.json(
      { error: "Failed to create clip" },
      { status: 500 }
    );
  }
}
