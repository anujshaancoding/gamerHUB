import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { CreateCoachProfileRequest, CoachingStatus } from "@/types/coaching";
import { getCoachTier } from "@/types/coaching";
import { getUser } from "@/lib/auth/get-user";

// GET - List coaches with filters
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const gameId = searchParams.get("game_id");
    const specialty = searchParams.get("specialty");
    const language = searchParams.get("language");
    const minRating = parseFloat(searchParams.get("min_rating") || "0");
    const maxPrice = searchParams.get("max_price");
    const freeOnly = searchParams.get("free_only") === "true";
    const status = searchParams.get("status") as CoachingStatus | null;
    const featured = searchParams.get("featured") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .from("coach_profiles")
      .select(`
        *,
        users!inner (
          id,
          username,
          avatar_url
        )
      `)
      .gte("average_rating", minRating)
      .order("featured", { ascending: false })
      .order("average_rating", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (gameId) {
      query = query.contains("games", [gameId]);
    }

    if (specialty) {
      query = query.contains("specialties", [specialty]);
    }

    if (language) {
      query = query.contains("languages", [language]);
    }

    if (freeOnly) {
      query = query.is("hourly_rate", null);
    } else if (maxPrice) {
      query = query.lte("hourly_rate", parseFloat(maxPrice));
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (featured) {
      query = query.eq("featured", true);
    }

    const { data: coaches, error, count } = await query;

    if (error) {
      throw error;
    }

    // Map coach data
    const mappedCoaches = (coaches || []).map((coach: any) => ({
      ...coach,
      username: coach.users?.username,
      avatar_url: coach.users?.avatar_url,
      tier: getCoachTier(coach.total_sessions, coach.average_rating),
    }));

    return NextResponse.json({
      coaches: mappedCoaches,
      total: count || mappedCoaches.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("List coaches error:", error);
    return NextResponse.json(
      { error: "Failed to list coaches" },
      { status: 500 }
    );
  }
}

// POST - Create coach profile (become a coach)
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has a coach profile
    const { data: existing } = await db
      .from("coach_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You already have a coach profile" },
        { status: 400 }
      );
    }

    const body: CreateCoachProfileRequest = await request.json();

    // Validate required fields
    if (!body.bio || body.bio.length < 50) {
      return NextResponse.json(
        { error: "Bio must be at least 50 characters" },
        { status: 400 }
      );
    }

    if (!body.games || body.games.length === 0) {
      return NextResponse.json(
        { error: "At least one game is required" },
        { status: 400 }
      );
    }

    if (!body.specialties || body.specialties.length === 0) {
      return NextResponse.json(
        { error: "At least one specialty is required" },
        { status: 400 }
      );
    }

    // Get user info
    const { data: userInfo } = await db
      .from("users")
      .select("username")
      .eq("id", user.id)
      .single();

    // Create coach profile
    const { data: profile, error } = await db
      .from("coach_profiles")
      .insert({
        user_id: user.id,
        display_name: userInfo?.username || "Coach",
        bio: body.bio,
        games: body.games,
        specialties: body.specialties,
        hourly_rate: body.hourly_rate || null,
        currency: body.currency || "USD",
        languages: body.languages || ["en"],
        experience_years: body.experience_years || 0,
        availability: body.availability || {
          timezone: "UTC",
          weekly_hours: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          },
          exceptions: [],
        },
        tier: "rising",
        status: "available",
        total_sessions: 0,
        total_students: 0,
        average_rating: 0,
        rating_count: 0,
        verified: false,
        featured: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Create coach profile error:", error);
      return NextResponse.json(
        { error: "Failed to create coach profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("Create coach profile error:", error);
    return NextResponse.json(
      { error: "Failed to create coach profile" },
      { status: 500 }
    );
  }
}
