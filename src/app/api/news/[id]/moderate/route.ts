import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PATCH - Moderate a news article (approve/reject/publish)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has admin/editor role
    const admin = createAdminClient();
    const { data: authorRole } = await admin
      .from("blog_authors")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!authorRole || !["admin", "editor"].includes(authorRole.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions. Admin or editor role required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, rejection_reason } = body as {
      action: "approve" | "reject" | "publish";
      rejection_reason?: string;
    };

    if (!["approve", "reject", "publish"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be approve, reject, or publish." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    let updateData: Record<string, unknown> = {
      moderated_by: user.id,
      moderated_at: now,
      updated_at: now,
    };

    switch (action) {
      case "approve":
        updateData.status = "approved";
        break;
      case "reject":
        updateData.status = "rejected";
        updateData.rejection_reason = rejection_reason || "Rejected by moderator";
        break;
      case "publish":
        updateData.status = "published";
        updateData.published_at = now;
        break;
    }

    const { data: updated, error: updateError } = await (admin as ReturnType<typeof createAdminClient>)
      .from("news_articles" as never)
      .update(updateData as never)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error moderating article:", updateError);
      return NextResponse.json(
        { error: "Failed to moderate article" },
        { status: 500 }
      );
    }

    return NextResponse.json({ article: updated });
  } catch (error) {
    console.error("Moderation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
