import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
} from "@/lib/supabase/rpc-types";

interface RouteParams {
  params: Promise<{ requestId: string }>;
}

// GET - Get single friend request
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { requestId } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
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
    const supabase = await createClient();
    const { requestId } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    if (action === "accept") {
      const { error } = await acceptFriendRequest(
        supabase,
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

      return NextResponse.json({
        success: true,
        message: "Friend request accepted",
      });
    } else {
      const { error } = await declineFriendRequest(
        supabase,
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
    const supabase = await createClient();
    const { requestId } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await cancelFriendRequest(supabase, requestId, user.id);

    if (error) {
      console.error("Error canceling friend request:", error);
      return NextResponse.json(
        { error: error.message || "Failed to cancel friend request" },
        { status: 400 }
      );
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
