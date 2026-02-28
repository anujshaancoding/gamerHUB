import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

export async function POST(request: NextRequest) {
  try {
    const db = createClient();

    // Auth is optional — allow anonymous feedback too
    const user = await getUser();

    const body = await request.json();
    const { message, category, image_url, page_url } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Feedback message is required" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Feedback must be under 2000 characters" },
        { status: 400 }
      );
    }

    const validCategories = ["bug", "feature", "general", "design"];
    const safeCategory = validCategories.includes(category) ? category : "general";

    const { error: insertError } = await db
      .from("beta_feedback")
      .insert({
        user_id: user?.id ?? null,
        message: message.trim(),
        category: safeCategory,
        image_url: image_url || null,
        page_url: page_url || null,
        user_agent: request.headers.get("user-agent") || null,
      });

    if (insertError) {
      console.error("Error saving feedback:", insertError);
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
