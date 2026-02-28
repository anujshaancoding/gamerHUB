import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { Profile } from "@/types/database";
import { getUser } from "@/lib/auth/get-user";

interface FollowData {
  follower_id: string;
  following_id: string;
  created_at: string;
}

// GET - List all users this person follows
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = searchParams.get("userId") || user.id;
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get all users this person follows
    const { data: followingDataRaw, error: followingError } = await db
      .from("follows")
      .select("following_id, created_at")
      .eq("follower_id", userId);

    const followingData = followingDataRaw as Pick<FollowData, "following_id" | "created_at">[] | null;

    if (followingError) {
      console.error("Error fetching following:", followingError);
      return NextResponse.json(
        { error: "Failed to fetch following" },
        { status: 500 }
      );
    }

    if (!followingData || followingData.length === 0) {
      return NextResponse.json({
        following: [],
        total: 0,
        limit,
        offset,
      });
    }

    // Exclude mutual friends: get users who also follow this person back
    const followingIds = followingData.map((f) => f.following_id);
    const { data: mutualRaw } = await db
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId)
      .in("follower_id", followingIds);

    const mutualIds = new Set(
      (mutualRaw as Pick<FollowData, "follower_id">[] | null)?.map(
        (f) => f.follower_id
      ) || []
    );

    // Filter out mutual friends (they belong in the Friends tab)
    const followingOnly = followingData.filter(
      (f) => !mutualIds.has(f.following_id)
    );

    if (followingOnly.length === 0) {
      return NextResponse.json({
        following: [],
        total: 0,
        limit,
        offset,
      });
    }

    // Get profiles for following-only users (excluding mutual friends)
    let query = db
      .from("profiles")
      .select("*", { count: "exact" })
      .in(
        "id",
        followingOnly.map((f) => f.following_id)
      )
      .order("username")
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `username.ilike.%${search}%,display_name.ilike.%${search}%`
      );
    }

    const { data: profilesRaw, error: profilesError, count } = await query;

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch profiles" },
        { status: 500 }
      );
    }

    const profiles = profilesRaw as Profile[] | null;

    // Combine with follow data
    const following = (profiles || []).map((profile) => {
      const followData = followingOnly.find(
        (f) => f.following_id === profile.id
      );
      return {
        ...profile,
        followed_at: followData?.created_at,
      };
    });

    return NextResponse.json({
      following,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Following list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
