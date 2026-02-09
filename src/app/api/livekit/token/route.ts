import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";
import type { Call, Profile } from "@/types/database";

interface CallWithConversation extends Call {
  conversation: {
    participants: { user_id: string }[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { roomName, callId } = body;

    if (!roomName || !callId) {
      return NextResponse.json(
        { error: "Missing roomName or callId" },
        { status: 400 }
      );
    }

    // Verify user is participant in the call's conversation
    const { data: callData, error: callError } = await supabase
      .from("calls")
      .select(
        `
        *,
        conversation:conversations!inner (
          participants:conversation_participants!inner (user_id)
        )
      `
      )
      .eq("id", callId)
      .eq("room_name", roomName)
      .single();

    if (callError || !callData) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    const call = callData as unknown as CallWithConversation;
    const isParticipant = call.conversation.participants.some(
      (p) => p.user_id === user.id
    );

    if (!isParticipant) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    // Fetch user profile for display name
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", user.id)
      .single();

    const profile = profileData as Pick<
      Profile,
      "username" | "display_name" | "avatar_url"
    > | null;

    // Generate LiveKit token
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error("LiveKit credentials not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: profile?.display_name || profile?.username || "User",
      metadata: JSON.stringify({
        avatarUrl: profile?.avatar_url,
      }),
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
