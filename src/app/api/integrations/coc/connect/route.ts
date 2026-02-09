import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validatePlayerTag,
  normalizePlayerTag,
  getPlayer,
  verifyPlayerToken,
  CocApiError,
} from "@/lib/integrations/coc";

// POST - Connect a Clash of Clans account via player tag
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { playerTag, verifyToken } = body as {
      playerTag?: string;
      verifyToken?: string;
    };

    if (!playerTag) {
      return NextResponse.json(
        { error: "Player tag is required" },
        { status: 400 }
      );
    }

    // Validate tag format
    if (!validatePlayerTag(playerTag)) {
      return NextResponse.json(
        { error: "Invalid player tag format. Example: #2YPQ0VJG8" },
        { status: 400 }
      );
    }

    const normalizedTag = normalizePlayerTag(playerTag);

    // Fetch player from CoC API
    let player;
    try {
      player = await getPlayer(normalizedTag);
    } catch (error) {
      if (error instanceof CocApiError && error.status === 404) {
        return NextResponse.json(
          { error: "Player not found. Please check your player tag." },
          { status: 404 }
        );
      }
      throw error;
    }

    // Optional: verify ownership via in-game API token
    let verified = false;
    if (verifyToken) {
      verified = await verifyPlayerToken(normalizedTag, verifyToken);
    }

    // Upsert connection
    const { error: upsertError } = await supabase
      .from("game_connections")
      .upsert(
        {
          user_id: user.id,
          provider: "supercell" as const,
          provider_user_id: player.tag,
          provider_username: player.name,
          provider_avatar_url: player.league?.iconUrls?.medium || null,
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
          scopes: [],
          metadata: {
            town_hall_level: player.townHallLevel,
            exp_level: player.expLevel,
            trophies: player.trophies,
            best_trophies: player.bestTrophies,
            war_stars: player.warStars,
            clan: player.clan
              ? {
                  name: player.clan.name,
                  tag: player.clan.tag,
                  level: player.clan.clanLevel,
                  badge_url: player.clan.badgeUrls?.medium,
                }
              : null,
            league: player.league?.name || null,
            verified,
          },
          is_active: true,
          connected_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,provider",
        }
      );

    if (upsertError) {
      console.error("Error storing CoC connection:", upsertError);
      return NextResponse.json(
        { error: "Failed to save connection" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      player: {
        name: player.name,
        tag: player.tag,
        townHallLevel: player.townHallLevel,
        expLevel: player.expLevel,
        trophies: player.trophies,
        bestTrophies: player.bestTrophies,
        warStars: player.warStars,
        league: player.league?.name || "Unranked",
        clan: player.clan
          ? { name: player.clan.name, tag: player.clan.tag }
          : null,
        verified,
      },
    });
  } catch (error) {
    console.error("CoC connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect Clash of Clans account" },
      { status: 500 }
    );
  }
}
