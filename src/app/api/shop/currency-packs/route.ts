import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";

// GET - List currency packs
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: packs, error } = await supabase
      .from("currency_packs")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching currency packs:", error);
      return NextResponse.json(
        { error: "Failed to fetch currency packs" },
        { status: 500 }
      );
    }

    return cachedResponse({ packs }, CACHE_DURATIONS.STATIC);
  } catch (error) {
    console.error("Currency packs fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
