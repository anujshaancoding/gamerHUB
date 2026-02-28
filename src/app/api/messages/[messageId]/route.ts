import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// DELETE - Delete own message
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const db = createClient();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify ownership
    const { data: message } = await db
      .from("messages")
      .select("sender_id")
      .eq("id", messageId)
      .single();

    if (!message || message.sender_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this message" },
        { status: 403 }
      );
    }

    const { error } = await db
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
