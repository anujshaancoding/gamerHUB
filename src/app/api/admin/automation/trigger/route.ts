import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";

async function requireAdmin() {
  const user = await getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return profile?.is_admin ? user : null;
}

// POST - Manual trigger from admin panel
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Call the cron automation endpoint internally with manual trigger
    const baseUrl = request.nextUrl.origin;
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured. Add it to your environment variables." },
        { status: 500 },
      );
    }

    const res = await fetch(`${baseUrl}/api/cron/automation`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
    });

    const result = await res.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Manual trigger error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
