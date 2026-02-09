import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBehaviorRating } from "@/types/verified-queue";

// GET - Get user's verified profile
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create verified profile
    let { data: profile, error } = await supabase
      .from("verified_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code === "PGRST116") {
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from("verified_profiles")
        .insert({
          user_id: user.id,
          status: "unverified",
          behavior_score: 75, // Start at "good"
          behavior_rating: "good",
          phone_verified: false,
          email_verified: !!user.email_confirmed_at,
          platform_linked: false,
          playtime_hours: 0,
          positive_endorsements: 0,
          negative_reports: 0,
          games_played: 0,
          active_strikes: 0,
          last_behavior_update: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      profile = newProfile;
    } else if (error) {
      throw error;
    }

    // Get recent endorsements received
    const { data: recentEndorsements } = await supabase
      .from("player_endorsements")
      .select(`
        type,
        created_at,
        from_user:users!from_user_id (
          username,
          avatar_url
        )
      `)
      .eq("to_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get endorsement counts by type
    const { data: endorsementCounts } = await supabase
      .from("player_endorsements")
      .select("type")
      .eq("to_user_id", user.id);

    const typeCounts: Record<string, number> = {};
    (endorsementCounts || []).forEach((e: { type: string }) => {
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    });

    return NextResponse.json({
      profile,
      recentEndorsements: recentEndorsements || [],
      endorsementCounts: typeCounts,
    });
  } catch (error) {
    console.error("Get verified profile error:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}

// POST - Request verification
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from("verified_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Check requirements
    const requirements = {
      email_verified: profile.email_verified,
      phone_verified: profile.phone_verified,
      platform_linked: profile.platform_linked,
      playtime_sufficient: profile.playtime_hours >= 10,
      behavior_good: profile.behavior_score >= 50,
    };

    const allMet = Object.values(requirements).every(Boolean);

    if (!allMet) {
      return NextResponse.json({
        error: "Verification requirements not met",
        requirements,
      }, { status: 400 });
    }

    // Update status to pending
    const { data: updatedProfile, error } = await supabase
      .from("verified_profiles")
      .update({
        status: "pending",
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // In a real app, this would trigger a verification process
    // For now, auto-verify after a short delay (simulate)
    setTimeout(async () => {
      await supabase
        .from("verified_profiles")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }, 2000);

    return NextResponse.json({
      profile: updatedProfile,
      message: "Verification requested",
    });
  } catch (error) {
    console.error("Request verification error:", error);
    return NextResponse.json(
      { error: "Failed to request verification" },
      { status: 500 }
    );
  }
}
