import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { EventRSVPStatus } from "@/types/community";
import { getUser } from "@/lib/auth/get-user";

// POST - RSVP to an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, message }: { status: EventRSVPStatus; message?: string } =
      await request.json();

    if (!status || !["going", "maybe", "not_going"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (going, maybe, not_going)" },
        { status: 400 }
      );
    }

    // Get the event
    const { data: event, error: eventError } = await db
      .from("community_events")
      .select("id, rsvp_count, max_attendees, status")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "published") {
      return NextResponse.json(
        { error: "This event is not available for RSVP" },
        { status: 400 }
      );
    }

    // Check existing RSVP
    const { data: existingRsvp } = await db
      .from("event_rsvps")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    const wasGoing = existingRsvp?.status === "going";
    const isGoing = status === "going";

    // Check capacity for "going" status
    if (
      isGoing &&
      !wasGoing &&
      event.max_attendees &&
      event.rsvp_count >= event.max_attendees
    ) {
      return NextResponse.json(
        { error: "This event is at capacity" },
        { status: 400 }
      );
    }

    if (existingRsvp) {
      // Update existing RSVP
      await db
        .from("event_rsvps")
        .update({
          status,
          response_message: message || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRsvp.id);
    } else {
      // Create new RSVP
      await db.from("event_rsvps").insert({
        event_id: eventId,
        user_id: user.id,
        status,
        response_message: message || null,
      });
    }

    // Update RSVP count (only count "going" responses)
    let newRsvpCount = event.rsvp_count;

    if (wasGoing && !isGoing) {
      newRsvpCount = Math.max(0, event.rsvp_count - 1);
    } else if (!wasGoing && isGoing) {
      newRsvpCount = event.rsvp_count + 1;
    }

    if (newRsvpCount !== event.rsvp_count) {
      await db
        .from("community_events")
        .update({ rsvp_count: newRsvpCount })
        .eq("id", eventId);
    }

    // Fetch updated event
    const { data: updatedEvent } = await db
      .from("community_events")
      .select(`
        *,
        organizer:profiles!community_events_organizer_id_fkey(id, username, avatar_url),
        game:games(id, slug, name)
      `)
      .eq("id", eventId)
      .single();

    return NextResponse.json({
      success: true,
      event: {
        ...updatedEvent,
        user_rsvp: status,
      },
    });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json({ error: "Failed to RSVP" }, { status: 500 });
  }
}

// DELETE - Cancel RSVP
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing RSVP
    const { data: existingRsvp } = await db
      .from("event_rsvps")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (!existingRsvp) {
      return NextResponse.json({ error: "RSVP not found" }, { status: 404 });
    }

    // Delete RSVP
    await db.from("event_rsvps").delete().eq("id", existingRsvp.id);

    // Update RSVP count if was "going"
    if (existingRsvp.status === "going") {
      const { data: event } = await db
        .from("community_events")
        .select("rsvp_count")
        .eq("id", eventId)
        .single();

      if (event) {
        await db
          .from("community_events")
          .update({ rsvp_count: Math.max(0, event.rsvp_count - 1) })
          .eq("id", eventId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel RSVP error:", error);
    return NextResponse.json(
      { error: "Failed to cancel RSVP" },
      { status: 500 }
    );
  }
}
