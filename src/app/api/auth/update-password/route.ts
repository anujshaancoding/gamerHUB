import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";
import bcrypt from "bcryptjs";

// POST - Update password (authenticated user or via reset token)
export async function POST(request: NextRequest) {
  try {
    const { password, token } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = createClient();
    let userId: string;

    if (token) {
      // Reset via token
      const { data: resetToken } = await db
        .from("password_reset_tokens")
        .select("user_id, expires_at")
        .eq("token", token)
        .single();

      if (!resetToken) {
        return NextResponse.json(
          { error: "Invalid or expired reset link" },
          { status: 400 }
        );
      }

      if (new Date(resetToken.expires_at) < new Date()) {
        // Clean up expired token
        await db.from("password_reset_tokens").delete().eq("token", token);
        return NextResponse.json(
          { error: "Reset link has expired. Please request a new one." },
          { status: 400 }
        );
      }

      userId = resetToken.user_id;

      // Delete used token
      await db.from("password_reset_tokens").delete().eq("token", token);
    } else {
      // Authenticated password change
      const user = await getUser();
      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      userId = user.id;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password in user_credentials
    await db
      .from("user_credentials")
      .upsert(
        {
          user_id: userId,
          password_hash: hashedPassword,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "user_id" }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
