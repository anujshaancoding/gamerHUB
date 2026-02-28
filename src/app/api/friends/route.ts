import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getFriends, sendFriendRequest } from "@/lib/db/rpc-types";
import type { FriendWithProfile, Profile } from "@/types/database";
import { getUser } from "@/lib/auth/get-user";

// GET - List friends
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

    // Get friends using the database function
    const { data: friendIds, error: friendsError } = await getFriends(
      db,
      userId
    );

    if (friendsError) {
      console.error("Error fetching friends:", friendsError);
      return NextResponse.json(
        { error: "Failed to fetch friends" },
        { status: 500 }
      );
    }

    if (!friendIds || friendIds.length === 0) {
      return NextResponse.json({
        friends: [],
        total: 0,
        limit,
        offset,
      });
    }

    // Get friend profiles
    let query = db
      .from("profiles")
      .select("*", { count: "exact" })
      .in(
        "id",
        friendIds.map((f) => f.friend_id)
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
      console.error("Error fetching friend profiles:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch friend profiles" },
        { status: 500 }
      );
    }

    const profiles = profilesRaw as Profile[] | null;

    // Combine friends data with profiles
    const friends: FriendWithProfile[] = (profiles || []).map((profile) => {
      const friendData = friendIds.find((f) => f.friend_id === profile.id);
      return {
        friend_id: profile.id,
        friends_since: friendData?.friends_since || new Date().toISOString(),
        profile,
      };
    });

    return NextResponse.json({
      friends,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Friends list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Send friend request
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId, message } = body;

    if (!recipientId) {
      return NextResponse.json(
        { error: "Recipient ID is required" },
        { status: 400 }
      );
    }

    if (recipientId === user.id) {
      return NextResponse.json(
        { error: "Cannot send friend request to yourself" },
        { status: 400 }
      );
    }

    // Use the database function to send friend request
    const { data: requestId, error } = await sendFriendRequest(
      db,
      user.id,
      recipientId,
      message
    );

    if (error) {
      console.error("Error sending friend request:", error);
      // Handle specific errors
      if (error.message.includes("blocked")) {
        return NextResponse.json(
          { error: "Cannot send friend request to this user" },
          { status: 403 }
        );
      }
      if (error.message.includes("Already friends")) {
        return NextResponse.json(
          { error: "You are already friends with this user" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Failed to send friend request" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        requestId,
        message: "Friend request sent successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Send friend request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
