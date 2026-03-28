import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { createRateLimiter, getClientIdentifier } from "@/lib/security/rate-limit";

// 5 subscribe attempts per 10 minutes per IP
const subscribeLimiter = createRateLimiter({ windowMs: 10 * 60_000, maxRequests: 5 });

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    const rl = subscribeLimiter(clientId);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    // Try to insert — if the table doesn't exist, fall back to feedback table
    try {
      const { error } = await db
        .from("newsletter_subscribers")
        .upsert(
          {
            email: email.toLowerCase().trim(),
            subscribed_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );

      if (error) throw error;
    } catch {
      // Fallback: store as feedback if newsletter table doesn't exist
      await db.from("feedback").insert({
        message: `[NEWSLETTER] ${email.toLowerCase().trim()}`,
        category: "general",
        page_url: "/newsletter",
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
