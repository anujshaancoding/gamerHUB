import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";
import { emitToUser } from "@/lib/realtime/socket-server";
import { logger } from "@/lib/logger";

// POST - Send a message
export async function POST(request: Request) {
  const db = createClient();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { conversationId, content, type = "text" } = await request.json();

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "conversationId and content are required" },
        { status: 400 }
      );
    }

    // Insert message
    const { data: message, error: mError } = await db
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        type,
      } as never)
      .select()
      .single();

    if (mError) throw mError;

    // Update conversation timestamp
    await db
      .from("conversations")
      .update({ updated_at: new Date().toISOString() } as never)
      .eq("id", conversationId);

    // Notify other participants via Socket.io for instant delivery
    try {
      const { data: participants } = await db
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .neq("user_id", user.id);

      const { data: senderProfile } = await db
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (participants) {
        for (const p of participants) {
          emitToUser(p.user_id, "message:new", {
            message,
            conversationId,
            sender: senderProfile,
          });
        }
      }
    } catch {
      // Non-critical — Socket.io notification is best-effort
    }

    return NextResponse.json({ message });
  } catch (error) {
    logger.error("Send message error", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
