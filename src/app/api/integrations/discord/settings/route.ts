import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UpdateDiscordSettingsRequest, DiscordConnectionStatus } from "@/types/discord";

// GET - Get Discord connection status and settings
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: settings } = await supabase
      .from("discord_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!settings) {
      const response: DiscordConnectionStatus = {
        connected: false,
        discord_username: null,
        discord_avatar_url: null,
        settings: {},
      };
      return NextResponse.json(response);
    }

    // Build avatar URL
    let avatar_url: string | null = null;
    if (settings.discord_avatar_hash) {
      const ext = settings.discord_avatar_hash.startsWith("a_") ? "gif" : "png";
      avatar_url = `https://cdn.discordapp.com/avatars/${settings.discord_user_id}/${settings.discord_avatar_hash}.${ext}?size=128`;
    } else {
      const index = parseInt(settings.discord_user_id) % 5;
      avatar_url = `https://cdn.discordapp.com/embed/avatars/${index}.png`;
    }

    const response: DiscordConnectionStatus = {
      connected: true,
      discord_username: settings.discord_username,
      discord_avatar_url: avatar_url,
      settings: {
        cross_post_lfg: settings.cross_post_lfg,
        cross_post_tournaments: settings.cross_post_tournaments,
        cross_post_matches: settings.cross_post_matches,
        rich_presence_enabled: settings.rich_presence_enabled,
        show_discord_status: settings.show_discord_status,
        import_friends_enabled: settings.import_friends_enabled,
        share_activity: settings.share_activity,
        default_channel_id: settings.default_channel_id,
        default_guild_id: settings.default_guild_id,
        guilds: settings.guilds,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get Discord settings error:", error);
    return NextResponse.json(
      { error: "Failed to get Discord settings" },
      { status: 500 }
    );
  }
}

// PATCH - Update Discord settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateDiscordSettingsRequest = await request.json();

    // Validate that user has Discord connected
    const { data: existing } = await supabase
      .from("discord_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Discord not connected" },
        { status: 400 }
      );
    }

    // Update settings
    const { data, error } = await supabase
      .from("discord_settings")
      .update({
        cross_post_lfg: body.cross_post_lfg,
        cross_post_tournaments: body.cross_post_tournaments,
        cross_post_matches: body.cross_post_matches,
        rich_presence_enabled: body.rich_presence_enabled,
        show_discord_status: body.show_discord_status,
        import_friends_enabled: body.import_friends_enabled,
        share_activity: body.share_activity,
        default_channel_id: body.default_channel_id,
        default_guild_id: body.default_guild_id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Update Discord settings error:", error);
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update Discord settings error:", error);
    return NextResponse.json(
      { error: "Failed to update Discord settings" },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect Discord
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete Discord settings (cascade will delete related data)
    const { error } = await supabase
      .from("discord_settings")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Disconnect Discord error:", error);
      return NextResponse.json(
        { error: "Failed to disconnect Discord" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disconnect Discord error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Discord" },
      { status: 500 }
    );
  }
}
