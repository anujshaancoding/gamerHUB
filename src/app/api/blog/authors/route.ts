import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// GET - List blog authors
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const verified = searchParams.get("verified") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .from("blog_authors")
      .select(
        `
        *,
        profile:profiles!blog_authors_user_id_fkey(
          id, username, display_name, avatar_url
        )
      `,
        { count: "exact" }
      )
      .order("articles_count", { ascending: false })
      .range(offset, offset + limit - 1);

    if (verified) {
      query = query.eq("is_verified", true);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching authors:", error);
      return NextResponse.json(
        { error: "Failed to fetch authors" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authors: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error("Authors list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Apply to become a blog author
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already an author
    const { data: existingAuthor } = await db
      .from("blog_authors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingAuthor) {
      return NextResponse.json(
        { error: "You are already a blog author" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { bio } = body;

    // Create author entry (as contributor by default)
    const { data: author, error: authorError } = await db
      .from("blog_authors")
      .insert({
        user_id: user.id,
        bio: bio?.trim() || null,
        role: "contributor",
        can_publish_directly: false,
        is_verified: false,
      } as never)
      .select(
        `
        *,
        profile:profiles!blog_authors_user_id_fkey(
          id, username, display_name, avatar_url
        )
      `
      )
      .single();

    if (authorError) {
      console.error("Error creating author:", authorError);
      return NextResponse.json(
        { error: "Failed to create author profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ author }, { status: 201 });
  } catch (error) {
    console.error("Author creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
