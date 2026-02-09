import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SessionStatus } from "@/types/coaching";

// GET - Get session details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: session, error } = await supabase
      .from("coaching_sessions")
      .select(`
        *,
        coach:coach_profiles!coach_id (
          id,
          display_name,
          user_id,
          hourly_rate,
          currency,
          users!user_id (
            username,
            avatar_url
          )
        ),
        student:users!student_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    // Check if user is coach or student
    const { data: coachProfile } = await supabase
      .from("coach_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const isCoach = coachProfile?.id === session.coach_id;
    const isStudent = session.student_id === user.id;

    if (!isCoach && !isStudent) {
      return NextResponse.json(
        { error: "Not authorized to view this session" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      session: {
        ...session,
        coach: session.coach
          ? {
              id: session.coach.id,
              display_name: session.coach.display_name,
              username: session.coach.users?.username,
              avatar_url: session.coach.users?.avatar_url,
              hourly_rate: session.coach.hourly_rate,
              currency: session.coach.currency,
            }
          : null,
      },
      isCoach,
      isStudent,
    });
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}

// PATCH - Update session (confirm, cancel, complete, add notes, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get session and verify access
    const { data: session } = await supabase
      .from("coaching_sessions")
      .select("*, coach_profiles!coach_id(user_id)")
      .eq("id", id)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const isCoach = session.coach_profiles?.user_id === user.id;
    const isStudent = session.student_id === user.id;

    if (!isCoach && !isStudent) {
      return NextResponse.json(
        { error: "Not authorized to update this session" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Handle status changes
    if (body.status) {
      const newStatus = body.status as SessionStatus;
      const currentStatus = session.status as SessionStatus;

      // Validate status transitions
      const validTransitions: Record<SessionStatus, SessionStatus[]> = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["in_progress", "cancelled", "no_show"],
        in_progress: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
        no_show: [],
      };

      if (!validTransitions[currentStatus].includes(newStatus)) {
        return NextResponse.json(
          { error: `Cannot change status from ${currentStatus} to ${newStatus}` },
          { status: 400 }
        );
      }

      // Only coach can confirm or mark no-show
      if ((newStatus === "confirmed" || newStatus === "no_show") && !isCoach) {
        return NextResponse.json(
          { error: "Only the coach can perform this action" },
          { status: 403 }
        );
      }

      // Only coach can start or complete session
      if ((newStatus === "in_progress" || newStatus === "completed") && !isCoach) {
        return NextResponse.json(
          { error: "Only the coach can perform this action" },
          { status: 403 }
        );
      }

      updates.status = newStatus;

      // Update coach stats on completion
      if (newStatus === "completed") {
        await supabase.rpc("increment_coach_sessions", {
          p_coach_id: session.coach_id,
        });
      }
    }

    // Coach can update notes and meeting link
    if (isCoach) {
      if (body.notes !== undefined) {
        updates.notes = body.notes;
      }
      if (body.meeting_link !== undefined) {
        updates.meeting_link = body.meeting_link;
      }
      if (body.recording_url !== undefined) {
        updates.recording_url = body.recording_url;
      }
    }

    // Student can update topic and goals (only for pending sessions)
    if (isStudent && session.status === "pending") {
      if (body.topic !== undefined) {
        updates.topic = body.topic;
      }
      if (body.goals !== undefined) {
        updates.goals = body.goals;
      }
    }

    // Reschedule (both can request, needs confirmation)
    if (body.scheduled_at && session.status === "pending") {
      const newTime = new Date(body.scheduled_at);
      if (newTime <= new Date()) {
        return NextResponse.json(
          { error: "New time must be in the future" },
          { status: 400 }
        );
      }
      updates.scheduled_at = body.scheduled_at;
      updates.status = "pending"; // Requires re-confirmation
    }

    const { data: updatedSession, error } = await supabase
      .from("coaching_sessions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get session
    const { data: session } = await supabase
      .from("coaching_sessions")
      .select("*, coach_profiles!coach_id(user_id)")
      .eq("id", id)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const isCoach = session.coach_profiles?.user_id === user.id;
    const isStudent = session.student_id === user.id;

    if (!isCoach && !isStudent) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Can only cancel pending or confirmed sessions
    if (!["pending", "confirmed"].includes(session.status)) {
      return NextResponse.json(
        { error: "Cannot cancel this session" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("coaching_sessions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel session error:", error);
    return NextResponse.json(
      { error: "Failed to cancel session" },
      { status: 500 }
    );
  }
}
