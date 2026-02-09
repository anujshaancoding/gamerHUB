import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Equip a theme
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { theme_id } = body;

    // If theme_id is null, unequip current theme
    if (theme_id === null) {
      const { error } = await supabase
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

    // Verify user owns this theme
    const { data: userTheme } = await supabase
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
    const { error } = await supabase
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
