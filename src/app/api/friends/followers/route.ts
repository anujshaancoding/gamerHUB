import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

interface FollowData {
  follower_id: string;
  following_id: string;
  created_at: string;
}

// GET - List all users who follow this person
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = searchParams.get("userId") || user.id;
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get all users who follow this person
    const { data: followersDataRaw, error: followersError } = await supabase
      .from("follows")
      .select("follower_id, created_at")
      .eq("following_id", userId);

    const followersData = followersDataRaw as Pick<FollowData, "follower_id" | "created_at">[] | null;

    if (followersError) {
      console.error("Error fetching followers:", followersError);
      return NextResponse.json(
        { error: "Failed to fetch followers" },
        { status: 500 }
      );
    }

    if (!followersData || followersData.length === 0) {
      return NextResponse.json({
        followers: [],
        total: 0,
        limit,
        offset,
      });
    }

    // Exclude mutual friends: get users this person also follows back
    const followerIds = followersData.map((f) => f.follower_id);
    const { data: mutualRaw } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId)
      .in("following_id", followerIds);

    const mutualIds = new Set(
      (mutualRaw as Pick<FollowData, "following_id">[] | null)?.map(
        (f) => f.following_id
      ) || []
    );

    // Filter out mutual friends (they belong in the Friends tab)
    const followersOnly = followersData.filter(
      (f) => !mutualIds.has(f.follower_id)
    );

    if (followersOnly.length === 0) {
      return NextResponse.json({
        followers: [],
        total: 0,
        limit,
        offset,
      });
    }

    // Get profiles for followers-only users (excluding mutual friends)
    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .in(
        "id",
        followersOnly.map((f) => f.follower_id)
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
    const followers = (profiles || []).map((profile) => {
      const followData = followersOnly.find(
        (f) => f.follower_id === profile.id
      );
      return {
        ...profile,
        followed_at: followData?.created_at,
      };
    });

    return NextResponse.json({
      followers,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Followers list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
