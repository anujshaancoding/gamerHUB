import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";

// GET - Get combined feed (friends + following activities)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type"); // Filter by activity type

    // Build query - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("activity_feed")
      .select(
        `
        *,
        user:profiles!activity_feed_user_id_fkey(id, username, display_name, avatar_url)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // If logged in, include friend activities
    if (user) {
      // Get list of users the current user follows
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const followingIds = (following as any[])?.map((f) => f.following_id) || [];
      followingIds.push(user.id); // Include own activities

      query = query.or(
        `visibility.eq.public,and(visibility.eq.friends,user_id.in.(${followingIds.join(",")}))`
      );
    } else {
      query = query.eq("visibility", "public");
    }

    if (type) {
      query = query.eq("activity_type", type);
    }

    const { data: activities, error, count } = await query;

    if (error) {
      console.error("Error fetching feed:", error);
      return NextResponse.json(
        { error: "Failed to fetch feed" },
        { status: 500 }
      );
    }

    // Get user's reactions if logged in
    let userReactions: Record<string, string> = {};
    if (user && activities && activities.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activityIds = (activities as any[]).map((a) => a.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: reactions } = await (supabase as any)
        .from("activity_reactions")
        .select("activity_id, reaction_type")
        .eq("user_id", user.id)
        .in("activity_id", activityIds);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userReactions = (reactions || []).reduce(
        (acc: Record<string, string>, r: any) => {
          acc[r.activity_id] = r.reaction_type;
          return acc;
        },
        {}
      );
    }

    // Add user reaction info to activities
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activitiesWithReactions = ((activities || []) as any[]).map((activity: any) => ({
      ...activity,
      user_reaction: userReactions[activity.id] || null,
    }));

    return cachedResponse(
      {
        activities: activitiesWithReactions,
        total: count || 0,
        limit,
        offset,
      },
      CACHE_DURATIONS.USER_DATA
    );
  } catch (error) {
    console.error("Feed fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
