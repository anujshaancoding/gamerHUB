import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";
import { validateBody } from "@/lib/security/validate-body";

const httpUrl = z
  .string()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), { message: "must be http(s)" })
  .max(2048);

const FeedbackSchema = z.object({
  message: z.string().trim().min(1, "message is required").max(2000),
  category: z.enum(["bug", "feature", "general", "design"]).default("general"),
  image_url: httpUrl.nullish(),
  page_url: httpUrl.nullish(),
});

export async function POST(request: NextRequest) {
  try {
    const db = createClient();

    // Auth is optional — allow anonymous feedback too
    const user = await getUser();

    const parsed = await validateBody(request, FeedbackSchema);
    if (!parsed.ok) return parsed.response;
    const { message, category, image_url, page_url } = parsed.data;

    const { error: insertError } = await db
      .from("beta_feedback")
      .insert({
        user_id: user?.id ?? null,
        message,
        category,
        image_url: image_url ?? null,
        page_url: page_url ?? null,
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
