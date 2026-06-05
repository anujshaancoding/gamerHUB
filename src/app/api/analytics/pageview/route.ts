import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";

export async function POST(request: NextRequest) {
  try {
    const { path, referrer, sessionId, ref } = await request.json();

    if (!path || typeof path !== "string") {
      return new NextResponse(null, { status: 400 });
    }

    // Skip tracking for API routes and static assets
    if (path.startsWith("/api/") || path.startsWith("/_next/")) {
      return new NextResponse(null, { status: 204 });
    }

    // Try to get the authenticated user (optional)
    let userId: string | null = null;
    try {
      const db = createClient();
      const user = await getUser();
      userId = user?.id || null;
    } catch {
      // Not authenticated — that's fine
    }

    // First-touch ?ref= referral attribution (bounded length, string only).
    const refValue =
      typeof ref === "string" && ref.length > 0 ? ref.slice(0, 128) : null;

    const admin = createAdminClient();
    await admin.from("page_views").insert({
      path,
      user_id: userId,
      session_id: sessionId || null,
      referrer: referrer || null,
      ref: refValue,
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
