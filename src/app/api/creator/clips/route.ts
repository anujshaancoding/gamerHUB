import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { CreateClipRequest } from "@/types/creator";
import { getUser } from "@/lib/auth/get-user";

// GET - Get creator's clips
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get("creatorId");
    const visibility = searchParams.get("visibility");
    const gameId = searchParams.get("gameId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const offset = (page - 1) * limit;

    const user = await getUser();

    // Build query
    let query = db
      .from("creator_clips")
      .select(`
        *,
        creator_profiles!inner(
          user_id,
          display_name,
          users!inner(username, avatar_url)
        ),
        games(name, slug, icon_url)
      `, { count: "exact" });

    // If viewing specific creator's clips
    if (creatorId) {
      query = query.eq("creator_id", creatorId);

      // Non-owners can only see public clips
      const { data: profile } = await db
        .from("creator_profiles")
        .select("user_id")
        .eq("id", creatorId)
        .single();

      if (!profile || profile.user_id !== user?.id) {
        query = query.eq("visibility", "public");
      } else if (visibility) {
        query = query.eq("visibility", visibility);
      }
    } else if (user) {
      // Get current user's own clips
      const { data: profile } = await db
        .from("creator_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        query = query.eq("creator_id", profile.id);
        if (visibility) {
          query = query.eq("visibility", visibility);
        }
      } else {
        return NextResponse.json({ clips: [], total: 0 });
      }
    } else {
      // Public browsing - only public clips
      query = query.eq("visibility", "public");
    }

    // Filter by game
    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    // Execute query with pagination
    const { data: clips, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      clips: clips || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Get creator clips error:", error);
    return NextResponse.json(
      { error: "Failed to get clips" },
      { status: 500 }
    );
  }
}

// POST - Create a new clip
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get creator profile
    const { data: profile, error: profileError } = await db
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Creator profile not found. Please create one first." },
        { status: 404 }
      );
    }

    const body: CreateClipRequest = await request.json();

    // Validate required fields
    if (!body.title || body.title.trim().length < 1) {
      return NextResponse.json(
        { error: "Clip title is required" },
        { status: 400 }
      );
    }

    if (!body.video_url) {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 }
      );
    }

    if (!body.duration || body.duration <= 0) {
      return NextResponse.json(
        { error: "Valid duration is required" },
        { status: 400 }
      );
    }

    // Validate game if provided
    if (body.game_id) {
      const { data: game, error: gameError } = await db
        .from("games")
        .select("id")
        .eq("id", body.game_id)
        .single();

      if (gameError || !game) {
        return NextResponse.json(
          { error: "Invalid game selected" },
          { status: 400 }
        );
      }
    }

    const { data: clip, error } = await db
      .from("creator_clips")
      .insert({
        creator_id: profile.id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        video_url: body.video_url,
        thumbnail_url: body.thumbnail_url || null,
        duration: body.duration,
        game_id: body.game_id || null,
        tags: body.tags || [],
        visibility: body.visibility || "public",
        views_count: 0,
        likes_count: 0,
      })
      .select(`
        *,
        games(name, slug, icon_url)
      `)
      .single();

    if (error) {
      console.error("Create clip error:", error);
      return NextResponse.json(
        { error: "Failed to create clip" },
        { status: 500 }
      );
    }

    return NextResponse.json({ clip }, { status: 201 });
  } catch (error) {
    console.error("Create clip error:", error);
    return NextResponse.json(
      { error: "Failed to create clip" },
      { status: 500 }
    );
  }
}

// PATCH - Update a clip
export async function PATCH(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clipId = searchParams.get("id");

    if (!clipId) {
      return NextResponse.json(
        { error: "Clip ID is required" },
        { status: 400 }
      );
    }

    // Get creator profile
    const { data: profile } = await db
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Verify clip belongs to user
    const { data: existing } = await db
      .from("creator_clips")
      .select("id")
      .eq("id", clipId)
      .eq("creator_id", profile.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Clip not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) {
      if (body.title.trim().length < 1) {
        return NextResponse.json(
          { error: "Clip title is required" },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }

    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url;
    if (body.game_id !== undefined) updates.game_id = body.game_id || null;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.visibility !== undefined) updates.visibility = body.visibility;

    const { data: clip, error } = await db
      .from("creator_clips")
      .update(updates)
      .eq("id", clipId)
      .select(`
        *,
        games(name, slug, icon_url)
      `)
      .single();

    if (error) {
      console.error("Update clip error:", error);
      return NextResponse.json(
        { error: "Failed to update clip" },
        { status: 500 }
      );
    }

    return NextResponse.json({ clip });
  } catch (error) {
    console.error("Update clip error:", error);
    return NextResponse.json(
      { error: "Failed to update clip" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a clip
export async function DELETE(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clipId = searchParams.get("id");

    if (!clipId) {
      return NextResponse.json(
        { error: "Clip ID is required" },
        { status: 400 }
      );
    }

    // Get creator profile
    const { data: profile } = await db
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Delete clip (RLS will verify ownership)
    const { error } = await db
      .from("creator_clips")
      .delete()
      .eq("id", clipId)
      .eq("creator_id", profile.id);

    if (error) {
      console.error("Delete clip error:", error);
      return NextResponse.json(
        { error: "Failed to delete clip" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete clip error:", error);
    return NextResponse.json(
      { error: "Failed to delete clip" },
      { status: 500 }
    );
  }
}
