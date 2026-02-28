import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Apply to join an LFG post
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if post exists and is active
    const { data: post, error: postError } = await db
      .from("lfg_posts")
      .select("id, creator_id, status, current_players, max_players, expires_at")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "LFG post not found" },
        { status: 404 }
      );
    }

    // Validate post is active
    if (post.status !== "active") {
      return NextResponse.json(
        { error: "This post is no longer active" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(post.expires_at) <= new Date()) {
      return NextResponse.json(
        { error: "This post has expired" },
        { status: 400 }
      );
    }

    // Check if full
    if (post.current_players >= post.max_players) {
      return NextResponse.json(
        { error: "This post is already full" },
        { status: 400 }
      );
    }

    // Can't apply to own post
    if (post.creator_id === user.id) {
      return NextResponse.json(
        { error: "You cannot apply to your own post" },
        { status: 400 }
      );
    }

    // Check for existing application
    const { data: existingApp } = await db
      .from("lfg_applications")
      .select("id, status")
      .eq("post_id", postId)
      .eq("applicant_id", user.id)
      .single();

    if (existingApp) {
      return NextResponse.json(
        { error: `You have already applied to this post (${existingApp.status})` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { applicant_role, applicant_rating, applicant_is_unranked, message } = body;

    // Create application
    const { data: application, error: appError } = await db
      .from("lfg_applications")
      .insert({
        post_id: postId,
        applicant_id: user.id,
        applicant_role: applicant_role || null,
        applicant_rating: applicant_rating || null,
        applicant_is_unranked: applicant_is_unranked || false,
        message: message?.trim() || null,
      } as never)
      .select(
        `
        *,
        applicant:profiles!lfg_applications_applicant_id_fkey(
          id, username, display_name, avatar_url
        )
      `
      )
      .single();

    if (appError) {
      console.error("Error creating application:", appError);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("LFG apply error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Withdraw application
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: deleteError } = await db
      .from("lfg_applications")
      .delete()
      .eq("post_id", postId)
      .eq("applicant_id", user.id)
      .eq("status", "pending");

    if (deleteError) {
      console.error("Error withdrawing application:", deleteError);
      return NextResponse.json(
        { error: "Failed to withdraw application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("LFG withdraw error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
