import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ id: string; appId: string }>;
}

// PATCH - Accept or decline application
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId, appId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns the post
    const { data: post, error: postError } = await db
      .from("lfg_posts")
      .select("id, creator_id, status, current_players, max_players")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "LFG post not found" },
        { status: 404 }
      );
    }

    if (post.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to manage applications for this post" },
        { status: 403 }
      );
    }

    // Get the application
    const { data: application } = await db
      .from("lfg_applications")
      .select("id, status")
      .eq("id", appId)
      .eq("post_id", postId)
      .single();

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "Application has already been processed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!["accepted", "declined"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'accepted' or 'declined'" },
        { status: 400 }
      );
    }

    // If accepting, check if there's room
    if (status === "accepted" && post.current_players >= post.max_players) {
      return NextResponse.json(
        { error: "Post is already full" },
        { status: 400 }
      );
    }

    // Update application
    const { data: updatedApp, error: updateError } = await db
      .from("lfg_applications")
      .update({
        status,
        responded_at: new Date().toISOString(),
      } as never)
      .eq("id", appId)
      .select(
        `
        *,
        applicant:profiles!lfg_applications_applicant_id_fkey(
          id, username, display_name, avatar_url
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 }
      );
    }

    // Note: The trigger in the database will handle updating current_players count

    return NextResponse.json({ application: updatedApp });
  } catch (error) {
    console.error("LFG application update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
