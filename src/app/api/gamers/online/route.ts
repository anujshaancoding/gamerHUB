import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";

// GET - List online gamers who are not friends and have public profiles
export async function GET(request: NextRequest) {
  try {
    const db = createAdminClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "3");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get current user (optional - used to exclude self and friends)
    let currentUserId: string | null = null;
    let friendIds: string[] = [];

    try {
      const user = await getUser();
      currentUserId = user?.id || null;

      if (currentUserId) {
        // Get friend IDs to exclude
        const { data: friendRequests } = await db
          .from("friend_requests")
          .select("sender_id, recipient_id")
          .eq("status", "accepted")
          .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`);

        if (friendRequests) {
          friendIds = friendRequests.map((fr: any) =>
            fr.sender_id === currentUserId ? fr.recipient_id : fr.sender_id
          );
        }
      }
    } catch {
      // Not logged in - that's fine, just show online gamers
    }

    // Build exclude list (current user + friends)
    const excludeIds = currentUserId ? [currentUserId, ...friendIds] : [];

    // Query online profiles with public visibility
    let query = db
      .from("profiles")
      .select("*")
      .eq("is_online", true)
      .order("last_seen", { ascending: false })
      .range(offset, offset + limit - 1);

    // Exclude current user and friends
    if (excludeIds.length > 0) {
      // Use not.in to exclude IDs
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error("Error fetching online gamers:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch online gamers", details: profilesError.message },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ gamers: [], hasMore: false });
    }

    // Filter out profiles that have profile_visible set to false
    const visibleProfiles = (profiles as any[]).filter((p: any) => {
      const privacy = p.privacy_settings;
      if (!privacy) return true; // Default: visible
      if (typeof privacy === "object" && privacy.profile_visible === false) return false;
      return true;
    });

    const profileIds = visibleProfiles.map((p: any) => p.id);

    // Get user_games for these profiles
    const { data: userGamesRows } = await db
      .from("user_games")
      .select("*, game:games!user_games_game_id_fkey(id, slug, name, icon_url)")
      .in("user_id", profileIds);

    const userGamesMap: Record<string, any[]> = {};
    for (const row of (userGamesRows || []) as any[]) {
      if (!userGamesMap[row.user_id]) userGamesMap[row.user_id] = [];
      userGamesMap[row.user_id].push(row);
    }

    const gamers = visibleProfiles.map((profile: any) => ({
      ...profile,
      user_games: userGamesMap[profile.id] || [],
    }));

    // Check if there are more results
    const { count } = await db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_online", true)
      .not("id", "in", `(${excludeIds.length > 0 ? excludeIds.join(",") : "00000000-0000-0000-0000-000000000000"})`);

    const hasMore = (count || 0) > offset + limit;

    return NextResponse.json({ gamers, hasMore });
  } catch (error) {
    console.error("Online gamers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
