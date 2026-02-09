import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CreateGuideRequest } from "@/types/community";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100);
}

// GET - List guides
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const gameId = searchParams.get("game_id");
    const gameSlug = searchParams.get("game");
    const guideType = searchParams.get("type");
    const authorId = searchParams.get("author_id");
    const featured = searchParams.get("featured") === "true";
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("guides")
      .select(`
        *,
        author:profiles!guides_author_id_fkey(id, username, avatar_url),
        game:games(id, slug, name, icon_url)
      `, { count: "exact" })
      .eq("is_published", true);

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    if (gameSlug) {
      query = query.eq("game.slug", gameSlug);
    }

    if (guideType) {
      query = query.eq("guide_type", guideType);
    }

    if (authorId) {
      query = query.eq("author_id", authorId);
    }

    if (featured) {
      query = query.eq("is_featured", true);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    query = query
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: guides, error, count } = await query;

    if (error) {
      console.error("Fetch guides error:", error);
      return NextResponse.json(
        { error: "Failed to fetch guides" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      guides,
      total: count,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error("Fetch guides error:", error);
    return NextResponse.json(
      { error: "Failed to fetch guides" },
      { status: 500 }
    );
  }
}

// POST - Create a new guide
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateGuideRequest = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!body.sections || body.sections.length === 0) {
      return NextResponse.json(
        { error: "At least one section is required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(body.title);
    let attempts = 0;

    while (attempts < 5) {
      const { data: existingSlug } = await supabase
        .from("guides")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existingSlug) break;

      slug = `${generateSlug(body.title)}-${Date.now().toString(36)}`;
      attempts++;
    }

    // Calculate estimated read time (rough: 200 words per minute)
    const totalWords = body.sections.reduce((sum, section) => {
      return sum + (section.content?.split(/\s+/).length || 0);
    }, 0);
    const estimatedReadMinutes = Math.max(1, Math.ceil(totalWords / 200));

    // Create the guide
    const { data: guide, error: guideError } = await supabase
      .from("guides")
      .insert({
        author_id: user.id,
        game_id: body.game_id || null,
        title: body.title.trim(),
        slug,
        excerpt: body.excerpt?.trim() || null,
        cover_image_url: body.cover_image_url || null,
        guide_type: body.guide_type || "other",
        difficulty: body.difficulty || "beginner",
        tags: body.tags || [],
        estimated_read_minutes: estimatedReadMinutes,
        is_published: body.is_published ?? false,
        published_at: body.is_published ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (guideError) {
      console.error("Create guide error:", guideError);
      return NextResponse.json(
        { error: "Failed to create guide" },
        { status: 500 }
      );
    }

    // Create sections
    const sectionsToInsert = body.sections.map((section, index) => ({
      guide_id: guide.id,
      section_order: index,
      title: section.title?.trim() || null,
      content: section.content,
      content_type: section.content_type || "text",
      media_url: section.media_url || null,
    }));

    const { error: sectionsError } = await supabase
      .from("guide_sections")
      .insert(sectionsToInsert);

    if (sectionsError) {
      console.error("Create sections error:", sectionsError);
      // Clean up the guide if sections fail
      await supabase.from("guides").delete().eq("id", guide.id);
      return NextResponse.json(
        { error: "Failed to create guide sections" },
        { status: 500 }
      );
    }

    // Fetch complete guide
    const { data: fullGuide } = await supabase
      .from("guides")
      .select(`
        *,
        author:profiles!guides_author_id_fkey(id, username, avatar_url),
        game:games(id, slug, name, icon_url),
        sections:guide_sections(*)
      `)
      .eq("id", guide.id)
      .order("section_order", { referencedTable: "guide_sections" })
      .single();

    return NextResponse.json({
      success: true,
      guide: fullGuide,
    });
  } catch (error) {
    console.error("Create guide error:", error);
    return NextResponse.json(
      { error: "Failed to create guide" },
      { status: 500 }
    );
  }
}
