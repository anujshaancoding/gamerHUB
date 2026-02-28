import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Toggle bookmark on a friend post
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await db.rpc("toggle_friend_post_bookmark", {
      p_post_id: postId,
      p_user_id: user.id,
    });

    if (error) {
      console.error("Bookmark toggle error:", error);
      return NextResponse.json(
        { error: "Failed to toggle bookmark" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Bookmark POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Check if current user has bookmarked a friend post
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ bookmarked: false });
    }

    const { data } = await db
      .from("friend_post_bookmarks")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({ bookmarked: !!data });
  } catch {
    return NextResponse.json({ bookmarked: false });
  }
}
