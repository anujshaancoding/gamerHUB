import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";

// GET - Get all forum categories
export async function GET() {
  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: categories, error } = await (supabase as any)
      .from("forum_categories")
      .select(`
        id,
        slug,
        name,
        description,
        icon,
        color,
        game_id,
        parent_id,
        post_count,
        is_locked,
        display_order
      `)
      .eq("is_hidden", false)
      .order("display_order");

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    // Organize into parent/child structure - eslint-disable for untyped data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cats = categories as any[];
    const parentCategories = cats?.filter((c) => !c.parent_id) || [];
    const childCategories = cats?.filter((c) => c.parent_id) || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const organizedCategories = parentCategories.map((parent: any) => ({
      ...parent,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subcategories: childCategories.filter((c: any) => c.parent_id === parent.id),
    }));

    return cachedResponse(
      { categories: organizedCategories },
      CACHE_DURATIONS.LEADERBOARD
    );
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
