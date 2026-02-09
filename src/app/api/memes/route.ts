import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CreateMemeRequest } from "@/types/community";

// GET - List memes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("game_id");
    const creatorId = searchParams.get("creator_id");
    const sortBy = searchParams.get("sort") || "recent";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("memes")
      .select(`
        *,
        creator:profiles!memes_creator_id_fkey(id, username, avatar_url),
        game:games(id, slug, name)
      `, { count: "exact" })
      .eq("is_approved", true)
      .eq("is_nsfw", false);

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    if (creatorId) {
      query = query.eq("creator_id", creatorId);
    }

    // Sorting
    if (sortBy === "popular") {
      query = query.order("like_count", { ascending: false });
    } else if (sortBy === "top") {
      // Top of all time
      query = query.order("like_count", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: memes, error, count } = await query;

    if (error) {
      console.error("Fetch memes error:", error);
      return NextResponse.json(
        { error: "Failed to fetch memes" },
        { status: 500 }
      );
    }

    // Get user likes if logged in
    let userLikes = new Set<string>();

    if (user && memes && memes.length > 0) {
      const memeIds = memes.map((m) => m.id);
      const { data: likes } = await supabase
        .from("meme_likes")
        .select("meme_id")
        .eq("user_id", user.id)
        .in("meme_id", memeIds);

      if (likes) {
        userLikes = new Set(likes.map((l) => l.meme_id));
      }
    }

    const processedMemes = memes?.map((meme) => ({
      ...meme,
      user_liked: userLikes.has(meme.id),
    }));

    return NextResponse.json({
      memes: processedMemes,
      total: count,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error("Fetch memes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch memes" },
      { status: 500 }
    );
  }
}

// POST - Create a new meme
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateMemeRequest = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!body.image_url?.trim()) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const { data: meme, error } = await supabase
      .from("memes")
      .insert({
        creator_id: user.id,
        game_id: body.game_id || null,
        title: body.title.trim(),
        image_url: body.image_url,
        caption: body.caption?.trim() || null,
        template_name: body.template_name || null,
        tags: body.tags || [],
        is_nsfw: false,
        is_approved: true, // Auto-approve for now
        like_count: 0,
        comment_count: 0,
        view_count: 0,
      })
      .select(`
        *,
        creator:profiles!memes_creator_id_fkey(id, username, avatar_url),
        game:games(id, slug, name)
      `)
      .single();

    if (error) {
      console.error("Create meme error:", error);
      return NextResponse.json(
        { error: "Failed to create meme" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      meme: {
        ...meme,
        user_liked: false,
      },
    });
  } catch (error) {
    console.error("Create meme error:", error);
    return NextResponse.json(
      { error: "Failed to create meme" },
      { status: 500 }
    );
  }
}
