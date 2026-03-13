import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";
import { getUser } from "@/lib/auth/get-user";

// GET - Get combined feed (friends + following activities)
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type"); // Filter by activity type

    // Build query — activity_feed table is not in the typed schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped table
    let query = (db as any)
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
      const { data: following } = await db
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = ((following || []) as Array<Record<string, unknown>>).map((f) => f.following_id as string);
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
    const activityRows = (activities || []) as Array<Record<string, unknown>>;
    if (user && activityRows.length > 0) {
      const activityIds = activityRows.map((a) => a.id as string);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped table
      const { data: reactions } = await (db as any)
        .from("activity_reactions")
        .select("activity_id, reaction_type")
        .eq("user_id", user.id)
        .in("activity_id", activityIds);

      userReactions = ((reactions || []) as Array<Record<string, unknown>>).reduce(
        (acc: Record<string, string>, r) => {
          acc[r.activity_id as string] = r.reaction_type as string;
          return acc;
        },
        {}
      );
    }

    // Add user reaction info to activities
    const activitiesWithReactions = activityRows.map((activity) => ({
      ...activity,
      user_reaction: userReactions[activity.id as string] || null,
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
