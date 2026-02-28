import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import {
import { getUser } from "@/lib/auth/get-user";
  exchangeDiscordCode,
  getDiscordUser,
  getDiscordGuilds,
  getDiscordAvatarUrl,
  DISCORD_SCOPES,
} from "@/lib/integrations/discord";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUrl = `${baseUrl}/settings/connections`;

  // Handle OAuth errors
  if (error) {
    console.error("Discord OAuth error:", error);
    return NextResponse.redirect(
      `${redirectUrl}?error=discord_auth_failed&message=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${redirectUrl}?error=missing_params`
    );
  }

  try {
    const db = createClient();

    // Verify user is authenticated
    const user = await getUser();

    if (!user) {
      return NextResponse.redirect(
        `${redirectUrl}?error=unauthorized`
      );
    }

    // Verify state (extract user ID from state)
    const [stateUserId] = state.split(":");
    if (stateUserId !== user.id) {
      return NextResponse.redirect(
        `${redirectUrl}?error=invalid_state`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeDiscordCode(code);

    // Get Discord user info
    const discordUser = await getDiscordUser(tokens.access_token);

    // Get user's guilds
    const guilds = await getDiscordGuilds(tokens.access_token);

    // Check if this Discord account is already linked to another user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingConnectionData } = await (db as any)
      .from("discord_connections")
      .select("user_id")
      .eq("discord_user_id", discordUser.id)
      .single();

    const existingConnection = existingConnectionData as { user_id: string } | null;

    if (existingConnection && existingConnection.user_id !== user.id) {
      return NextResponse.redirect(
        `${redirectUrl}?error=discord_already_linked`
      );
    }

    // Upsert Discord connection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (db as any)
      .from("discord_connections")
      .upsert({
        user_id: user.id,
        discord_user_id: discordUser.id,
        discord_username: discordUser.global_name || discordUser.username,
        discord_discriminator: discordUser.discriminator,
        discord_avatar: discordUser.avatar,
        discord_email: discordUser.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
        scopes: DISCORD_SCOPES,
        guilds: guilds.map((g) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          owner: g.owner,
        })),
        is_active: true,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (upsertError) {
      console.error("Failed to save Discord connection:", upsertError);
      return NextResponse.redirect(
        `${redirectUrl}?error=save_failed`
      );
    }

    // Clean up OAuth state if stored
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from("oauth_states")
      .delete()
      .eq("state", state)
      .eq("user_id", user.id);

    return NextResponse.redirect(
      `${redirectUrl}?success=discord_connected&username=${encodeURIComponent(discordUser.global_name || discordUser.username)}`
    );
  } catch (error) {
    console.error("Discord callback error:", error);
    return NextResponse.redirect(
      `${redirectUrl}?error=callback_failed`
    );
  }
}
