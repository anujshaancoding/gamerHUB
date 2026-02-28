import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// GET - Get current user's blog posts (all statuses)
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .from("blog_posts")
      .select(
        `
        *,
        game:games!blog_posts_game_id_fkey(
          id, slug, name, icon_url
        )
      `,
        { count: "exact" }
      )
      .eq("author_id", user.id)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching user posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: 500 }
      );
    }

    // Get author info
    const { data: author } = await db
      .from("blog_authors")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      posts: data || [],
      total: count || 0,
      author,
    });
  } catch (error) {
    console.error("My posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
