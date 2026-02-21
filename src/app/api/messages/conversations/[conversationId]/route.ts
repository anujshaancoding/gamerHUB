import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get single conversation details with participants
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get conversation
    const { data: conversation, error: cError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (cError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get participants with profiles
    const { data: participants, error: pError } = await supabase
      .from("conversation_participants")
      .select("user_id, last_read_at")
      .eq("conversation_id", conversationId);

    if (pError) throw pError;

    // Check if current user is a member
    const isMember = (participants || []).some((p) => p.user_id === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Get profiles
    const userIds = (participants || []).map((p) => p.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_online, last_seen, bio, gaming_style, region")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // Check if this is a void conversation (direct chat with non-friend)
    let isVoid = false;
    if (conversation.type === "direct") {
      const otherUserId = (participants || []).find(
        (p) => p.user_id !== user.id
      )?.user_id;
      if (otherUserId) {
        const { data: areFriendsResult } = await supabase.rpc("are_friends", {
          user1_id: user.id,
          user2_id: otherUserId,
        } as unknown as undefined);
        isVoid = !areFriendsResult;
      }
    }

    return NextResponse.json({
      conversation: {
        ...conversation,
        is_void: isVoid,
        participants: (participants || []).map((p) => ({
          user_id: p.user_id,
          last_read_at: p.last_read_at,
          user: profileMap.get(p.user_id) || null,
        })),
      },
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
