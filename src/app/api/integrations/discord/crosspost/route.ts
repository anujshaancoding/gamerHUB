import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWebhookMessage, buildEmbed, EMBED_COLORS } from "@/lib/integrations/discord";
import type { CrosspostRequest } from "@/types/discord";

// POST - Crosspost content to Discord
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CrosspostRequest = await request.json();

    // Validate request
    if (!body.content_type || !body.content_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user's Discord settings
    const { data: settings } = await supabase
      .from("discord_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!settings) {
      return NextResponse.json(
        { error: "Discord not connected" },
        { status: 400 }
      );
    }

    // Check if crossposting is enabled for this content type
    const crosspostEnabled =
      (body.content_type === "lfg_post" && settings.cross_post_lfg) ||
      (body.content_type === "tournament" && settings.cross_post_tournaments) ||
      (body.content_type === "match" && settings.cross_post_matches) ||
      body.content_type === "clan_recruitment";

    if (!crosspostEnabled) {
      return NextResponse.json(
        { error: "Crossposting not enabled for this content type" },
        { status: 400 }
      );
    }

    // Get webhook for posting
    const channelId = body.channel_id || settings.default_channel_id;
    const guildId = body.guild_id || settings.default_guild_id;

    if (!channelId) {
      return NextResponse.json(
        { error: "No channel specified for crossposting" },
        { status: 400 }
      );
    }

    const { data: webhook } = await supabase
      .from("discord_webhooks")
      .select("*")
      .eq("user_id", user.id)
      .eq("channel_id", channelId)
      .eq("is_active", true)
      .single();

    if (!webhook) {
      return NextResponse.json(
        { error: "No active webhook for this channel" },
        { status: 400 }
      );
    }

    // Get content to crosspost
    let embed;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (body.content_type === "lfg_post") {
      const { data: lfgPost } = await supabase
        .from("lfg_posts")
        .select(`
          *,
          game:games(name, slug),
          creator:profiles(username, avatar_url)
        `)
        .eq("id", body.content_id)
        .single();

      if (!lfgPost) {
        return NextResponse.json({ error: "LFG post not found" }, { status: 404 });
      }

      embed = buildEmbed({
        title: `🎮 LFG: ${lfgPost.game?.name || "Unknown Game"}`,
        description: lfgPost.description || "Looking for group!",
        color: EMBED_COLORS.primary,
        fields: [
          { name: "Host", value: lfgPost.creator?.username || "Unknown", inline: true },
          { name: "Players Needed", value: `${lfgPost.current_players}/${lfgPost.max_players}`, inline: true },
          ...(lfgPost.rank_requirement ? [{ name: "Rank Required", value: lfgPost.rank_requirement, inline: true }] : []),
          ...(lfgPost.mic_required ? [{ name: "Mic", value: "Required", inline: true }] : []),
        ],
        footer: "GamerHub LFG",
        url: `${appUrl}/lfg/${lfgPost.id}`,
      });
    } else if (body.content_type === "tournament") {
      const { data: tournament } = await supabase
        .from("tournaments")
        .select(`
          *,
          game:games(name, slug),
          organizer:profiles(username)
        `)
        .eq("id", body.content_id)
        .single();

      if (!tournament) {
        return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
      }

      embed = buildEmbed({
        title: `🏆 ${tournament.name}`,
        description: tournament.description || "Join this tournament!",
        color: EMBED_COLORS.warning,
        fields: [
          { name: "Game", value: tournament.game?.name || "Unknown", inline: true },
          { name: "Format", value: tournament.format, inline: true },
          { name: "Participants", value: `${tournament.current_participants}/${tournament.max_participants}`, inline: true },
          ...(tournament.prize_pool ? [{ name: "Prize Pool", value: tournament.prize_pool, inline: true }] : []),
          { name: "Starts", value: `<t:${Math.floor(new Date(tournament.start_date).getTime() / 1000)}:F>`, inline: false },
        ],
        footer: "GamerHub Tournaments",
        url: `${appUrl}/tournaments/${tournament.slug}`,
      });
    } else if (body.content_type === "clan_recruitment") {
      const { data: clan } = await supabase
        .from("clans")
        .select("*")
        .eq("id", body.content_id)
        .single();

      if (!clan) {
        return NextResponse.json({ error: "Clan not found" }, { status: 404 });
      }

      embed = buildEmbed({
        title: `⚔️ ${clan.name} is Recruiting!`,
        description: clan.description || "Join our clan!",
        color: EMBED_COLORS.info,
        fields: [
          { name: "Members", value: `${clan.member_count}/${clan.max_members}`, inline: true },
          { name: "Founded", value: `<t:${Math.floor(new Date(clan.created_at).getTime() / 1000)}:D>`, inline: true },
        ],
        thumbnail: clan.logo_url,
        footer: "GamerHub Clans",
        url: `${appUrl}/clans/${clan.slug}`,
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 }
      );
    }

    // Send to Discord
    try {
      await sendWebhookMessage(webhook.webhook_url, {
        embeds: [embed],
        username: "GamerHub",
        avatar_url: `${appUrl}/gamerhub-logo.png`,
      });

      // Record crosspost
      const { data: crosspost, error: crosspostError } = await supabase
        .from("discord_crossposts")
        .insert({
          user_id: user.id,
          content_type: body.content_type,
          content_id: body.content_id,
          discord_channel_id: channelId,
          discord_guild_id: guildId,
          status: "posted",
          posted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (crosspostError) {
        console.error("Failed to record crosspost:", crosspostError);
      }

      return NextResponse.json({
        success: true,
        crosspost_id: crosspost?.id,
      });
    } catch (webhookError) {
      console.error("Webhook send error:", webhookError);

      // Record failed crosspost
      await supabase.from("discord_crossposts").insert({
        user_id: user.id,
        content_type: body.content_type,
        content_id: body.content_id,
        discord_channel_id: channelId,
        discord_guild_id: guildId,
        status: "failed",
        error_message: webhookError instanceof Error ? webhookError.message : "Unknown error",
      });

      return NextResponse.json(
        { error: "Failed to send to Discord" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Crosspost error:", error);
    return NextResponse.json(
      { error: "Failed to crosspost content" },
      { status: 500 }
    );
  }
}

// GET - Get crosspost history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data: crossposts, error, count } = await supabase
      .from("discord_crossposts")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Get crossposts error:", error);
      return NextResponse.json(
        { error: "Failed to get crossposts" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      crossposts,
      total: count,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error("Get crossposts error:", error);
    return NextResponse.json(
      { error: "Failed to get crossposts" },
      { status: 500 }
    );
  }
}
