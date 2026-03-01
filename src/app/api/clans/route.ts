import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { createAdminClient } from "@/lib/db/admin";
import { isPromoPeriodActive } from "@/lib/promo";
import type { Clan } from "@/types/database";
import { getUser } from "@/lib/auth/get-user";

// GET - List/search clans
export async function GET(request: NextRequest) {
  try {
    const adminDb = createAdminClient();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search");
    const game = searchParams.get("game");
    const region = searchParams.get("region");
    const recruiting = searchParams.get("recruiting");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Resolve game slug to ID (the query builder doesn't support filtering on joined columns)
    let gameId: string | null = null;
    if (game) {
      const { data: gameRow } = await adminDb
        .from("games")
        .select("id")
        .eq("slug", game)
        .maybeSingle();
      if (gameRow) {
        gameId = (gameRow as any).id;
      } else {
        return NextResponse.json({ clans: [], total: 0, limit, offset });
      }
    }

    // 1. Query clans with flat FK join for primary_game
    let query = adminDb
      .from("clans")
      .select(
        "*, primary_game:games!clans_primary_game_id_fkey(id, slug, name, icon_url)",
        { count: "exact" }
      )
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,tag.ilike.%${search}%`);
    }

    if (gameId) {
      query = query.eq("primary_game_id", gameId);
    }

    if (region) {
      query = query.eq("region", region);
    }

    if (recruiting === "true") {
      query = query.eq("is_recruiting", true);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching clans:", error);
      return NextResponse.json(
        { error: "Failed to fetch clans", details: error.message, code: error.code },
        { status: 500 }
      );
    }

    const clanRows = (data || []) as any[];
    if (clanRows.length === 0) {
      return NextResponse.json({ clans: [], total: count || 0, limit, offset });
    }

    const clanIds = clanRows.map((c: any) => c.id);

    // 2. Get member counts via separate query
    const { data: memberRows } = await adminDb
      .from("clan_members")
      .select("clan_id")
      .in("clan_id", clanIds);

    const memberCountMap: Record<string, number> = {};
    for (const row of (memberRows || []) as any[]) {
      memberCountMap[row.clan_id] = (memberCountMap[row.clan_id] || 0) + 1;
    }

    // 3. Get clan_games with game info via flat FK join
    const { data: clanGamesRows } = await adminDb
      .from("clan_games")
      .select("*, game:games!clan_games_game_id_fkey(id, slug, name, icon_url)")
      .in("clan_id", clanIds);

    const clanGamesMap: Record<string, any[]> = {};
    for (const row of (clanGamesRows || []) as any[]) {
      if (!clanGamesMap[row.clan_id]) clanGamesMap[row.clan_id] = [];
      clanGamesMap[row.clan_id].push(row);
    }

    // 4. Combine results
    const clans = clanRows.map((clan: any) => ({
      ...clan,
      member_count: memberCountMap[clan.id] || 0,
      clan_members: [{ count: memberCountMap[clan.id] || 0 }],
      clan_games: clanGamesMap[clan.id] || [],
    }));

    return NextResponse.json({
      clans,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Clans list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new clan
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has premium access (subscription, profile flag, app_metadata, or launch promo)
    let isPremium = isPromoPeriodActive();

    if (!isPremium) {
      // 1. Check user_subscriptions table
      const { data: subscription } = await db
        .from("user_subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .single();

      if (subscription) {
        isPremium = true;
      }

      // 2. Check profiles.is_premium flag
      if (!isPremium) {
        const { data: profile } = await db
          .from("profiles")
          .select("is_premium, premium_until")
          .eq("id", user.id)
          .single() as any;

        if (profile?.is_premium) {
          isPremium = true;
        }
      }

      // 3. Fallback: check auth app_metadata (set by coupon redemption)
      if (!isPremium && user.app_metadata?.is_premium) {
        const metaPremiumUntil = user.app_metadata.premium_until;
        if (metaPremiumUntil && new Date(metaPremiumUntil) > new Date()) {
          isPremium = true;
        }
      }
    }

    if (!isPremium) {
      return NextResponse.json(
        { error: "Only Premium members can create clans. Upgrade to Premium to create your own clan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      tag,
      description,
      primary_game_id,
      primary_game_slug,
      custom_game_name,
      region,
      language,
      is_public,
      join_type,
    } = body;

    // Resolve game ID: use provided ID, look up by slug, or look up/create by custom name
    let resolvedGameId = primary_game_id || null;

    if (!resolvedGameId && primary_game_slug) {
      const { data: gameBySlug } = await db
        .from("games")
        .select("id")
        .eq("slug", primary_game_slug)
        .single();
      if (gameBySlug) resolvedGameId = gameBySlug.id;
    }

    if (!resolvedGameId && custom_game_name) {
      // Try to find existing game by name (case-insensitive)
      const { data: gameByName } = await db
        .from("games")
        .select("id")
        .ilike("name", custom_game_name)
        .single();

      if (gameByName) {
        resolvedGameId = gameByName.id;
      } else {
        // Create a new game entry for the custom game
        const customSlug = custom_game_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const { data: newGame } = await db
          .from("games")
          .insert({
            name: custom_game_name,
            slug: customSlug,
            // icon_url: "/images/games/other.png",
          } as never)
          .select("id")
          .single();

        if (newGame) resolvedGameId = newGame.id;
      }
    }

    if (!name || !tag) {
      return NextResponse.json(
        { error: "Name and tag are required" },
        { status: 400 }
      );
    }

    // Validate tag format (2-6 alphanumeric characters)
    if (!/^[A-Za-z0-9]{2,6}$/.test(tag)) {
      return NextResponse.json(
        { error: "Tag must be 2-6 alphanumeric characters" },
        { status: 400 }
      );
    }

    // Check if tag is unique
    const { data: existingClan } = await db
      .from("clans")
      .select("id")
      .eq("tag", tag.toUpperCase())
      .single();

    if (existingClan) {
      return NextResponse.json(
        { error: "Clan tag is already taken" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug is unique, append number if needed
    let finalSlug = slug;
    let slugCounter = 1;
    while (true) {
      const { data: existingSlug } = await db
        .from("clans")
        .select("id")
        .eq("slug", finalSlug)
        .single();

      if (!existingSlug) break;
      finalSlug = `${slug}-${slugCounter}`;
      slugCounter++;
    }

    // Try to create conversation for clan chat (optional — table may not exist)
    const adminClient = createAdminClient();
    let conversationId: string | null = null;

    try {
      const { data: conversationData, error: convError } = (await adminClient
        .from("conversations")
        .insert({
          type: "group",
          name: `${name} Chat`,
        } as any)
        .select()
        .single()) as { data: { id: string } | null; error: any };

      if (!convError && conversationData) {
        conversationId = conversationData.id;
      } else {
        console.warn("Skipping clan conversation (table may not exist):", convError?.message);
      }
    } catch (convErr) {
      console.warn("Skipping clan conversation:", convErr);
    }

    // Validate join_type if provided
    const validJoinTypes = ["open", "invite_only", "closed"];
    const clanJoinType = validJoinTypes.includes(join_type) ? join_type : "closed";

    // Create clan using admin client to bypass RLS issues
    const { data: clanData, error: clanError } = await adminClient
      .from("clans")
      .insert({
        name,
        tag: tag.toUpperCase(),
        slug: finalSlug,
        description: description || null,
        primary_game_id: resolvedGameId,
        region: region || null,
        language: language || "en",
        is_public: is_public !== false,
        join_type: clanJoinType,
        settings: {
          join_type: clanJoinType,
          join_approval_required: clanJoinType === "closed",
          allow_member_invites: clanJoinType !== "invite_only",
        },
        conversation_id: conversationId,
      } as never)
      .select()
      .single();

    if (clanError || !clanData) {
      console.error("Failed to create clan entry:", clanError);
      if (conversationId) {
        await adminClient.from("conversations").delete().eq("id", conversationId);
      }
      return NextResponse.json(
        { error: "Failed to create clan: " + (clanError?.message || "Unknown error") },
        { status: 500 }
      );
    }

    const clan = clanData as unknown as Clan;

    // Add creator as leader using admin client to avoid trigger issues
    // (handle_clan_member_join trigger references conversation_participants which may not exist)
    const { error: memberError } = await adminClient
      .from("clan_members")
      .insert({
        clan_id: clan.id,
        user_id: user.id,
        role: "leader",
      } as never);

    if (memberError) {
      console.error("Failed to add clan leader:", memberError);
      // Cleanup
      await adminClient.from("clans").delete().eq("id", clan.id);
      if (conversationId) {
        await adminClient.from("conversations").delete().eq("id", conversationId);
      }
      return NextResponse.json(
        { error: "Failed to add clan leader: " + (memberError?.message || "Unknown error") },
        { status: 500 }
      );
    }

    // Log clan creation (non-critical, ignore errors)
    await adminClient.from("clan_activity_log").insert({
      clan_id: clan.id,
      user_id: user.id,
      activity_type: "clan_created",
      description: "Clan was created",
    } as never).then(() => {}).catch(() => {});

    return NextResponse.json({ clan }, { status: 201 });
  } catch (error) {
    console.error("Clan creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
