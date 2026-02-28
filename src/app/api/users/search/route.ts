import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { cachedResponse } from "@/lib/api/cache-headers";

// GET - Search user profiles by username or display name
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "3");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!q || q.length < 3) {
      return NextResponse.json(
        { error: "Query must be at least 3 characters" },
        { status: 400 }
      );
    }

    const { data, error, count } = await db
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url, level, is_online, is_premium, region",
        { count: "exact" }
      )
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .order("last_seen", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error searching users:", error);
      return NextResponse.json(
        { error: "Failed to search users" },
        { status: 500 }
      );
    }

    return cachedResponse({
      users: data || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
