import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import {
  getUserFriendsList,
} from "@/lib/db/rpc-types";
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
    const db = createClient();
    const user = await getUser();

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

    // Get the appropriate list
    let listData: SocialListResult[] = [];
    let targetUserIds: string[] = [];
    let total = 0;

    if (listType === "friends") {
      // Friends use the RPC function (works with friend_requests table)
      const { data, error } = await getUserFriendsList(
        db,
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

      // Get friend count
      const { count: friendTotal } = await db.rpc("get_friend_count", {
        p_user_id: userId,
      } as never);
      total = (friendTotal as number) || listData.length;

    } else if (listType === "followers") {
      // Query follows table directly: people who follow this user
      let query = db
        .from("follows")
        .select("follower_id, created_at", { count: "exact" })
        .eq("following_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      // If searching, we need to filter by profile name
      const { data: followRows, count, error } = await query;

      if (error) {
        console.error("Error fetching followers list:", error);
        return NextResponse.json({ error: "Failed to fetch followers" }, { status: 500 });
      }

      const rows = followRows || [];
      let filteredIds = rows.map((r: { follower_id: string }) => r.follower_id);

      // If searching, filter by profile username/display_name
      if (search && filteredIds.length > 0) {
        const { data: matchedProfiles } = await db
          .from("profiles")
          .select("id")
          .in("id", filteredIds)
          .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);

        const matchedIds = new Set((matchedProfiles || []).map((p: { id: string }) => p.id));
        filteredIds = filteredIds.filter((id: string) => matchedIds.has(id));
      }

      // Check viewer relationships
      const viewerFollowingIds = new Set<string>();
      const viewerFriendIds = new Set<string>();
      if (user && filteredIds.length > 0) {
        const { data: viewerFollows } = await db
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .in("following_id", filteredIds);
        (viewerFollows || []).forEach((f: { following_id: string }) => viewerFollowingIds.add(f.following_id));

        const { data: viewerFriendRequests } = await db
          .from("friend_requests")
          .select("sender_id, recipient_id")
          .eq("status", "accepted")
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
        (viewerFriendRequests || []).forEach((fr: { sender_id: string; recipient_id: string }) => {
          const friendId = fr.sender_id === user.id ? fr.recipient_id : fr.sender_id;
          if (filteredIds.includes(friendId)) viewerFriendIds.add(friendId);
        });
      }

      listData = rows
        .filter((r: { follower_id: string }) => filteredIds.includes(r.follower_id))
        .map((r: { follower_id: string; created_at: string }) => ({
          follower_id: r.follower_id,
          followed_since: r.created_at,
          is_viewer_friend: viewerFriendIds.has(r.follower_id),
          is_viewer_following: viewerFollowingIds.has(r.follower_id),
        }));

      targetUserIds = listData.map((item) => item.follower_id!).filter(Boolean);

      // Get total count (all followers, not just this page)
      if (search) {
        total = filteredIds.length;
      } else {
        total = count || 0;
      }

    } else if (listType === "following") {
      // Query follows table directly: people this user follows
      let query = db
        .from("follows")
        .select("following_id, created_at", { count: "exact" })
        .eq("follower_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: followRows, count, error } = await query;

      if (error) {
        console.error("Error fetching following list:", error);
        return NextResponse.json({ error: "Failed to fetch following" }, { status: 500 });
      }

      const rows = followRows || [];
      let filteredIds = rows.map((r: { following_id: string }) => r.following_id);

      // If searching, filter by profile username/display_name
      if (search && filteredIds.length > 0) {
        const { data: matchedProfiles } = await db
          .from("profiles")
          .select("id")
          .in("id", filteredIds)
          .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);

        const matchedIds = new Set((matchedProfiles || []).map((p: { id: string }) => p.id));
        filteredIds = filteredIds.filter((id: string) => matchedIds.has(id));
      }

      // Check viewer relationships
      const viewerFollowingIds = new Set<string>();
      const viewerFriendIds = new Set<string>();
      if (user && filteredIds.length > 0) {
        const { data: viewerFollows } = await db
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .in("following_id", filteredIds);
        (viewerFollows || []).forEach((f: { following_id: string }) => viewerFollowingIds.add(f.following_id));

        const { data: viewerFriendRequests } = await db
          .from("friend_requests")
          .select("sender_id, recipient_id")
          .eq("status", "accepted")
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
        (viewerFriendRequests || []).forEach((fr: { sender_id: string; recipient_id: string }) => {
          const friendId = fr.sender_id === user.id ? fr.recipient_id : fr.sender_id;
          if (filteredIds.includes(friendId)) viewerFriendIds.add(friendId);
        });
      }

      listData = rows
        .filter((r: { following_id: string }) => filteredIds.includes(r.following_id))
        .map((r: { following_id: string; created_at: string }) => ({
          following_id: r.following_id,
          following_since: r.created_at,
          is_viewer_friend: viewerFriendIds.has(r.following_id),
          is_viewer_following: viewerFollowingIds.has(r.following_id),
        }));

      targetUserIds = listData.map((item) => item.following_id!).filter(Boolean);

      // Get total count
      if (search) {
        total = filteredIds.length;
      } else {
        total = count || 0;
      }
    }

    // Fetch profiles for all users
    let profiles: Profile[] = [];
    if (targetUserIds.length > 0) {
      const { data: profileDataRaw } = await db
        .from("profiles")
        .select("*")
        .in("id", targetUserIds);

      profiles = (profileDataRaw as Profile[] | null) || [];
    }

    // Check pending friend requests if user is logged in
    let pendingRequestIds = new Set<string>();
    if (user && targetUserIds.length > 0) {
      const { data: pendingDataRaw } = await db
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
