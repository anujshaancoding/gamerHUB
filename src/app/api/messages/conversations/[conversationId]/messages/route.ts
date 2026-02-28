import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// GET - Paginated messages for a conversation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const db = createClient();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const before = searchParams.get("before");
  const after = searchParams.get("after");

  try {
    let query = db
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    if (after) {
      query = query.gt("created_at", after);
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    // Get sender profiles
    const senderIds = [
      ...new Set((messages || []).map((m) => m.sender_id).filter(Boolean)),
    ];

    const { data: profiles } = await db
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_online")
      .in("id", senderIds as string[]);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // Get reactions for all messages
    const messageIds = (messages || []).map((m) => m.id);
    const { data: reactions } = await db
      .from("message_reactions")
      .select("*")
      .in("message_id", messageIds);

    const reactionMap = new Map<string, typeof reactions>();
    (reactions || []).forEach((r) => {
      const existing = reactionMap.get(r.message_id) || [];
      existing.push(r);
      reactionMap.set(r.message_id, existing);
    });

    // Combine
    const result = (messages || []).map((m) => ({
      ...m,
      sender: m.sender_id ? profileMap.get(m.sender_id) || null : null,
      reactions: reactionMap.get(m.id) || [],
    }));

    return NextResponse.json({ messages: result });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
