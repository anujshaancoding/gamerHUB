import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// POST - Add a reaction
export async function POST(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const db = createClient();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { emoji } = await request.json();

    if (!emoji) {
      return NextResponse.json(
        { error: "emoji is required" },
        { status: 400 }
      );
    }

    const { data: reaction, error } = await db
      .from("message_reactions")
      .upsert(
        {
          message_id: messageId,
          user_id: user.id,
          emoji,
        },
        { onConflict: "message_id,user_id,emoji" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ reaction });
  } catch (error) {
    console.error("Add reaction error:", error);
    return NextResponse.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a reaction
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const db = createClient();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { emoji } = await request.json();

    const { error } = await db
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .eq("emoji", emoji);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove reaction error:", error);
    return NextResponse.json(
      { error: "Failed to remove reaction" },
      { status: 500 }
    );
  }
}
