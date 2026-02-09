import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Like/unlike a meme
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memeId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the meme
    const { data: meme, error: memeError } = await supabase
      .from("memes")
      .select("id, like_count")
      .eq("id", memeId)
      .single();

    if (memeError || !meme) {
      return NextResponse.json({ error: "Meme not found" }, { status: 404 });
    }

    // Check existing like
    const { data: existingLike } = await supabase
      .from("meme_likes")
      .select("id")
      .eq("meme_id", memeId)
      .eq("user_id", user.id)
      .single();

    if (existingLike) {
      // Unlike
      await supabase.from("meme_likes").delete().eq("id", existingLike.id);

      await supabase
        .from("memes")
        .update({ like_count: Math.max(0, meme.like_count - 1) })
        .eq("id", memeId);

      return NextResponse.json({
        success: true,
        liked: false,
        like_count: Math.max(0, meme.like_count - 1),
      });
    } else {
      // Like
      await supabase.from("meme_likes").insert({
        meme_id: memeId,
        user_id: user.id,
      });

      await supabase
        .from("memes")
        .update({ like_count: meme.like_count + 1 })
        .eq("id", memeId);

      return NextResponse.json({
        success: true,
        liked: true,
        like_count: meme.like_count + 1,
      });
    }
  } catch (error) {
    console.error("Like meme error:", error);
    return NextResponse.json(
      { error: "Failed to like meme" },
      { status: 500 }
    );
  }
}
