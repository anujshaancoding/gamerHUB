import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";

export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

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
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data, error, count } = await admin
      .from("blog_authors")
      .select(
        `
        *,
        user:profiles!blog_authors_user_id_fkey(
          id, username, display_name, avatar_url
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Admin blog authors list error:", error);
      return NextResponse.json(
        { error: "Failed to fetch blog authors" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authors: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Admin blog authors error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

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
    const { author_id, updates } = body;

    if (!author_id || !updates) {
      return NextResponse.json(
        { error: "author_id and updates are required" },
        { status: 400 }
      );
    }

    const allowedFields = [
      "role",
      "can_publish_directly",
      "is_verified",
      "bio",
    ];
    const safeUpdates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    safeUpdates.updated_at = new Date().toISOString();

    const { data, error } = await admin
      .from("blog_authors")
      .update(safeUpdates)
      .eq("id", author_id)
      .select(
        `
        *,
        user:profiles!blog_authors_user_id_fkey(
          id, username, display_name, avatar_url
        )
      `
      )
      .single();

    if (error) {
      console.error("Admin blog author update error:", error);
      return NextResponse.json(
        { error: "Failed to update blog author" },
        { status: 500 }
      );
    }

    return NextResponse.json({ author: data });
  } catch (error) {
    console.error("Admin blog author patch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
