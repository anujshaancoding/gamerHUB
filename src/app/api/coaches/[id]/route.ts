import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UpdateCoachProfileRequest } from "@/types/coaching";
import { getCoachTier } from "@/types/coaching";

// GET - Get coach profile by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: coach, error } = await supabase
      .from("coach_profiles")
      .select(`
        *,
        users!inner (
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
          { error: "Coach not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    // Get recent reviews
    const { data: reviews } = await supabase
      .from("coach_reviews")
      .select(`
        *,
        users!student_id (
          username,
          avatar_url
        )
      `)
      .eq("coach_id", id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get upcoming sessions count
    const { count: upcomingSessions } = await supabase
      .from("coaching_sessions")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", id)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", new Date().toISOString());

    const mappedCoach = {
      ...coach,
      username: coach.users?.username,
      avatar_url: coach.users?.avatar_url,
      tier: getCoachTier(coach.total_sessions, coach.average_rating),
      recent_reviews: reviews || [],
      upcoming_sessions: upcomingSessions || 0,
    };

    return NextResponse.json({ coach: mappedCoach });
  } catch (error) {
    console.error("Get coach error:", error);
    return NextResponse.json(
      { error: "Failed to get coach" },
      { status: 500 }
    );
  }
}

// PATCH - Update coach profile
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

    // Verify ownership
    const { data: existing } = await supabase
      .from("coach_profiles")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to update this profile" },
        { status: 403 }
      );
    }

    const body: UpdateCoachProfileRequest = await request.json();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.bio !== undefined) {
      if (body.bio.length < 50) {
        return NextResponse.json(
          { error: "Bio must be at least 50 characters" },
          { status: 400 }
        );
      }
      updates.bio = body.bio;
    }

    if (body.games !== undefined) {
      if (body.games.length === 0) {
        return NextResponse.json(
          { error: "At least one game is required" },
          { status: 400 }
        );
      }
      updates.games = body.games;
    }

    if (body.specialties !== undefined) {
      updates.specialties = body.specialties;
    }

    if (body.hourly_rate !== undefined) {
      updates.hourly_rate = body.hourly_rate || null;
    }

    if (body.currency !== undefined) {
      updates.currency = body.currency;
    }

    if (body.languages !== undefined) {
      updates.languages = body.languages;
    }

    if (body.status !== undefined) {
      updates.status = body.status;
    }

    if (body.availability !== undefined) {
      // Merge with existing availability
      const { data: current } = await supabase
        .from("coach_profiles")
        .select("availability")
        .eq("id", id)
        .single();

      updates.availability = {
        ...current?.availability,
        ...body.availability,
      };
    }

    const { data: profile, error } = await supabase
      .from("coach_profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Update coach error:", error);
    return NextResponse.json(
      { error: "Failed to update coach profile" },
      { status: 500 }
    );
  }
}

// DELETE - Delete coach profile
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

    // Verify ownership
    const { data: existing } = await supabase
      .from("coach_profiles")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this profile" },
        { status: 403 }
      );
    }

    // Check for pending sessions
    const { count: pendingSessions } = await supabase
      .from("coaching_sessions")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", id)
      .in("status", ["pending", "confirmed"]);

    if (pendingSessions && pendingSessions > 0) {
      return NextResponse.json(
        { error: "Cannot delete profile with pending sessions. Cancel them first." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("coach_profiles")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete coach error:", error);
    return NextResponse.json(
      { error: "Failed to delete coach profile" },
      { status: 500 }
    );
  }
}
