import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";

// GET - Get all games
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: games, error } = await supabase
      .from("games")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching games:", error);
      return NextResponse.json(
        { error: "Failed to fetch games" },
        { status: 500 }
      );
    }

    return cachedResponse({ games: games || [] }, CACHE_DURATIONS.GAMES);
  } catch (error) {
    console.error("Games fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
