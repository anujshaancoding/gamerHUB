import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import {
  getFriendCount,
  getFollowingOnlyCount,
  getFollowersOnlyCount,
} from "@/lib/db/rpc-types";
import type { SocialCounts } from "@/types/database";
import { getUser } from "@/lib/auth/get-user";

// GET - Get all social counts for a user
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = searchParams.get("userId") || user.id;

    // Get all counts in parallel — normalize every result to { data, error }
    // so a single failure doesn't crash the whole response.
    const [friendCount, followingCount, followersCount, pendingResult] =
      await Promise.all([
        getFriendCount(db, userId),
        getFollowingOnlyCount(db, userId),
        getFollowersOnlyCount(db, userId),
        userId === user.id
          ? db
              .from("friend_requests")
              .select("*", { count: "exact", head: true })
              .eq("recipient_id", user.id)
              .eq("status", "pending")
              .then(({ count, error }) => ({
                data: error ? 0 : (count ?? 0),
                error,
              }))
          : Promise.resolve({ data: 0, error: null }),
      ]);

    const counts: SocialCounts = {
      friends: friendCount.data ?? 0,
      following: followingCount.data ?? 0,
      followers: followersCount.data ?? 0,
      pending_requests: pendingResult.data ?? 0,
    };

    return NextResponse.json({ counts });
  } catch (error) {
    console.error("Social counts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
