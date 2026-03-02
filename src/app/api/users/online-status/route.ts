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

    const statuses: Record<string, { is_online: boolean; status: string; last_seen: string | null }> = {};
    for (const p of (profiles || []) as unknown as ProfileStatus[]) {
      statuses[p.id] = {
        is_online: p.is_online ?? false,
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
