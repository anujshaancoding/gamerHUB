import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

/**
 * GET /api/users/online-status?ids=id1,id2,id3
 *
 * Returns online/offline status for the given user IDs based on
 * the database is_online flag and last_seen timestamp.
 * Used as a fallback when Socket.io is not connected.
 */
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ids = request.nextUrl.searchParams.get("ids");
  if (!ids) {
    return NextResponse.json({ statuses: {} });
  }

  const userIds = ids.split(",").filter(Boolean).slice(0, 100);
  if (userIds.length === 0) {
    return NextResponse.json({ statuses: {} });
  }

  try {
    const db = createClient();
    const { data: profiles, error } = await db
      .from("profiles")
      .select("id, is_online, last_seen, status")
      .in("id", userIds);

    if (error) throw error;

    interface ProfileStatus {
      id: string;
      is_online: boolean | null;
      last_seen: string | null;
      status: string;
    }

    // Consider a user stale (offline) if last_seen is older than 2 minutes
    const STALE_THRESHOLD_MS = 2 * 60 * 1000;
    const now = Date.now();

    const statuses: Record<string, { is_online: boolean; status: string; last_seen: string | null }> = {};
    for (const p of (profiles || []) as unknown as ProfileStatus[]) {
      let isOnline = p.is_online ?? false;

      // Guard against stale is_online flags: if last_seen is too old, treat as offline
      if (isOnline && p.last_seen) {
        const lastSeenAge = now - new Date(p.last_seen).getTime();
        if (lastSeenAge > STALE_THRESHOLD_MS) {
          isOnline = false;
        }
      } else if (isOnline && !p.last_seen) {
        // No last_seen at all — can't trust is_online
        isOnline = false;
      }

      statuses[p.id] = {
        is_online: isOnline,
        status: p.status || "auto",
        last_seen: p.last_seen,
      };
    }

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Online status fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch online statuses" },
      { status: 500 }
    );
  }
}
