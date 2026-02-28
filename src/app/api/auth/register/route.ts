/**
 * Custom registration endpoint for email/password signups.
 * Creates a user record + profile, then the client calls signIn("credentials").
 */

import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getPool } from "@/lib/db/index";

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Email, password, and username are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const sql = getPool();

    // Check if email already exists
    const existingEmail = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;
    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUsername = await sql`
      SELECT id FROM profiles WHERE username = ${username}
    `;
    if (existingUsername.length > 0) {
      return NextResponse.json(
        { error: "This username is already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user + profile in a transaction
    const userId = crypto.randomUUID();

    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO users (id, email, password_hash, email_confirmed_at, provider)
        VALUES (${userId}, ${email}, ${passwordHash}, NOW(), 'email')
      `;

      await tx`
        INSERT INTO profiles (id, username, display_name)
        VALUES (${userId}, ${username}, ${username})
      `;
    });

    return NextResponse.json(
      { message: "Account created successfully", userId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
