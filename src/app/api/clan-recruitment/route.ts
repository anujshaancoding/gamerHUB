import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { ClanMember } from "@/types/database";
import { getUser } from "@/lib/auth/get-user";

// GET - List recruitment posts
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const gameId = searchParams.get("game_id");
    const region = searchParams.get("region");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .from("clan_recruitment_posts")
      .select(
        `
        *,
        clan:clans(
          id, name, tag, slug, avatar_url, region, language,
          clan_members(count)
        ),
        game:games(*),
        created_by_profile:profiles!clan_recruitment_posts_created_by_fkey(*)
      `,
        { count: "exact" }
      )
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    if (region) {
      query = query.eq("clan.region", region);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching recruitment posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch recruitment posts" },
        { status: 500 }
      );
    }

    // Transform to include member count
    const posts = (data || []).map((post: any) => ({
      ...post,
      clan: post.clan
        ? {
            ...post.clan,
            member_count: post.clan.clan_members?.[0]?.count || 0,
          }
        : null,
    }));

    return NextResponse.json({
      posts,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Recruitment posts list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create recruitment post
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      clan_id,
      game_id,
      title,
      description,
      requirements,
      positions_available,
      expires_at,
    } = body;

    if (!clan_id || !title || !description) {
      return NextResponse.json(
        { error: "clan_id, title, and description are required" },
        { status: 400 }
      );
    }

    // Check if user is an officer in the clan
    const { data: membership } = await db
      .from("clan_members")
      .select("role")
      .eq("clan_id", clan_id)
      .eq("user_id", user.id)
      .single();

    const member = membership as unknown as Pick<ClanMember, "role"> | null;

    if (!member || !["leader", "co_leader", "officer"].includes(member.role)) {
      return NextResponse.json(
        { error: "Only clan officers can create recruitment posts" },
        { status: 403 }
      );
    }

    // Check if clan is recruiting
    const { data: clanData } = await db
      .from("clans")
      .select("is_recruiting")
      .eq("id", clan_id)
      .single();

    const clan = clanData as { is_recruiting: boolean } | null;
    if (!clan?.is_recruiting) {
      return NextResponse.json(
        { error: "Clan is not currently recruiting" },
        { status: 400 }
      );
    }

    // Create recruitment post
    const { data, error } = await db
      .from("clan_recruitment_posts")
      .insert({
        clan_id,
        created_by: user.id,
        game_id: game_id || null,
        title,
        description,
        requirements: requirements || {},
        positions_available: positions_available || 1,
        expires_at: expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as never)
      .select(
        `
        *,
        clan:clans(id, name, tag, slug, avatar_url),
        game:games(*),
        created_by_profile:profiles!clan_recruitment_posts_created_by_fkey(*)
      `
      )
      .single();

    if (error) {
      console.error("Failed to create recruitment post:", error);
      return NextResponse.json(
        { error: "Failed to create recruitment post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (error) {
    console.error("Create recruitment post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
