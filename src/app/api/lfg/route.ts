import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List LFG posts with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const game = searchParams.get("game");
    const gameMode = searchParams.get("gameMode");
    const role = searchParams.get("role");
    const minRating = searchParams.get("minRating");
    const maxRating = searchParams.get("maxRating");
    const includeUnranked = searchParams.get("includeUnranked") !== "false";
    const region = searchParams.get("region");
    const language = searchParams.get("language");
    const hasSlots = searchParams.get("hasSlots") === "true";
    const creatorId = searchParams.get("creatorId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("lfg_posts")
      .select(
        `
        *,
        creator:profiles!lfg_posts_creator_id_fkey(
          id, username, display_name, avatar_url, region
        ),
        game:games!lfg_posts_game_id_fkey(
          id, slug, name, icon_url
        ),
        lfg_applications(count)
      `,
        { count: "exact" }
      )
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by creator (for "my posts")
    if (creatorId) {
      query = supabase
        .from("lfg_posts")
        .select(
          `
          *,
          creator:profiles!lfg_posts_creator_id_fkey(
            id, username, display_name, avatar_url, region
          ),
          game:games!lfg_posts_game_id_fkey(
            id, slug, name, icon_url
          ),
          lfg_applications(count)
        `,
          { count: "exact" }
        )
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
    }

    // Filter by game
    if (game) {
      query = query.eq("game.slug", game);
    }

    // Filter by game mode
    if (gameMode) {
      query = query.eq("game_mode", gameMode);
    }

    // Filter by looking for roles
    if (role) {
      query = query.contains("looking_for_roles", [role]);
    }

    // Filter by region
    if (region) {
      query = query.eq("region", region);
    }

    // Filter by language
    if (language) {
      query = query.eq("language", language);
    }

    // Filter by available slots
    if (hasSlots) {
      query = query.lt("current_players", supabase.rpc("get_max_players"));
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching LFG posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch LFG posts" },
        { status: 500 }
      );
    }

    // Transform data
    const posts = (data || []).map((post: Record<string, unknown>) => ({
      ...post,
      applications_count: Array.isArray(post.lfg_applications)
        ? (post.lfg_applications[0] as { count?: number })?.count || 0
        : 0,
    }));

    // Apply rating filters in-memory (complex SQL avoided)
    let filteredPosts = posts;
    if (minRating || maxRating) {
      filteredPosts = posts.filter((post: Record<string, unknown>) => {
        const postMin = post.min_rating as number | null;
        const postMax = post.max_rating as number | null;
        const acceptUnranked = post.accept_unranked as boolean;

        if (minRating && postMax && parseInt(minRating) > postMax) return false;
        if (maxRating && postMin && parseInt(maxRating) < postMin) return false;
        if (!includeUnranked && !acceptUnranked) return false;

        return true;
      });
    }

    return NextResponse.json({
      posts: filteredPosts,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("LFG list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new LFG post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      game_id,
      title,
      description,
      creator_role,
      creator_rating,
      creator_is_unranked,
      looking_for_roles,
      min_rating,
      max_rating,
      accept_unranked,
      game_mode,
      region,
      language,
      voice_required,
      max_players,
      duration_type,
    } = body;

    // Validation
    if (!game_id || !title) {
      return NextResponse.json(
        { error: "Game and title are required" },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: "Title must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Check for existing active post
    const { data: existingPost } = await supabase
      .from("lfg_posts")
      .select("id")
      .eq("creator_id", user.id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existingPost) {
      return NextResponse.json(
        { error: "You already have an active LFG post. Please close it first." },
        { status: 400 }
      );
    }

    // Calculate expiration
    const durationMap: Record<string, number> = {
      "1hr": 1,
      "2hr": 2,
      "4hr": 4,
      "8hr": 8,
      until_full: 24, // Default 24 hours for "until_full"
    };
    const hours = durationMap[duration_type || "2hr"] || 2;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    // Create post
    const { data: post, error: postError } = await supabase
      .from("lfg_posts")
      .insert({
        creator_id: user.id,
        game_id,
        title: title.trim(),
        description: description?.trim() || null,
        creator_role: creator_role || null,
        creator_rating: creator_rating || null,
        creator_is_unranked: creator_is_unranked || false,
        looking_for_roles: looking_for_roles || [],
        min_rating: min_rating || null,
        max_rating: max_rating || null,
        accept_unranked: accept_unranked !== false,
        game_mode: game_mode || null,
        region: region || null,
        language: language || "en",
        voice_required: voice_required || false,
        max_players: max_players || 5,
        duration_type: duration_type || "2hr",
        expires_at: expiresAt.toISOString(),
      } as never)
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

    if (postError) {
      console.error("Error creating LFG post:", postError);
      return NextResponse.json(
        { error: "Failed to create LFG post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("LFG creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
