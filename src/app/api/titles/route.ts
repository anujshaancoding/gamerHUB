import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Title } from "@/types/database";

// GET - List all titles
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: titles, error } = await supabase
      .from("titles")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching titles:", error);
      return NextResponse.json(
        { error: "Failed to fetch titles" },
        { status: 500 }
      );
    }

    // Get current user's unlocked titles
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let unlockedTitleIds: string[] = [];
    if (user) {
      const { data: userTitles } = await supabase
        .from("user_titles")
        .select("title_id")
        .eq("user_id", user.id);
      unlockedTitleIds =
        (userTitles as { title_id: string }[] | null)?.map((t) => t.title_id) || [];
    }

    const typedTitles = titles as Title[] | null;
    const titlesWithStatus = typedTitles?.map((title) => ({
      ...title,
      is_unlocked: unlockedTitleIds.includes(title.id),
      requires_premium: title.unlock_type === "special" || title.unlock_type === "purchase",
    }));

    return NextResponse.json({ titles: titlesWithStatus || [] });
  } catch (error) {
    console.error("Titles list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
