import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// Type for membership query result
interface MembershipResult {
  role: string;
}

// Type for discord guild connection
interface DiscordGuildResult {
  guild_id?: string;
  guild_name?: string;
  is_active?: boolean;
}

const VALID_TRIGGERS = [
  "member_joined",
  "member_left",
  "match_scheduled",
  "match_completed",
  "tournament_created",
  "achievement_unlocked",
  "level_milestone",
  "weekly_summary",
];

const VALID_ACTIONS = [
  "send_discord_message",
  "send_notification",
  "assign_role",
  "update_channel_topic",
  "create_event",
  "post_announcement",
];

export async function GET(request: NextRequest) {
  try {
    const db = createClient();

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clanId = searchParams.get("clan_id");

    if (!clanId) {
      return NextResponse.json(
        { error: "Clan ID is required" },
        { status: 400 }
      );
    }

    // Check if user is clan admin
    const { data: membershipData } = await db
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", user.id)
      .single();

    const membership = membershipData as MembershipResult | null;
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get automation rules - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rules, error } = await (db as any)
      .from("automation_rules")
      .select(`
        *,
        created_by_profile:profiles!automation_rules_created_by_fkey(username, display_name, avatar_url)
      `)
      .eq("clan_id", clanId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rules:", error);
      return NextResponse.json(
        { error: "Failed to fetch automation rules" },
        { status: 500 }
      );
    }

    // Get Discord guild connection - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: discordGuildData } = await (db as any)
      .from("discord_guild_connections")
      .select("guild_id, guild_name, is_active")
      .eq("clan_id", clanId)
      .single();

    const discordGuild = discordGuildData as DiscordGuildResult | null;

    return NextResponse.json({
      rules: rules || [],
      discordConnected: !!discordGuild?.is_active,
      discordGuild: discordGuild,
    });
  } catch (error) {
    console.error("Automation rules error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = createClient();

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      clanId,
      name,
      description,
      triggerType,
      triggerConditions,
      actionType,
      actionConfig,
      cooldownMinutes,
    } = body;

    // Validate required fields
    if (!clanId || !name || !triggerType || !actionType || !actionConfig) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate trigger and action types
    if (!VALID_TRIGGERS.includes(triggerType)) {
      return NextResponse.json(
        { error: `Invalid trigger type: ${triggerType}` },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.includes(actionType)) {
      return NextResponse.json(
        { error: `Invalid action type: ${actionType}` },
        { status: 400 }
      );
    }

    // Check if user is clan admin
    const { data: membershipData } = await db
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", user.id)
      .single();

    const membership = membershipData as MembershipResult | null;
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if Discord is connected for Discord actions
    if (actionType.startsWith("send_discord") || actionType === "update_channel_topic") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: discordGuildData } = await (db as any)
        .from("discord_guild_connections")
        .select("is_active")
        .eq("clan_id", clanId)
        .single();

      const discordGuild = discordGuildData as DiscordGuildResult | null;
      if (!discordGuild?.is_active) {
        return NextResponse.json(
          { error: "Discord must be connected for this action type" },
          { status: 400 }
        );
      }
    }

    // Create rule - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rule, error } = await (db as any)
      .from("automation_rules")
      .insert({
        clan_id: clanId,
        name,
        description: description || null,
        trigger_type: triggerType,
        trigger_conditions: triggerConditions || {},
        action_type: actionType,
        action_config: actionConfig,
        cooldown_minutes: cooldownMinutes || 0,
        is_enabled: true,
        created_by: user.id,
      })
      .select(`
        *,
        created_by_profile:profiles!automation_rules_created_by_fkey(username, display_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Error creating rule:", error);
      return NextResponse.json(
        { error: "Failed to create automation rule" },
        { status: 500 }
      );
    }

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Automation rules POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
