import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// GET - List all conversations for the current user
export async function GET() {
  const db = createClient();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all conversation IDs the user participates in
    const { data: participations, error: pError } = await db
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);

    if (pError) throw pError;
    if (!participations || participations.length === 0) {
      return NextResponse.json({ conversations: [], voidConversations: [] });
    }

    const conversationIds = participations.map((p) => p.conversation_id);
    const lastReadMap = new Map(
      participations.map((p) => [p.conversation_id, p.last_read_at])
    );

    // Get conversation details
    const { data: conversations, error: cError } = await db
      .from("conversations")
      .select("*")
      .in("id", conversationIds)
      .order("updated_at", { ascending: false });

    if (cError) throw cError;

    // Get participants for all conversations
    const { data: allParticipants, error: apError } = await db
      .from("conversation_participants")
      .select("conversation_id, user_id, last_read_at")
      .in("conversation_id", conversationIds);

    if (apError) throw apError;

    // Get unique user IDs for profiles
    const userIds = [
      ...new Set((allParticipants || []).map((p) => p.user_id)),
    ];
    const { data: profiles } = await db
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_online, last_seen")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // Batch-check friend status for direct conversations
    // Collect "other user IDs" from direct conversations
    const directConvs = (conversations || []).filter((c) => c.type === "direct");
    const otherUserIds = directConvs.map((conv) => {
      const otherParticipant = (allParticipants || []).find(
        (p) => p.conversation_id === conv.id && p.user_id !== user.id
      );
      return otherParticipant?.user_id;
    }).filter(Boolean) as string[];

    const uniqueOtherUserIds = [...new Set(otherUserIds)];

    // Check mutual follows (friends = mutual follows) with just 2 queries
    let friendSet = new Set<string>();
    if (uniqueOtherUserIds.length > 0) {
      const [{ data: iFollow }, { data: followMe }] = await Promise.all([
        db
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .in("following_id", uniqueOtherUserIds),
        db
          .from("follows")
          .select("follower_id")
          .eq("following_id", user.id)
          .in("follower_id", uniqueOtherUserIds),
      ]);

      const iFollowSet = new Set((iFollow || []).map((f) => f.following_id));
      const followMeSet = new Set((followMe || []).map((f) => f.follower_id));
      friendSet = new Set([...iFollowSet].filter((id) => followMeSet.has(id)));
    }

    // Get last message for each conversation
    const lastMessages = await Promise.all(
      conversationIds.map(async (cid) => {
        const { data } = await db
          .from("messages")
          .select("*")
          .eq("conversation_id", cid)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        return { conversationId: cid, message: data };
      })
    );

    const lastMessageMap = new Map(
      lastMessages.map((lm) => [lm.conversationId, lm.message])
    );

    // Build response
    const result = (conversations || []).map((conv) => {
      const participants = (allParticipants || [])
        .filter((p) => p.conversation_id === conv.id)
        .map((p) => ({
          user_id: p.user_id,
          last_read_at: p.last_read_at,
          user: profileMap.get(p.user_id) || null,
        }));

      const lastMessage = lastMessageMap.get(conv.id) || null;
      const myLastRead = lastReadMap.get(conv.id);
      // If last_read_at is null, user has never read this conversation
      // so any message from others counts as unread
      const unreadCount =
        lastMessage && lastMessage.sender_id !== user.id
          ? myLastRead
            ? new Date(lastMessage.created_at) > new Date(myLastRead)
              ? 1
              : 0
            : 1 // never read → unread
          : 0;

      // Determine void status: direct conversations with non-friends go to The Void
      let isVoid = false;
      if (conv.type === "direct") {
        const otherParticipant = participants.find(
          (p) => p.user_id !== user.id
        );
        if (otherParticipant && !friendSet.has(otherParticipant.user_id)) {
          isVoid = true;
        }
      }

      return {
        ...conv,
        participants,
        last_message: lastMessage,
        unread_count: unreadCount,
        is_void: isVoid,
      };
    });

    const inboxConversations = result.filter((c) => !c.is_void);
    const voidConversations = result.filter((c) => c.is_void);

    return NextResponse.json({
      conversations: inboxConversations,
      voidConversations,
    });
  } catch (error) {
    console.error("Conversations fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST - Create or find a direct conversation
export async function POST(request: Request) {
  const db = createClient();
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { otherUserId } = await request.json();

    if (!otherUserId) {
      return NextResponse.json(
        { error: "otherUserId is required" },
        { status: 400 }
      );
    }

    if (otherUserId === user.id) {
      return NextResponse.json(
        { error: "Cannot create conversation with yourself" },
        { status: 400 }
      );
    }

    const { data: conversationId, error } = await db.rpc(
      "create_direct_conversation",
      { other_user_id: otherUserId }
    );

    if (error) throw error;

    return NextResponse.json({ conversationId });
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
