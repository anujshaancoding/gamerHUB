import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUserSocialCounts,
  getUserFriendsList,
  getUserFollowersList,
  getUserFollowingList,
} from "@/lib/supabase/rpc-types";
import type { Profile } from "@/types/database";

export interface ProfileWithRelationship extends Profile {
  relationship_to_viewer: {
    is_friend: boolean;
    is_following: boolean;
    has_pending_request: boolean;
  } | null;
  followed_since?: string;
  friends_since?: string;
}

interface SocialListResult {
  friend_id?: string;
  follower_id?: string;
  following_id?: string;
  friends_since?: string;
  followed_since?: string;
  following_since?: string;
  is_viewer_friend: boolean;
  is_viewer_following: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const listType = searchParams.get("type") as "friends" | "followers" | "following";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search") || null;

    if (!listType || !["friends", "followers", "following"].includes(listType)) {
      return NextResponse.json(
        { error: "Invalid list type. Must be 'friends', 'followers', or 'following'" },
        { status: 400 }
      );
    }

    // Get the counts
    const { data: counts } = await getUserSocialCounts(supabase, userId);

    let total = 0;
    if (counts && counts.length > 0) {
      const countData = counts[0];
      if (listType === "friends") total = countData.friends_count;
      else if (listType === "followers") total = countData.followers_count;
      else if (listType === "following") total = countData.following_count;
    }

    // Get the appropriate list
    let listData: SocialListResult[] = [];
    let targetUserIds: string[] = [];

    if (listType === "friends") {
      const { data, error } = await getUserFriendsList(
        supabase,
        userId,
        user?.id || null,
        limit,
        offset,
        search
      );

      if (error) {
        console.error("Error fetching friends list:", error);
        return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
      }

      listData = (data || []).map((d) => ({
        friend_id: d.friend_id,
        friends_since: d.friends_since,
        is_viewer_friend: d.is_viewer_friend,
        is_viewer_following: d.is_viewer_following,
      }));
      targetUserIds = listData.map((item) => item.friend_id!).filter(Boolean);
    } else if (listType === "followers") {
      const { data, error } = await getUserFollowersList(
        supabase,
        userId,
        user?.id || null,
        limit,
        offset,
        search
      );

      if (error) {
        console.error("Error fetching followers list:", error);
        return NextResponse.json({ error: "Failed to fetch followers" }, { status: 500 });
      }

      listData = (data || []).map((d) => ({
        follower_id: d.follower_id,
        followed_since: d.followed_since,
        is_viewer_friend: d.is_viewer_friend,
        is_viewer_following: d.is_viewer_following,
      }));
      targetUserIds = listData.map((item) => item.follower_id!).filter(Boolean);
    } else if (listType === "following") {
      const { data, error } = await getUserFollowingList(
        supabase,
        userId,
        user?.id || null,
        limit,
        offset,
        search
      );

      if (error) {
        console.error("Error fetching following list:", error);
        return NextResponse.json({ error: "Failed to fetch following" }, { status: 500 });
      }

      listData = (data || []).map((d) => ({
        following_id: d.following_id,
        following_since: d.following_since,
        is_viewer_friend: d.is_viewer_friend,
        is_viewer_following: d.is_viewer_following,
      }));
      targetUserIds = listData.map((item) => item.following_id!).filter(Boolean);
    }

    // Fetch profiles for all users
    let profiles: Profile[] = [];
    if (targetUserIds.length > 0) {
      const { data: profileDataRaw } = await supabase
        .from("profiles")
        .select("*")
        .in("id", targetUserIds);

      profiles = (profileDataRaw as Profile[] | null) || [];
    }

    // Check pending friend requests if user is logged in
    let pendingRequestIds = new Set<string>();
    if (user && targetUserIds.length > 0) {
      const { data: pendingDataRaw } = await supabase
        .from("friend_requests")
        .select("recipient_id")
        .eq("sender_id", user.id)
        .eq("status", "pending")
        .in("recipient_id", targetUserIds);

      const pendingData = pendingDataRaw as { recipient_id: string }[] | null;
      pendingRequestIds = new Set((pendingData || []).map((p) => p.recipient_id));
    }

    // Build response
    const users: ProfileWithRelationship[] = listData
      .map((item) => {
        const targetId = item.friend_id || item.follower_id || item.following_id;
        const profile = profiles.find((p) => p.id === targetId);

        if (!profile) return null;

        const result: ProfileWithRelationship = {
          ...profile,
          relationship_to_viewer: user ? {
            is_friend: item.is_viewer_friend,
            is_following: item.is_viewer_following,
            has_pending_request: pendingRequestIds.has(targetId!),
          } : null,
        };

        if (item.friends_since) result.friends_since = item.friends_since;
        if (item.followed_since || item.following_since) {
          result.followed_since = item.followed_since || item.following_since;
        }

        return result;
      })
      .filter((u): u is ProfileWithRelationship => u !== null);

    return NextResponse.json({
      users,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Social list API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
