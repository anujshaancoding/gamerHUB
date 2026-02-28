import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ clanId: string }>;
}

// GET - List wall posts
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId } = await params;
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch pinned posts first, then recent posts
    const { data, error, count } = await db
      .from("clan_wall_posts")
      .select(
        `
        *,
        profile:profiles(id, username, display_name, avatar_url, is_premium)
      `,
        { count: "exact" }
      )
      .eq("clan_id", clanId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching wall posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch wall posts" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      posts: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Wall posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create wall post
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check membership
    const { data: membership } = await db
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "You must be a clan member to post" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, image_url } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.length > 280) {
      return NextResponse.json(
        { error: "Content must be 280 characters or less" },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("clan_wall_posts")
      .insert({
        clan_id: clanId,
        user_id: user.id,
        content: content.trim(),
        image_url: image_url || null,
      } as never)
      .select(
        `
        *,
        profile:profiles(id, username, display_name, avatar_url, is_premium)
      `
      )
      .single();

    if (error) {
      console.error("Failed to create wall post:", error);
      return NextResponse.json(
        { error: "Failed to create post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (error) {
    console.error("Create wall post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
