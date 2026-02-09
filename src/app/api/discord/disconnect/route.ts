import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing connection - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connectionData } = await (supabase as any)
      .from("discord_connections")
      .select("id, access_token")
      .eq("user_id", user.id)
      .single();

    const connection = connectionData as { id: string; access_token: string | null } | null;

    if (!connection) {
      return NextResponse.json(
        { error: "No Discord connection found" },
        { status: 404 }
      );
    }

    // Optionally revoke the Discord token
    if (connection.access_token) {
      try {
        await fetch("https://discord.com/api/oauth2/token/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID!,
            client_secret: process.env.DISCORD_CLIENT_SECRET!,
            token: connection.access_token,
          }),
        });
      } catch (revokeError) {
        // Log but don't fail if revoke fails
        console.error("Failed to revoke Discord token:", revokeError);
      }
    }

    // Delete the connection - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from("discord_connections")
      .delete()
      .eq("id", connection.id);

    if (deleteError) {
      console.error("Failed to delete Discord connection:", deleteError);
      return NextResponse.json(
        { error: "Failed to disconnect Discord" },
        { status: 500 }
      );
    }

    // Also update notification preferences to remove discord channel - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("notification_preferences")
      .delete()
      .eq("user_id", user.id)
      .eq("channel", "discord");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Discord disconnect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
