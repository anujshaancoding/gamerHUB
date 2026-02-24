import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Single article fetch by ID
    const singleId = searchParams.get("id");
    if (singleId) {
      const { data: article, error: singleError } = await admin
        .from("news_articles")
        .select(
          `
          id, title, original_title, original_url, original_content, summary, excerpt,
          thumbnail_url, game_slug, category, region, tags,
          status, views_count, is_featured, is_pinned,
          published_at, created_at, updated_at,
          ai_relevance_score, ai_processed, source_id,
          source:news_sources(id, name, slug)
        `
        )
        .eq("id", singleId)
        .single();

      if (singleError) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }
      return NextResponse.json({ article });
    }

    const status = searchParams.get("status");
    const game = searchParams.get("game");
    const category = searchParams.get("category");
    const region = searchParams.get("region");
    const search = searchParams.get("search");
    const type = searchParams.get("type"); // "manual" or "fetched"
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = admin
      .from("news_articles")
      .select(
        `
        id, title, original_title, original_url, original_content, summary, excerpt,
        thumbnail_url, game_slug, category, region, tags,
        status, views_count, is_featured, is_pinned,
        published_at, created_at, updated_at,
        ai_relevance_score, ai_processed, source_id,
        source:news_sources(id, name, slug)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }
    if (game) {
      query = query.eq("game_slug", game);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (region) {
      query = query.eq("region", region);
    }
    if (type === "manual") {
      // "Our News" = manually created articles + any published/approved articles (even from fetched sources)
      query = query.or("source_id.is.null,status.eq.published,status.eq.approved");
    } else if (type === "fetched") {
      // "Fetched News" = fetched articles that are still pending/rejected (not yet published)
      query = query.not("source_id", "is", null).in("status", ["pending", "rejected"]);
    }
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,original_title.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Admin news list error:", error);
      return NextResponse.json(
        { error: "Failed to fetch news articles" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      articles: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Admin news error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      summary,
      excerpt,
      thumbnail_url,
      game_slug,
      category,
      region,
      tags,
      original_url,
      is_featured,
      is_pinned,
      status: articleStatus,
    } = body;

    if (!title?.trim() || !game_slug) {
      return NextResponse.json(
        { error: "Title and game are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const finalStatus = articleStatus || "published";

    const { data, error } = await admin
      .from("news_articles")
      .insert({
        title: title.trim(),
        original_title: title.trim(),
        original_url: original_url?.trim() || "",
        summary: summary?.trim() || null,
        excerpt: excerpt?.trim() || null,
        thumbnail_url: thumbnail_url?.trim() || null,
        game_slug,
        category: category || "general",
        region: region || "india",
        tags: tags || [],
        status: finalStatus,
        published_at: finalStatus === "published" ? now : null,
        moderated_by: user.id,
        moderated_at: now,
        ai_processed: true,
        ai_relevance_score: 1,
      })
      .select()
      .single();

    if (error) {
      console.error("Admin news create error:", error);
      return NextResponse.json(
        { error: "Failed to create news article" },
        { status: 500 }
      );
    }

    return NextResponse.json({ article: data }, { status: 201 });
  } catch (error) {
    console.error("Admin news create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Handle status transitions
    if (updates.status === "published" && !updates.published_at) {
      updates.published_at = now;
    }
    if (updates.status === "approved" || updates.status === "rejected" || updates.status === "published") {
      updates.moderated_by = user.id;
      updates.moderated_at = now;
    }

    const { data, error } = await admin
      .from("news_articles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Admin news update error:", error);
      return NextResponse.json(
        { error: "Failed to update news article" },
        { status: 500 }
      );
    }

    return NextResponse.json({ article: data });
  } catch (error) {
    console.error("Admin news update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("news_articles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Admin news delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete news article" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin news delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
