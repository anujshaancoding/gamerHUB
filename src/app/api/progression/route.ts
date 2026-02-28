import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { privateCachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";
import { getUser } from "@/lib/auth/get-user";

// GET - Get current user's progression
export async function GET() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: progression, error } = await db
      .from("user_progression")
      .select(
        `
        *,
        active_title:titles(*),
        active_frame:profile_frames(*),
        active_theme:profile_themes(*)
      `
      )
      .eq("user_id", user.id)
      .single();

    if (error) {
      // Create progression if doesn't exist
      const { data: newProgression, error: createError } = await db
        .from("user_progression")
        .insert({ user_id: user.id } as never)
        .select(
          `
          *,
          active_title:titles(*),
          active_frame:profile_frames(*),
          active_theme:profile_themes(*)
        `
        )
        .single();

      if (createError) {
        console.error("Failed to create progression:", createError);
        return NextResponse.json(
          { error: "Failed to get progression" },
          { status: 500 }
        );
      }
      return privateCachedResponse({ progression: newProgression }, CACHE_DURATIONS.USER_DATA);
    }

    return privateCachedResponse({ progression }, CACHE_DURATIONS.USER_DATA);
  } catch (error) {
    console.error("Progression fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update user's progression (customization)
export async function PATCH(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { active_title_id, active_frame_id, active_theme_id, showcase_badges } =
      body;

    const updateData: Record<string, unknown> = {};

    if (active_title_id !== undefined) {
      // Verify user owns this title
      if (active_title_id !== null) {
        const { data: userTitle } = await db
          .from("user_titles")
          .select("id")
          .eq("user_id", user.id)
          .eq("title_id", active_title_id)
          .single();

        if (!userTitle) {
          return NextResponse.json(
            { error: "Title not unlocked" },
            { status: 400 }
          );
        }
      }
      updateData.active_title_id = active_title_id;
    }

    if (active_frame_id !== undefined) {
      // Verify user owns this frame
      if (active_frame_id !== null) {
        const { data: userFrame } = await db
          .from("user_frames")
          .select("id")
          .eq("user_id", user.id)
          .eq("frame_id", active_frame_id)
          .single();

        if (!userFrame) {
          return NextResponse.json(
            { error: "Frame not unlocked" },
            { status: 400 }
          );
        }
      }
      updateData.active_frame_id = active_frame_id;
    }

    if (active_theme_id !== undefined) {
      // Verify user owns this theme
      if (active_theme_id !== null) {
        const { data: userTheme } = await db
          .from("user_themes")
          .select("id")
          .eq("user_id", user.id)
          .eq("theme_id", active_theme_id)
          .single();

        if (!userTheme) {
          return NextResponse.json(
            { error: "Theme not unlocked" },
            { status: 400 }
          );
        }
      }
      updateData.active_theme_id = active_theme_id;
    }

    if (showcase_badges !== undefined) {
      // Validate showcase badges (max 5, must be owned)
      if (Array.isArray(showcase_badges) && showcase_badges.length <= 5) {
        const { data: userBadges } = await db
          .from("user_badges")
          .select("badge_id")
          .eq("user_id", user.id);

        const ownedBadgeIds = new Set(
          (userBadges as { badge_id: string }[] | null)?.map((b) => b.badge_id) || []
        );
        const validBadges = showcase_badges.filter((id: string) =>
          ownedBadgeIds.has(id)
        );
        updateData.showcase_badges = validBadges;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      );
    }

    const { data: progression, error } = await db
      .from("user_progression")
      .update(updateData as never)
      .eq("user_id", user.id)
      .select(
        `
        *,
        active_title:titles(*),
        active_frame:profile_frames(*),
        active_theme:profile_themes(*)
      `
      )
      .single();

    if (error) {
      console.error("Failed to update progression:", error);
      return NextResponse.json(
        { error: "Failed to update progression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ progression });
  } catch (error) {
    console.error("Progression update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
