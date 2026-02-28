import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// GET - Get sync status for a connection
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("connectionId");

    let query = db
      .from("game_sync_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (connectionId) {
      query = query.eq("connection_id", connectionId);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error("Error fetching sync jobs:", error);
      return NextResponse.json(
        { error: "Failed to fetch sync status" },
        { status: 500 }
      );
    }

    // Check if there's an active sync
    const activeSyncJob = jobs?.find(
      (job) => job.status === "pending" || job.status === "syncing"
    );

    return NextResponse.json({
      jobs: jobs || [],
      isSyncing: !!activeSyncJob,
      activeSyncJob,
    });
  } catch (error) {
    console.error("Status fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
