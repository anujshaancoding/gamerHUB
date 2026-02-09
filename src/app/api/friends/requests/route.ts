import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List pending friend requests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = searchParams.get("type") || "received"; // 'received' or 'sent'
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("friend_requests")
      .select(
        `
        *,
        sender:profiles!friend_requests_sender_id_fkey(*),
        recipient:profiles!friend_requests_recipient_id_fkey(*)
      `,
        { count: "exact" }
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type === "received") {
      query = query.eq("recipient_id", user.id);
    } else {
      query = query.eq("sender_id", user.id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching friend requests:", error);
      return NextResponse.json(
        { error: "Failed to fetch friend requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      requests: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Friend requests list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
