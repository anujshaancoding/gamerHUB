import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// POST - Mark conversation as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const db = createClient();
    const now = new Date().toISOString();

    await db
      .from("conversation_participants")
      .update({ last_read_at: now } as never)
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, readAt: now });
  } catch (error) {
    console.error("Mark as read error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
