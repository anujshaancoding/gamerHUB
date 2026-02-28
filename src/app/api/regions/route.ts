import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { REGIONS, type Region, type UpdateLocalePreferencesRequest } from "@/types/localization";
import { getUser } from "@/lib/auth/get-user";

// GET - Get all regions or user's region preferences
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("stats") === "true";

    const user = await getUser();

    // Get all regions with stats if requested
    if (includeStats) {
      const regionsWithStats = await Promise.all(
        Object.entries(REGIONS).map(async ([code, region]) => {
          // Get member count for this region
          const { count: memberCount } = await db
            .from("regional_communities")
            .select("regional_community_members(id)", { count: "exact", head: true })
            .eq("region_code", code);

          // Get active communities in this region
          const { count: communityCount } = await db
            .from("regional_communities")
            .select("*", { count: "exact", head: true })
            .eq("region_code", code)
            .eq("is_active", true);

          return {
            code,
            ...region,
            memberCount: memberCount || 0,
            communityCount: communityCount || 0,
          };
        })
      );

      return NextResponse.json({ regions: regionsWithStats });
    }

    // Return basic region info
    const regions = Object.entries(REGIONS).map(([code, region]) => ({
      code,
      ...region,
    }));

    // If user is logged in, include their preferences
    let userPreferences = null;
    if (user) {
      const { data: prefs } = await db
        .from("users")
        .select("language, region, timezone, time_format, date_format")
        .eq("id", user.id)
        .single();

      userPreferences = prefs;
    }

    return NextResponse.json({
      regions,
      userPreferences,
    });
  } catch (error) {
    console.error("Get regions error:", error);
    return NextResponse.json(
      { error: "Failed to get regions" },
      { status: 500 }
    );
  }
}

// PATCH - Update user's locale preferences
export async function PATCH(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateLocalePreferencesRequest = await request.json();

    // Validate region
    if (body.region && !REGIONS[body.region as Region]) {
      return NextResponse.json(
        { error: "Invalid region" },
        { status: 400 }
      );
    }

    // Validate time format
    if (body.time_format && !["12h", "24h"].includes(body.time_format)) {
      return NextResponse.json(
        { error: "Invalid time format. Use '12h' or '24h'" },
        { status: 400 }
      );
    }

    // Validate date format
    if (body.date_format && !["mdy", "dmy", "ymd"].includes(body.date_format)) {
      return NextResponse.json(
        { error: "Invalid date format. Use 'mdy', 'dmy', or 'ymd'" },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.language !== undefined) updates.language = body.language;
    if (body.region !== undefined) updates.region = body.region;
    if (body.timezone !== undefined) updates.timezone = body.timezone;
    if (body.time_format !== undefined) updates.time_format = body.time_format;
    if (body.date_format !== undefined) updates.date_format = body.date_format;

    const { data: preferences, error } = await db
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select("language, region, timezone, time_format, date_format")
      .single();

    if (error) {
      console.error("Update locale preferences error:", error);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Update locale preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
