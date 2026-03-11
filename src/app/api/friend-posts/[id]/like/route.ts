import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Toggle like on a friend post (atomic via DB function)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the atomic toggle function
    const { data, error } = await db.rpc("toggle_friend_post_like", {
      p_post_id: postId,
      p_user_id: user.id,
    });

    if (error) {
      console.error("Friend post like error:", error);
      return NextResponse.json(
        { error: "Failed to toggle like" },
        { status: 500 }
      );
    }

    // Send notification to post owner when liked (not when unliked, not to self)
    if ((data as any)?.liked) {
      try {
        const admin = createAdminClient();
        const { data: post } = await admin
          .from("friend_posts")
          .select("user_id")
          .eq("id", postId)
          .single();

        if (post && post.user_id !== user.id) {
          // Get liker's display name
          const { data: profile } = await admin
            .from("profiles")
            .select("display_name, username")
            .eq("id", user.id)
            .single();

          const likerName = profile?.display_name || profile?.username || "Someone";

          await admin.from("notifications").insert({
            user_id: post.user_id,
            type: "post_like",
            title: `${likerName} liked your post`,
            icon: "❤️",
            action_url: `/community?post=${postId}`,
            action_label: "View post",
            metadata: { post_id: postId, liker_id: user.id },
            is_read: false,
            is_archived: false,
          });
        }
      } catch (notifError) {
        // Don't fail the like if notification fails
        console.error("Failed to create like notification:", notifError);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Friend post like error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Check if current user has liked a friend post
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ liked: false });
    }

    const { data } = await db
      .from("friend_post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({ liked: !!data });
  } catch {
    return NextResponse.json({ liked: false });
  }
}
