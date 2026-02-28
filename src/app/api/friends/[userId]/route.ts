import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import {
import { getUser } from "@/lib/auth/get-user";
  getRelationshipStatus,
  areFriends as checkAreFriends,
  removeFriend,
} from "@/lib/db/rpc-types";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// GET - Get relationship status with a user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const db = createClient();
    const { userId: targetUserId } = await params;

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get relationship status
    const { data, error } = await getRelationshipStatus(
      db,
      user.id,
      targetUserId
    );

    if (error) {
      console.error("Error getting relationship status:", error);
      return NextResponse.json(
        { error: "Failed to get relationship status" },
        { status: 500 }
      );
    }

    // The function returns an array, get the first row
    const status = data?.[0] || {
      is_friend: false,
      is_following: false,
      is_follower: false,
      has_pending_request_sent: false,
      has_pending_request_received: false,
      is_blocked: false,
      is_blocked_by: false,
    };

    return NextResponse.json({ relationship: status });
  } catch (error) {
    console.error("Get relationship error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove friend
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const db = createClient();
    const { userId: friendId } = await params;

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (friendId === user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself as a friend" },
        { status: 400 }
      );
    }

    // Check if they are actually friends
    const { data: areFriendsResult } = await checkAreFriends(
      db,
      user.id,
      friendId
    );

    if (!areFriendsResult) {
      return NextResponse.json(
        { error: "User is not in your friends list" },
        { status: 400 }
      );
    }

    // Remove friend
    const { error } = await removeFriend(db, user.id, friendId);

    if (error) {
      console.error("Error removing friend:", error);
      return NextResponse.json(
        { error: "Failed to remove friend" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Friend removed successfully",
    });
  } catch (error) {
    console.error("Remove friend error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
