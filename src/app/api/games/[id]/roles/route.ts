import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get roles for a specific game
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = createClient();

    // Check if id is a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let gameId = id;
    if (!isUUID) {
      // Get game ID from slug
      const { data: game } = await db
        .from("games")
        .select("id")
        .eq("slug", id)
        .single();

      if (!game) {
        return NextResponse.json(
          { error: "Game not found" },
          { status: 404 }
        );
      }
      gameId = game.id;
    }

    const { data: roles, error } = await db
      .from("game_roles")
      .select("*")
      .eq("game_id", gameId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching game roles:", error);
      return NextResponse.json(
        { error: "Failed to fetch game roles" },
        { status: 500 }
      );
    }

    return NextResponse.json({ roles: roles || [] });
  } catch (error) {
    console.error("Game roles error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
