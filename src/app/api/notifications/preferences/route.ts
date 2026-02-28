import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

export async function GET() {
  try {
    const db = createClient();

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all notification preferences
    const { data: preferences, error } = await db
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .order("notification_type");

    if (error) {
      console.error("Error fetching preferences:", error);
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    // Get Discord connection status
    const { data: discordConnection } = await db
      .from("discord_connections")
      .select("discord_username, is_active")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      preferences: preferences || [],
      discordConnected: !!discordConnection?.is_active,
      discordUsername: discordConnection?.discord_username,
    });
  } catch (error) {
    console.error("Preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = createClient();

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    if (!Array.isArray(preferences)) {
      return NextResponse.json(
        { error: "Invalid preferences format" },
        { status: 400 }
      );
    }

    // Validate preference structure
    const validNotificationTypes = [
      "match_reminder",
      "tournament_start",
      "clan_invite",
      "friend_request",
      "achievement_earned",
      "level_up",
      "battle_pass_reward",
      "stream_live",
      "forum_reply",
      "direct_message",
      "system_announcement",
    ];

    const validChannels = ["in_app", "email", "discord", "push"];

    for (const pref of preferences) {
      if (!validNotificationTypes.includes(pref.notification_type)) {
        return NextResponse.json(
          { error: `Invalid notification type: ${pref.notification_type}` },
          { status: 400 }
        );
      }

      if (pref.channels) {
        for (const channel of pref.channels) {
          if (!validChannels.includes(channel)) {
            return NextResponse.json(
              { error: `Invalid channel: ${channel}` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Check if Discord is connected for discord channel
    const { data: discordConnection } = await db
      .from("discord_connections")
      .select("is_active")
      .eq("user_id", user.id)
      .single();

    const hasDiscord = discordConnection?.is_active;

    // Upsert preferences
    for (const pref of preferences) {
      // Remove discord channel if not connected
      let channels = pref.channels || ["in_app"];
      if (!hasDiscord && channels.includes("discord")) {
        channels = channels.filter((c: string) => c !== "discord");
      }

      const { error } = await db
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            notification_type: pref.notification_type,
            channels,
            is_enabled: pref.is_enabled ?? true,
            quiet_hours_start: pref.quiet_hours_start || null,
            quiet_hours_end: pref.quiet_hours_end || null,
            frequency: pref.frequency || "instant",
            settings: pref.settings || {},
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,notification_type",
          }
        );

      if (error) {
        console.error("Error updating preference:", error);
        return NextResponse.json(
          { error: "Failed to update preferences" },
          { status: 500 }
        );
      }
    }

    // Fetch updated preferences
    const { data: updatedPreferences } = await db
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .order("notification_type");

    return NextResponse.json({
      preferences: updatedPreferences || [],
    });
  } catch (error) {
    console.error("Preferences PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = createClient();

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationType, ...updates } = body;

    if (!notificationType) {
      return NextResponse.json(
        { error: "Notification type is required" },
        { status: 400 }
      );
    }

    // Update single preference
    const { data: preference, error } = await db
      .from("notification_preferences")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("notification_type", notificationType)
      .select()
      .single();

    if (error) {
      console.error("Error updating preference:", error);
      return NextResponse.json(
        { error: "Failed to update preference" },
        { status: 500 }
      );
    }

    return NextResponse.json({ preference });
  } catch (error) {
    console.error("Preferences PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
