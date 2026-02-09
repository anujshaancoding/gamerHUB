import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BookSessionRequest, SessionStatus } from "@/types/coaching";
import { SESSION_TYPES } from "@/types/coaching";

// GET - List sessions (as coach or student)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "both"; // "coach", "student", "both"
    const status = searchParams.get("status") as SessionStatus | null;
    const upcoming = searchParams.get("upcoming") === "true";
    const past = searchParams.get("past") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // Get user's coach profile if exists
    const { data: coachProfile } = await supabase
      .from("coach_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let query = supabase
      .from("coaching_sessions")
      .select(`
        *,
        coach:coach_profiles!coach_id (
          id,
          display_name,
          user_id,
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
      .order("scheduled_at", { ascending: upcoming });

    // Filter by role
    if (role === "coach" && coachProfile) {
      query = query.eq("coach_id", coachProfile.id);
    } else if (role === "student") {
      query = query.eq("student_id", user.id);
    } else {
      // Both - get sessions where user is coach or student
      if (coachProfile) {
        query = query.or(`coach_id.eq.${coachProfile.id},student_id.eq.${user.id}`);
      } else {
        query = query.eq("student_id", user.id);
      }
    }

    // Filter by status
    if (status) {
      query = query.eq("status", status);
    }

    // Filter by time
    const now = new Date().toISOString();
    if (upcoming) {
      query = query.gte("scheduled_at", now);
    } else if (past) {
      query = query.lt("scheduled_at", now);
    }

    query = query.limit(limit);

    const { data: sessions, error } = await query;

    if (error) {
      throw error;
    }

    // Map sessions with additional info
    const mappedSessions = (sessions || []).map((session: any) => ({
      ...session,
      coach: session.coach
        ? {
            id: session.coach.id,
            display_name: session.coach.display_name,
            username: session.coach.users?.username,
            avatar_url: session.coach.users?.avatar_url,
          }
        : null,
      session_type_info: SESSION_TYPES[session.session_type as keyof typeof SESSION_TYPES],
    }));

    return NextResponse.json({
      sessions: mappedSessions,
      isCoach: !!coachProfile,
    });
  } catch (error) {
    console.error("List sessions error:", error);
    return NextResponse.json(
      { error: "Failed to list sessions" },
      { status: 500 }
    );
  }
}

// POST - Book a new session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: BookSessionRequest = await request.json();

    // Validate session type
    if (!SESSION_TYPES[body.session_type]) {
      return NextResponse.json(
        { error: "Invalid session type" },
        { status: 400 }
      );
    }

    // Get coach profile
    const { data: coach } = await supabase
      .from("coach_profiles")
      .select("*")
      .eq("id", body.coach_id)
      .single();

    if (!coach) {
      return NextResponse.json(
        { error: "Coach not found" },
        { status: 404 }
      );
    }

    // Check if trying to book yourself
    if (coach.user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot book a session with yourself" },
        { status: 400 }
      );
    }

    // Check coach status
    if (coach.status === "offline" || coach.status === "vacation") {
      return NextResponse.json(
        { error: "Coach is not currently accepting sessions" },
        { status: 400 }
      );
    }

    // Validate scheduled time is in the future
    const scheduledAt = new Date(body.scheduled_at);
    if (scheduledAt <= new Date()) {
      return NextResponse.json(
        { error: "Session must be scheduled in the future" },
        { status: 400 }
      );
    }

    // Check for conflicting sessions
    const sessionEnd = new Date(scheduledAt.getTime() + body.duration_minutes * 60 * 1000);

    const { data: conflicts } = await supabase
      .from("coaching_sessions")
      .select("id")
      .eq("coach_id", body.coach_id)
      .in("status", ["pending", "confirmed", "in_progress"])
      .gte("scheduled_at", scheduledAt.toISOString())
      .lte("scheduled_at", sessionEnd.toISOString());

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: "Coach already has a session at this time" },
        { status: 400 }
      );
    }

    // Create session
    const { data: session, error } = await supabase
      .from("coaching_sessions")
      .insert({
        coach_id: body.coach_id,
        student_id: user.id,
        session_type: body.session_type,
        status: "pending",
        game_id: body.game_id,
        scheduled_at: body.scheduled_at,
        duration_minutes: body.duration_minutes,
        price: coach.hourly_rate
          ? (coach.hourly_rate * body.duration_minutes) / 60
          : null,
        currency: coach.currency,
        topic: body.topic || null,
        goals: body.goals || [],
      })
      .select()
      .single();

    if (error) {
      console.error("Book session error:", error);
      return NextResponse.json(
        { error: "Failed to book session" },
        { status: 500 }
      );
    }

    // TODO: Send notification to coach

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Book session error:", error);
    return NextResponse.json(
      { error: "Failed to book session" },
      { status: 500 }
    );
  }
}
