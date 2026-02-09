import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProfileTheme } from "@/types/database";

// GET - List all themes
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: themes, error } = await supabase
      .from("profile_themes")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching themes:", error);
      return NextResponse.json(
        { error: "Failed to fetch themes" },
        { status: 500 }
      );
    }

    // Get current user's unlocked themes
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let unlockedThemeIds: string[] = [];
    if (user) {
      const { data: userThemes } = await supabase
        .from("user_themes")
        .select("theme_id")
        .eq("user_id", user.id);
      unlockedThemeIds =
        (userThemes as { theme_id: string }[] | null)?.map((t) => t.theme_id) || [];
    }

    const typedThemes = themes as ProfileTheme[] | null;
    const themesWithStatus = typedThemes?.map((theme) => ({
      ...theme,
      is_unlocked: unlockedThemeIds.includes(theme.id),
    }));

    return NextResponse.json({ themes: themesWithStatus || [] });
  } catch (error) {
    console.error("Themes list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
