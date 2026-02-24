import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Toggle bookmark on a friend post
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("toggle_friend_post_bookmark", {
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ bookmarked: false });
    }

    const { data } = await supabase
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
