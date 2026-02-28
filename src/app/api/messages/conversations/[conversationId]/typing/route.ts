import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";

// POST - Broadcast typing indicator via Socket.io
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
    const { isTyping } = await request.json();

    // Emit typing event via Socket.io if available
    const io = (globalThis as Record<string, unknown>).__socket_io__ as any;
    if (io) {
      const event = isTyping ? "typing:started" : "typing:stopped";
      io.to(`conversation:${conversationId}`).emit(event, {
        userId: user.id,
        conversationId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Typing indicator error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
