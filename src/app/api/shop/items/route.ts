import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";

// GET - List shop items
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const itemType = searchParams.get("type");
    const rarity = searchParams.get("rarity");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("shop_items")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("category", category);
    }

    if (itemType) {
      query = query.eq("item_type", itemType);
    }

    if (rarity) {
      query = query.eq("rarity", rarity);
    }

    const { data: items, error, count } = await query;

    if (error) {
      console.error("Error fetching shop items:", error);
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: 500 }
      );
    }

    // Get unique categories for filtering
    const { data: categories } = await supabase
      .from("shop_items")
      .select("category")
      .eq("is_active", true)
      .not("category", "is", null);

    const uniqueCategories = [...new Set(categories?.map((c) => c.category) || [])];

    return cachedResponse(
      {
        items,
        total: count || 0,
        limit,
        offset,
        categories: uniqueCategories,
      },
      CACHE_DURATIONS.USER_DATA
    );
  } catch (error) {
    console.error("Shop items fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
