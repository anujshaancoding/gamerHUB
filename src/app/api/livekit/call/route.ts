import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import type { Call, CallParticipant } from "@/types/database";

// Initiate a call
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
    const { conversationId, type } = body;

    if (!conversationId || !type) {
      return NextResponse.json(
        { error: "Missing conversationId or type" },
        { status: 400 }
      );
    }

    if (type !== "voice" && type !== "video") {
      return NextResponse.json(
        { error: "Invalid call type" },
        { status: 400 }
      );
    }

    // Verify user is in the conversation
    const { data: participant, error: participantError } = await supabase
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: "Not a conversation participant" },
        { status: 403 }
      );
    }

    // Check for existing active call in this conversation
    const { data: existingCall } = await supabase
      .from("calls")
      .select("*")
      .eq("conversation_id", conversationId)
      .in("status", ["ringing", "active"])
      .single();

    if (existingCall) {
      const existing = existingCall as unknown as Call;
      return NextResponse.json(
        { error: "Call already in progress", callId: existing.id },
        { status: 409 }
      );
    }

    // Generate unique room name
    const roomName = `call_${conversationId}_${nanoid(10)}`;

    // Create call record
    const { data: callData, error: callError } = await supabase
      .from("calls")
      .insert({
        conversation_id: conversationId,
        initiator_id: user.id,
        type: type as "voice" | "video",
        room_name: roomName,
        status: "ringing",
      } as unknown as never)
      .select()
      .single();

    if (callError || !callData) {
      console.error("Failed to create call:", callError);
      return NextResponse.json(
        { error: "Failed to create call" },
        { status: 500 }
      );
    }

    const call = callData as unknown as Call;

    // Get all conversation participants
    const { data: participantsData } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId);

    const participants = participantsData as { user_id: string }[] | null;

    // Create call_participants for all users
    if (participants) {
      const callParticipants = participants.map((p) => ({
        call_id: call.id,
        user_id: p.user_id,
        status: p.user_id === user.id ? "joined" : "invited",
        joined_at: p.user_id === user.id ? new Date().toISOString() : null,
      }));

      await supabase
        .from("call_participants")
        .insert(callParticipants as unknown as never);
    }

    return NextResponse.json({
      callId: call.id,
      roomName: call.room_name,
      type: call.type,
    });
  } catch (error) {
    console.error("Call initiation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update call status
export async function PATCH(request: NextRequest) {
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
    const { callId, status, action } = body;

    if (!callId) {
      return NextResponse.json({ error: "Missing callId" }, { status: 400 });
    }

    // Handle different actions
    if (action === "join") {
      // Update call status to active if first non-initiator joining
      const { data: callData } = await supabase
        .from("calls")
        .select("status")
        .eq("id", callId)
        .single();

      const call = callData as unknown as Pick<Call, "status"> | null;

      if (call?.status === "ringing") {
        await supabase
          .from("calls")
          .update({
            status: "active",
            started_at: new Date().toISOString(),
          } as unknown as never)
          .eq("id", callId);
      }

      // Update participant status
      await supabase
        .from("call_participants")
        .update({
          status: "joined",
          joined_at: new Date().toISOString(),
        } as unknown as never)
        .eq("call_id", callId)
        .eq("user_id", user.id);

      return NextResponse.json({ success: true });
    }

    if (action === "leave") {
      await supabase
        .from("call_participants")
        .update({
          status: "left",
          left_at: new Date().toISOString(),
        } as unknown as never)
        .eq("call_id", callId)
        .eq("user_id", user.id);

      // Check if all participants have left
      const { data: activeParticipants } = await supabase
        .from("call_participants")
        .select("*")
        .eq("call_id", callId)
        .eq("status", "joined");

      if (!activeParticipants || activeParticipants.length === 0) {
        // End the call
        const { data: callData } = await supabase
          .from("calls")
          .select("started_at")
          .eq("id", callId)
          .single();

        const call = callData as unknown as Pick<Call, "started_at"> | null;

        const duration = call?.started_at
          ? Math.floor(
              (Date.now() - new Date(call.started_at).getTime()) / 1000
            )
          : null;

        await supabase
          .from("calls")
          .update({
            status: "ended",
            ended_at: new Date().toISOString(),
            duration_seconds: duration,
          } as unknown as never)
          .eq("id", callId);
      }

      return NextResponse.json({ success: true });
    }

    if (action === "decline") {
      await supabase
        .from("call_participants")
        .update({ status: "declined" } as unknown as never)
        .eq("call_id", callId)
        .eq("user_id", user.id);

      // Check if all invited participants declined
      const { data: pendingParticipants } = await supabase
        .from("call_participants")
        .select("*")
        .eq("call_id", callId)
        .in("status", ["invited", "ringing"]);

      // Also check if there are any joined participants (the initiator)
      const { data: joinedParticipants } = await supabase
        .from("call_participants")
        .select("*")
        .eq("call_id", callId)
        .eq("status", "joined");

      if (
        (!pendingParticipants || pendingParticipants.length === 0) &&
        joinedParticipants &&
        joinedParticipants.length <= 1
      ) {
        await supabase
          .from("calls")
          .update({
            status: "declined",
            ended_at: new Date().toISOString(),
          } as unknown as never)
          .eq("id", callId);
      }

      return NextResponse.json({ success: true });
    }

    // Generic status update
    if (status) {
      await supabase
        .from("calls")
        .update({ status } as unknown as never)
        .eq("id", callId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Call update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
