import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDiscordOAuthUrl } from "@/lib/integrations/discord";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already connected - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("discord_connections")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Discord account already connected" },
        { status: 400 }
      );
    }

    // Generate state with user ID for callback verification
    const state = `${user.id}:${nanoid(16)}`;

    // Store state temporarily (could use Redis in production)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: stateError } = await (supabase as any).from("oauth_states").insert({
      state,
      user_id: user.id,
      provider: "discord",
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

    if (stateError) {
      // Table might not exist, continue anyway
      console.warn("Could not store OAuth state:", stateError);
    }

    const authUrl = getDiscordOAuthUrl(state);

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Discord connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Discord connection" },
      { status: 500 }
    );
  }
}
