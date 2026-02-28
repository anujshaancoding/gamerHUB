import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { SchedulingPreferenceInput, Region } from "@/types/localization";
import { REGIONS } from "@/types/localization";
import { getUser } from "@/lib/auth/get-user";

// GET - Get user's scheduling preferences
export async function GET() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: preferences, error } = await db
      .from("scheduling_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({
      preferences: preferences || null,
    });
  } catch (error) {
    console.error("Get scheduling preferences error:", error);
    return NextResponse.json(
      { error: "Failed to get scheduling preferences" },
      { status: 500 }
    );
  }
}

// POST - Create or update scheduling preferences
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SchedulingPreferenceInput = await request.json();

    // Validate available times
    if (body.available_times) {
      for (const slot of body.available_times) {
        if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
          return NextResponse.json(
            { error: "Day of week must be 0-6" },
            { status: 400 }
          );
        }
        if (slot.startHour < 0 || slot.startHour > 23 || slot.endHour < 0 || slot.endHour > 23) {
          return NextResponse.json(
            { error: "Hours must be 0-23" },
            { status: 400 }
          );
        }
        if (slot.startHour >= slot.endHour) {
          return NextResponse.json(
            { error: "Start hour must be before end hour" },
            { status: 400 }
          );
        }
      }
    }

    // Validate regions
    if (body.preferred_regions) {
      for (const region of body.preferred_regions) {
        if (!REGIONS[region as Region]) {
          return NextResponse.json(
            { error: `Invalid region: ${region}` },
            { status: 400 }
          );
        }
      }
    }

    // Check if preferences exist
    const { data: existing } = await db
      .from("scheduling_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let preferences;

    if (existing) {
      // Update existing
      const { data, error } = await db
        .from("scheduling_preferences")
        .update({
          available_times: body.available_times || [],
          preferred_regions: body.preferred_regions || [],
          language_preferences: body.language_preferences || [],
          cross_region_matching: body.cross_region_matching ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      preferences = data;
    } else {
      // Create new
      const { data, error } = await db
        .from("scheduling_preferences")
        .insert({
          user_id: user.id,
          available_times: body.available_times || [],
          preferred_regions: body.preferred_regions || [],
          language_preferences: body.language_preferences || [],
          cross_region_matching: body.cross_region_matching ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      preferences = data;
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Update scheduling preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update scheduling preferences" },
      { status: 500 }
    );
  }
}

// Find compatible players based on scheduling
export async function PUT(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gameId, targetTime, duration } = body;

    if (!targetTime) {
      return NextResponse.json(
        { error: "Target time is required" },
        { status: 400 }
      );
    }

    // Get user's preferences
    const { data: userPrefs } = await db
      .from("scheduling_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const targetDate = new Date(targetTime);
    const dayOfWeek = targetDate.getUTCDay();
    const hour = targetDate.getUTCHours();

    // Find users with matching availability
    const { data: matchingUsers, error } = await db
      .from("scheduling_preferences")
      .select(`
        user_id,
        available_times,
        preferred_regions,
        language_preferences,
        users!inner(
          id,
          username,
          avatar_url,
          region,
          language
        )
      `)
      .neq("user_id", user.id);

    if (error) throw error;

    // Filter for compatible schedules
    const compatibleUsers = (matchingUsers || []).filter(userPref => {
      const slots = userPref.available_times as any[];
      if (!slots || slots.length === 0) return false;

      // Check if any slot matches
      return slots.some(slot => {
        if (slot.dayOfWeek !== dayOfWeek) return false;

        // Convert user's local time to UTC for comparison
        // This is simplified - in production you'd use proper timezone conversion
        return hour >= slot.startHour && hour < slot.endHour;
      });
    }).map(userPref => ({
      user: userPref.users,
      availability: userPref.available_times,
      languages: userPref.language_preferences,
      regions: userPref.preferred_regions,
    }));

    // If game specified, filter by users who play that game
    let finalUsers = compatibleUsers;
    if (gameId) {
      const { data: gamePlayers } = await db
        .from("game_stats")
        .select("user_id")
        .eq("game_id", gameId);

      const playerIds = new Set(gamePlayers?.map(p => p.user_id) || []);
      finalUsers = compatibleUsers.filter(u => playerIds.has((u.user as any).id));
    }

    return NextResponse.json({
      compatibleUsers: finalUsers.slice(0, 20), // Limit results
      total: finalUsers.length,
      searchCriteria: {
        targetTime,
        dayOfWeek,
        hour,
        gameId,
      },
    });
  } catch (error) {
    console.error("Find compatible players error:", error);
    return NextResponse.json(
      { error: "Failed to find compatible players" },
      { status: 500 }
    );
  }
}
