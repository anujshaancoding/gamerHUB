import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeDiscordCode,
  getDiscordUser,
  getDiscordGuilds,
  getDiscordAvatarUrl,
} from "@/lib/integrations/discord";

// GET - Handle Discord OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Check for OAuth errors
    if (error) {
      console.error("Discord OAuth error:", error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=discord_denied`
      );
    }

    // Validate code and state
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=invalid_request`
      );
    }

    // Verify state token
    const storedState = request.cookies.get("discord_oauth_state")?.value;
    const userId = request.cookies.get("discord_oauth_user")?.value;

    if (!storedState || storedState !== state || !userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=invalid_state`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeDiscordCode(code);

    // Get Discord user info
    const discordUser = await getDiscordUser(tokens.access_token);
    const discordGuilds = await getDiscordGuilds(tokens.access_token);

    // Format guilds for storage
    const guildsData = discordGuilds.slice(0, 50).map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon || null,
      owner: guild.owner,
      permissions: guild.permissions,
    }));

    // Store in database
    const supabase = await createClient();

    // Check if Discord account is already connected to another user
    const { data: existingConnection } = await supabase
      .from("discord_settings")
      .select("user_id")
      .eq("discord_user_id", discordUser.id)
      .neq("user_id", userId)
      .single();

    if (existingConnection) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=discord_already_linked`
      );
    }

    // Upsert Discord settings
    const { error: upsertError } = await supabase
      .from("discord_settings")
      .upsert({
        user_id: userId,
        discord_user_id: discordUser.id,
        discord_username: discordUser.global_name || discordUser.username,
        discord_discriminator: discordUser.discriminator,
        discord_avatar_hash: discordUser.avatar || null,
        discord_email: discordUser.email || null,
        guilds: guildsData,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
        connected_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (upsertError) {
      console.error("Failed to save Discord connection:", upsertError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=save_failed`
      );
    }

    // Clear OAuth cookies
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?success=discord_connected`
    );

    response.cookies.delete("discord_oauth_state");
    response.cookies.delete("discord_oauth_user");

    return response;
  } catch (error) {
    console.error("Discord callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=callback_failed`
    );
  }
}
