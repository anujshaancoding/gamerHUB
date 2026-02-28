import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { validateNintendoFriendCode, formatNintendoFriendCode } from "@/types/console";
import { getUser } from "@/lib/auth/get-user";

// GET - Get Nintendo connection status
export async function GET() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: connection } = await db
      .from("console_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "nintendo")
      .single();

    return NextResponse.json({
      method: "manual",
      instructions: "Nintendo requires manual Friend Code entry",
      connected: !!connection,
      connection,
    });
  } catch (error) {
    console.error("Nintendo status error:", error);
    return NextResponse.json(
      { error: "Failed to get Nintendo status" },
      { status: 500 }
    );
  }
}

// POST - Connect Nintendo with Friend Code
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { friend_code, nickname } = await request.json();

    if (!friend_code) {
      return NextResponse.json(
        { error: "Friend Code is required" },
        { status: 400 }
      );
    }

    // Format and validate the friend code
    const formattedCode = formatNintendoFriendCode(friend_code);

    if (!validateNintendoFriendCode(formattedCode)) {
      return NextResponse.json(
        { error: "Invalid Friend Code format. Use SW-XXXX-XXXX-XXXX" },
        { status: 400 }
      );
    }

    // Check if Friend Code is already linked to another account
    const { data: existingConnection } = await db
      .from("console_connections")
      .select("user_id")
      .eq("platform", "nintendo")
      .eq("online_id", formattedCode)
      .neq("user_id", user.id)
      .single();

    if (existingConnection) {
      return NextResponse.json(
        { error: "This Friend Code is already linked to another account" },
        { status: 400 }
      );
    }

    // Upsert the connection
    const { data, error } = await db
      .from("console_connections")
      .upsert({
        user_id: user.id,
        platform: "nintendo",
        platform_user_id: formattedCode.replace(/[^0-9]/g, ""), // Just the digits
        platform_username: nickname?.trim() || null,
        online_id: formattedCode,
        is_verified: false, // Nintendo has no verification method
        verification_method: "manual",
        is_active: true,
        connected_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,platform",
      })
      .select()
      .single();

    if (error) {
      console.error("Nintendo connection error:", error);
      return NextResponse.json(
        { error: "Failed to connect Nintendo account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connection: data,
    });
  } catch (error) {
    console.error("Nintendo connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect Nintendo account" },
      { status: 500 }
    );
  }
}

// PATCH - Update Nintendo username/nickname
export async function PATCH(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { nickname } = await request.json();

    const { data, error } = await db
      .from("console_connections")
      .update({
        platform_username: nickname?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("platform", "nintendo")
      .select()
      .single();

    if (error) {
      console.error("Nintendo update error:", error);
      return NextResponse.json(
        { error: "Failed to update Nintendo nickname" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connection: data,
    });
  } catch (error) {
    console.error("Nintendo update error:", error);
    return NextResponse.json(
      { error: "Failed to update Nintendo nickname" },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect Nintendo
export async function DELETE() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await db
      .from("console_connections")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", "nintendo");

    if (error) {
      console.error("Nintendo disconnect error:", error);
      return NextResponse.json(
        { error: "Failed to disconnect Nintendo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Nintendo disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Nintendo" },
      { status: 500 }
    );
  }
}
