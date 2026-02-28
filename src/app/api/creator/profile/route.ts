import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type {
  CreateCreatorProfileRequest,
  UpdateCreatorProfileRequest,
} from "@/types/creator";
import { getCreatorTier } from "@/types/creator";
import { getUser } from "@/lib/auth/get-user";

// GET - Get current user's creator profile or by custom URL
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);
    const customUrl = searchParams.get("url");
    const userId = searchParams.get("userId");

    // If custom URL provided, fetch by that
    if (customUrl) {
      const { data: profile, error } = await db
        .from("creator_profiles")
        .select(`
          *,
          users!inner(username, avatar_url)
        `)
        .eq("custom_url", customUrl)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Creator not found" },
            { status: 404 }
          );
        }
        throw error;
      }

      // Get follower count
      const { count: followerCount } = await db
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.user_id);

      // Get clip count
      const { count: clipCount } = await db
        .from("creator_clips")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", profile.id)
        .eq("visibility", "public");

      // Get recent clips
      const { data: recentClips } = await db
        .from("creator_clips")
        .select("*")
        .eq("creator_id", profile.id)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(6);

      return NextResponse.json({
        profile: {
          ...profile,
          follower_count: followerCount || 0,
          total_clips: clipCount || 0,
          tier: getCreatorTier(followerCount || 0),
          recent_clips: recentClips || [],
        },
      });
    }

    // If userId provided, fetch by that
    if (userId) {
      const { data: profile, error } = await db
        .from("creator_profiles")
        .select(`
          *,
          users!inner(username, avatar_url)
        `)
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Creator not found" },
            { status: 404 }
          );
        }
        throw error;
      }

      const { count: followerCount } = await db
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.user_id);

      return NextResponse.json({
        profile: {
          ...profile,
          follower_count: followerCount || 0,
          tier: getCreatorTier(followerCount || 0),
        },
      });
    }

    // Get current user's profile
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await db
      .from("creator_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ profile: null });
      }
      throw error;
    }

    // Get stats
    const { count: followerCount } = await db
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id);

    const { count: clipCount } = await db
      .from("creator_clips")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", profile.id);

    const { data: totalViews } = await db
      .from("creator_analytics")
      .select("profile_views, clip_views")
      .eq("creator_id", profile.id);

    const views = totalViews?.reduce(
      (sum, row) => sum + (row.profile_views || 0) + (row.clip_views || 0),
      0
    ) || 0;

    return NextResponse.json({
      profile: {
        ...profile,
        follower_count: followerCount || 0,
        total_clips: clipCount || 0,
        total_views: views,
        tier: getCreatorTier(followerCount || 0),
      },
    });
  } catch (error) {
    console.error("Get creator profile error:", error);
    return NextResponse.json(
      { error: "Failed to get creator profile" },
      { status: 500 }
    );
  }
}

// POST - Create creator profile
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if profile already exists
    const { data: existing } = await db
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Creator profile already exists" },
        { status: 400 }
      );
    }

    const body: CreateCreatorProfileRequest = await request.json();

    // Validate required fields
    if (!body.display_name || body.display_name.trim().length < 2) {
      return NextResponse.json(
        { error: "Display name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const { data: profile, error } = await db
      .from("creator_profiles")
      .insert({
        user_id: user.id,
        display_name: body.display_name.trim(),
        bio: body.bio?.trim() || null,
        streaming_platforms: body.streaming_platforms || [],
        social_links: body.social_links || {},
        games: body.games || [],
        is_verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Create creator profile error:", error);
      return NextResponse.json(
        { error: "Failed to create creator profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("Create creator profile error:", error);
    return NextResponse.json(
      { error: "Failed to create creator profile" },
      { status: 500 }
    );
  }
}

// PATCH - Update creator profile
export async function PATCH(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateCreatorProfileRequest = await request.json();

    // Get current profile
    const { data: currentProfile, error: fetchError } = await db
      .from("creator_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !currentProfile) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Validate custom URL if provided
    if (body.custom_url) {
      // Check tier eligibility
      const { count: followerCount } = await db
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);

      const tier = getCreatorTier(followerCount || 0);
      if (tier !== "platinum" && tier !== "diamond") {
        return NextResponse.json(
          { error: "Custom URL requires Platinum tier or higher" },
          { status: 403 }
        );
      }

      // Validate format
      const urlRegex = /^[a-z0-9_-]{3,30}$/;
      if (!urlRegex.test(body.custom_url)) {
        return NextResponse.json(
          { error: "Custom URL must be 3-30 characters, lowercase alphanumeric, underscores, or hyphens" },
          { status: 400 }
        );
      }

      // Check if URL is taken
      const { data: existing } = await db
        .from("creator_profiles")
        .select("id")
        .eq("custom_url", body.custom_url)
        .neq("id", currentProfile.id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Custom URL is already taken" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.display_name !== undefined) {
      if (body.display_name.trim().length < 2) {
        return NextResponse.json(
          { error: "Display name must be at least 2 characters" },
          { status: 400 }
        );
      }
      updates.display_name = body.display_name.trim();
    }

    if (body.bio !== undefined) updates.bio = body.bio?.trim() || null;
    if (body.banner_url !== undefined) updates.banner_url = body.banner_url;
    if (body.streaming_platforms !== undefined) updates.streaming_platforms = body.streaming_platforms;
    if (body.social_links !== undefined) updates.social_links = body.social_links;
    if (body.games !== undefined) updates.games = body.games;
    if (body.custom_url !== undefined) updates.custom_url = body.custom_url;

    const { data: profile, error } = await db
      .from("creator_profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Update creator profile error:", error);
      return NextResponse.json(
        { error: "Failed to update creator profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Update creator profile error:", error);
    return NextResponse.json(
      { error: "Failed to update creator profile" },
      { status: 500 }
    );
  }
}
