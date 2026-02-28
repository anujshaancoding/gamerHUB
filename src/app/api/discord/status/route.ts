import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

export async function GET() {
  try {
    const db = createClient();

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Discord connection - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connection, error } = await (db as any)
      .from("discord_connections")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !connection) {
      return NextResponse.json(null, { status: 404 });
    }

    // Don't expose sensitive tokens
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = connection as any;
    const safeConnection = {
      id: conn.id,
      discord_user_id: conn.discord_user_id,
      discord_username: conn.discord_username,
      discord_discriminator: conn.discord_discriminator,
      discord_avatar: conn.discord_avatar,
      is_active: conn.is_active,
      connected_at: conn.connected_at,
      last_synced_at: conn.last_synced_at,
      guilds: conn.guilds,
    };

    return NextResponse.json(safeConnection);
  } catch (error) {
    console.error("Discord status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
