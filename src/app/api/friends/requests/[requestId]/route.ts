import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";
import {
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
} from "@/lib/db/rpc-types";
import { emitToUser } from "@/lib/realtime/socket-server";

interface RouteParams {
  params: Promise<{ requestId: string }>;
}

// GET - Get single friend request
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const db = createClient();
    const { requestId } = await params;

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await db
      .from("friend_requests")
      .select(
        `
        *,
        sender:profiles!friend_requests_sender_id_fkey(*),
        recipient:profiles!friend_requests_recipient_id_fkey(*)
      `
      )
      .eq("id", requestId)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .single();

    if (error) {
      console.error("Error fetching friend request:", error);
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: data });
  } catch (error) {
    console.error("Get friend request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Accept or decline friend request
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const db = createClient();
    const { requestId } = await params;

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'accept' or 'decline'

    if (!action || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    // Look up the request to find the sender for socket notifications
    const { data: requestData } = await db
      .from("friend_requests")
      .select("sender_id")
      .eq("id", requestId)
      .single() as { data: { sender_id: string } | null };

    if (action === "accept") {
      const { error } = await acceptFriendRequest(
        db,
        requestId,
        user.id
      );

      if (error) {
        console.error("Error accepting friend request:", error);
        return NextResponse.json(
          { error: error.message || "Failed to accept friend request" },
          { status: 400 }
        );
      }

      // Notify sender that their request was accepted
      if (requestData?.sender_id) {
        emitToUser(requestData.sender_id, "friend-request:accepted", {
          requestId,
          acceptedBy: user.id,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Friend request accepted",
      });
    } else {
      const { error } = await declineFriendRequest(
        db,
        requestId,
        user.id
      );

      if (error) {
        console.error("Error declining friend request:", error);
        return NextResponse.json(
          { error: error.message || "Failed to decline friend request" },
          { status: 400 }
        );
      }

      // Notify sender that their request was declined
      if (requestData?.sender_id) {
        emitToUser(requestData.sender_id, "friend-request:declined", {
          requestId,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Friend request declined",
      });
    }
  } catch (error) {
    console.error("Update friend request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel friend request (only sender can cancel)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const db = createClient();
    const { requestId } = await params;

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up the request to find the recipient for socket notification
    const { data: cancelRequestData } = await db
      .from("friend_requests")
      .select("recipient_id")
      .eq("id", requestId)
      .single() as { data: { recipient_id: string } | null };

    const { error } = await cancelFriendRequest(db, requestId, user.id);

    if (error) {
      console.error("Error canceling friend request:", error);
      return NextResponse.json(
        { error: error.message || "Failed to cancel friend request" },
        { status: 400 }
      );
    }

    // Notify recipient that the request was cancelled
    if (cancelRequestData?.recipient_id) {
      emitToUser(cancelRequestData.recipient_id, "friend-request:cancelled", {
        requestId,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Friend request cancelled",
    });
  } catch (error) {
    console.error("Cancel friend request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
