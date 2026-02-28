import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// POST /api/users/[userId]/block - Block a user
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userId === user.id) {
      return NextResponse.json(
        { error: "You cannot block yourself" },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: targetUser } = await db
      .from("profiles")
      .select("id, username")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Check if already blocked
    const { data: existingBlock } = await db
      .from("blocked_users")
      .select("id")
      .eq("blocker_id", user.id)
      .eq("blocked_id", userId)
      .single();

    if (existingBlock) {
      return NextResponse.json(
        { error: "User is already blocked" },
        { status: 400 }
      );
    }

    // Create block
    const { error: blockError } = await db
      .from("blocked_users")
      .insert({
        blocker_id: user.id,
        blocked_id: userId,
        reason,
      });

    if (blockError) {
      console.error("Error blocking user:", blockError);
      return NextResponse.json(
        { error: "Failed to block user" },
        { status: 500 }
      );
    }

    // Remove any follows between the users
    await db
      .from("follows")
      .delete()
      .or(
        `and(follower_id.eq.${user.id},following_id.eq.${userId}),and(follower_id.eq.${userId},following_id.eq.${user.id})`
      );

    // Remove any friend relationships
    await db
      .from("friends")
      .delete()
      .or(
        `and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`
      );

    // Cancel any pending friend requests
    await db
      .from("friend_requests")
      .delete()
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`
      );

    return NextResponse.json({
      success: true,
      message: `Blocked ${targetUser.username}`,
    });
  } catch (error) {
    console.error("Block user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId]/block - Unblock a user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: deleteError } = await db
      .from("blocked_users")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", userId);

    if (deleteError) {
      console.error("Error unblocking user:", deleteError);
      return NextResponse.json(
        { error: "Failed to unblock user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User unblocked",
    });
  } catch (error) {
    console.error("Unblock user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/users/[userId]/block - Check if user is blocked
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if either user has blocked the other
    const { data: block } = await db
      .from("blocked_users")
      .select("id, blocker_id")
      .or(
        `and(blocker_id.eq.${user.id},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${user.id})`
      )
      .single();

    return NextResponse.json({
      is_blocked: !!block,
      blocked_by_me: block?.blocker_id === user.id,
      blocked_by_them: block?.blocker_id === userId,
    });
  } catch (error) {
    console.error("Check block status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
