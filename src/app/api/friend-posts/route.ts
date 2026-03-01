import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";

// GET - List friend posts with user profiles joined manually
export async function GET(request: NextRequest) {
  try {
    const db = createAdminClient();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // 1. Fetch friend posts
    const { data: posts, error: postsError } = await db
      .from("friend_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.error("Error fetching friend posts:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts", details: postsError.message },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ posts: [] });
    }

    // 2. Get unique user IDs and fetch their profiles
    const userIds = [...new Set((posts as any[]).map((p: any) => p.user_id).filter(Boolean))];

    const { data: profiles } = await db
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_verified")
      .in("id", userIds);

    // Build a map of user_id -> profile
    const profileMap: Record<string, any> = {};
    for (const profile of (profiles || []) as any[]) {
      profileMap[profile.id] = profile;
    }

    // 3. Combine posts with user profiles
    const postsWithUsers = (posts as any[]).map((post: any) => ({
      ...post,
      user: profileMap[post.user_id] || null,
    }));

    return NextResponse.json({ posts: postsWithUsers });
  } catch (error) {
    console.error("Friend posts list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
