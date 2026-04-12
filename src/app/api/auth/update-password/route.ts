import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

// Password validation: min 8 chars, at least one letter and one number
function validatePassword(password: string): string | null {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/[a-zA-Z]/.test(password)) {
    return "Password must contain at least one letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}

// POST - Update password (authenticated user or via reset token)
export async function POST(request: NextRequest) {
  try {
    const { password, currentPassword, token } = await request.json();

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
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
      // Authenticated password change — require current password
      const user = await getUser();
      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      userId = user.id;

      // Verify current password before allowing change
      if (!currentPassword || typeof currentPassword !== "string") {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }

      const { data: credentials } = await db
        .from("user_credentials")
        .select("password_hash")
        .eq("user_id", userId)
        .single();

      if (!credentials?.password_hash) {
        return NextResponse.json(
          { error: "No password set for this account" },
          { status: 400 }
        );
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, credentials.password_hash);
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }
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
    logger.error("Update password error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
