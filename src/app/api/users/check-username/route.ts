import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

// GET - Check if a username is available
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.trim().toLowerCase();

    if (!username) {
      return NextResponse.json(
        { available: false, message: "Username is required" },
        { status: 400 }
      );
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({
        available: false,
        message:
          "Username must be 3-20 characters, start with a letter, and contain only letters, numbers, and underscores",
      });
    }

    const db = createClient();

    const { data, error } = await db
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error("Username check error:", error);
      return NextResponse.json(
        { available: false, message: "Failed to check username" },
        { status: 500 }
      );
    }

    // Optionally exclude the current user (for settings page username changes)
    const excludeUserId = searchParams.get("exclude");
    if (data && excludeUserId && data.id === excludeUserId) {
      return NextResponse.json({ available: true, message: "This is your current username" });
    }

    return NextResponse.json({
      available: !data,
      message: data ? "Username is already taken" : "Username is available",
    });
  } catch (error) {
    console.error("Username check error:", error);
    return NextResponse.json(
      { available: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
