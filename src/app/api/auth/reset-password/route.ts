import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import crypto from "crypto";

// POST - Send password reset email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const db = createClient();

    // Find user by email
    const { data: user } = await db
      .from("users")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single();

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store reset token
    await db.from("password_reset_tokens").upsert(
      {
        user_id: user.id,
        token,
        expires_at: expiresAt,
      } as never,
      { onConflict: "user_id" }
    );

    // TODO: Send email with reset link
    // For now, log the link (in production, use an email service like Resend/SendGrid)
    const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/update-password?token=${token}`;
    console.log(`Password reset link for ${email}: ${resetUrl}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
