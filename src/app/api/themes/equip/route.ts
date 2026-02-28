import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { isPromoPeriodActive } from "@/lib/promo";
import { getUser } from "@/lib/auth/get-user";

// POST - Equip a theme
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { theme_id } = body;

    // If theme_id is null, unequip current theme
    if (theme_id === null) {
      const { error } = await db
        .from("user_progression")
        .update({ active_theme_id: null } as never)
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to unequip theme:", error);
        return NextResponse.json(
          { error: "Failed to unequip theme" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, active_theme_id: null });
    }

    // Check if theme requires premium
    const { data: themeData } = await db
      .from("profile_themes")
      .select("unlock_type")
      .eq("id", theme_id)
      .single();

    if (themeData?.unlock_type !== "default") {
      if (!isPromoPeriodActive()) {
        const { data: sub } = await db
          .from("user_subscriptions" as any)
          .select("status")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing"])
          .single();

        const { data: profile } = await db
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();

        if (!sub && !profile?.is_premium) {
          return NextResponse.json(
            { error: "Premium required to equip this theme" },
            { status: 403 }
          );
        }
      }
    }

    // Verify user owns this theme
    const { data: userTheme } = await db
      .from("user_themes")
      .select("id")
      .eq("user_id", user.id)
      .eq("theme_id", theme_id)
      .single();

    if (!userTheme) {
      return NextResponse.json(
        { error: "Theme not unlocked" },
        { status: 400 }
      );
    }

    // Update active theme
    const { error } = await db
      .from("user_progression")
      .update({ active_theme_id: theme_id } as never)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to equip theme:", error);
      return NextResponse.json(
        { error: "Failed to equip theme" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, active_theme_id: theme_id });
  } catch (error) {
    console.error("Theme equip error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
