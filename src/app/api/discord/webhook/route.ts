import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import {
  verifyDiscordInteraction,
  DiscordInteraction,
  InteractionType,
  InteractionResponseType,
  createInteractionResponse,
  buildEmbed,
  buildLeaderboardEmbed,
  EMBED_COLORS,
} from "@/lib/integrations/discord";

// Slash command handlers
async function handleLinkCommand(
  interaction: DiscordInteraction
): Promise<object> {
  const discordUserId = interaction.member?.user.id || interaction.user?.id;
  if (!discordUserId) {
    return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: "❌ Could not identify your Discord account.",
      flags: 64, // Ephemeral
    });
  }

  const adminDb = createAdminClient();

  // Check if already linked - eslint-disable for untyped table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: connection } = await (adminDb as any)
    .from("discord_connections")
    .select(`
      user_id,
      profiles!inner(username, display_name)
    `)
    .eq("discord_user_id", discordUserId)
    .single();

  if (connection) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = (connection as any).profiles as { username: string; display_name?: string };
    return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: `✅ Your Discord is linked to GamerHub account: **${profile.display_name || profile.username}**`,
      flags: 64,
    });
  }

  const linkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections`;
  return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
    content: `🔗 Your Discord isn't linked yet!\n\nLink your account here: ${linkUrl}`,
    flags: 64,
  });
}

async function handleLeaderboardCommand(
  interaction: DiscordInteraction
): Promise<object> {
  const adminDb = createAdminClient();

  // Get top 10 players by XP - eslint-disable for admin client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leaderboard, error } = await (adminDb as any)
    .from("profiles")
    .select("username, display_name, total_xp, level")
    .order("total_xp", { ascending: false })
    .limit(10);

  if (error || !leaderboard) {
    return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: "❌ Failed to fetch leaderboard.",
      flags: 64,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = (leaderboard as any[]).map((p, i) => ({
    rank: i + 1,
    username: p.display_name || p.username,
    score: p.total_xp || 0,
  }));

  const embed = buildLeaderboardEmbed({
    title: "Top 10 Players",
    entries,
    leaderboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/leaderboards`,
  });

  return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
    embeds: [embed],
  });
}

async function handleTournamentCommand(
  interaction: DiscordInteraction
): Promise<object> {
  const adminDb = createAdminClient();

  // Get upcoming tournaments - eslint-disable for admin client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tournaments, error } = await (adminDb as any)
    .from("tournaments")
    .select("id, name, game, start_date, max_participants, current_participants")
    .eq("status", "registration_open")
    .order("start_date", { ascending: true })
    .limit(5);

  if (error || !tournaments || tournaments.length === 0) {
    return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: "📭 No upcoming tournaments at the moment.",
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields = (tournaments as any[]).map((t) => ({
    name: t.name,
    value: `🎮 ${t.game}\n👥 ${t.current_participants || 0}/${t.max_participants}\n📅 <t:${Math.floor(new Date(t.start_date).getTime() / 1000)}:F>`,
    inline: true,
  }));

  const embed = buildEmbed({
    title: "🏆 Upcoming Tournaments",
    description: "Join now and compete for glory!",
    color: EMBED_COLORS.primary,
    fields,
    footer: "GamerHub Tournaments",
    url: `${process.env.NEXT_PUBLIC_APP_URL}/tournaments`,
  });

  return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
    embeds: [embed],
  });
}

async function handleMatchCommand(
  interaction: DiscordInteraction
): Promise<object> {
  const discordUserId = interaction.member?.user.id || interaction.user?.id;
  if (!discordUserId) {
    return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: "❌ Could not identify your Discord account.",
      flags: 64,
    });
  }

  const adminDb = createAdminClient();

  // Get linked GamerHub account - eslint-disable for untyped table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: connectionData } = await (adminDb as any)
    .from("discord_connections")
    .select("user_id")
    .eq("discord_user_id", discordUserId)
    .single();

  const connection = connectionData as { user_id: string } | null;

  if (!connection) {
    return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: `❌ Please link your Discord account first!\n${process.env.NEXT_PUBLIC_APP_URL}/settings/connections`,
      flags: 64,
    });
  }

  // Get upcoming matches - eslint-disable for admin client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matches, error } = await (adminDb as any)
    .from("matches")
    .select(`
      id,
      game,
      scheduled_at,
      status,
      team1:clans!matches_team1_id_fkey(name),
      team2:clans!matches_team2_id_fkey(name)
    `)
    .or(`team1_id.eq.${connection.user_id},team2_id.eq.${connection.user_id}`)
    .in("status", ["scheduled", "in_progress"])
    .order("scheduled_at", { ascending: true })
    .limit(5);

  if (error || !matches || matches.length === 0) {
    return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: "📭 You have no upcoming matches.",
      flags: 64,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields = (matches as any[]).map((m) => {
    const team1 = m.team1 as { name: string } | null;
    const team2 = m.team2 as { name: string } | null;
    return {
      name: `${team1?.name || "TBD"} vs ${team2?.name || "TBD"}`,
      value: `🎮 ${m.game}\n📅 <t:${Math.floor(new Date(m.scheduled_at).getTime() / 1000)}:R>`,
      inline: true,
    };
  });

  const embed = buildEmbed({
    title: "⚔️ Your Upcoming Matches",
    color: EMBED_COLORS.warning,
    fields,
    footer: "GamerHub Matches",
  });

  return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
    embeds: [embed],
    flags: 64,
  });
}

async function handleProfileCommand(
  interaction: DiscordInteraction
): Promise<object> {
  const discordUserId = interaction.member?.user.id || interaction.user?.id;
  const targetUser = interaction.data?.options?.find(
    (o) => o.name === "user"
  )?.value as string | undefined;

  const adminDb = createAdminClient();

  let userId = targetUser;

  // If no target, use the command issuer
  if (!userId && discordUserId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connectionData } = await (adminDb as any)
      .from("discord_connections")
      .select("user_id")
      .eq("discord_user_id", discordUserId)
      .single();

    const connection = connectionData as { user_id: string } | null;

    if (!connection) {
      return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
        content: `❌ Link your account: ${process.env.NEXT_PUBLIC_APP_URL}/settings/connections`,
        flags: 64,
      });
    }
    userId = connection.user_id;
  }

  if (!userId) {
    return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: "❌ Could not find user.",
      flags: 64,
    });
  }

  // Get profile - eslint-disable for admin client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error } = await (adminDb as any)
    .from("profiles")
    .select("username, display_name, avatar_url, level, total_xp, bio")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: "❌ Profile not found.",
      flags: 64,
    });
  }

  const embed = buildEmbed({
    title: profile.display_name || profile.username,
    description: profile.bio || "No bio set",
    color: EMBED_COLORS.primary,
    thumbnail: profile.avatar_url || undefined,
    fields: [
      { name: "Level", value: `${profile.level || 1}`, inline: true },
      { name: "Total XP", value: `${(profile.total_xp || 0).toLocaleString()}`, inline: true },
    ],
    url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${profile.username}`,
    footer: "GamerHub Profile",
  });

  return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
    embeds: [embed],
  });
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing signature headers" },
        { status: 401 }
      );
    }

    const body = await request.text();

    // Verify the request is from Discord
    const isValid = await verifyDiscordInteraction(signature, timestamp, body);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const interaction: DiscordInteraction = JSON.parse(body);

    // Handle PING (Discord verification)
    if (interaction.type === InteractionType.PING) {
      return NextResponse.json({ type: InteractionResponseType.PONG });
    }

    // Handle slash commands
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const commandName = interaction.data?.name;

      // Log interaction
      const adminDb = createAdminClient();

      // Get linked user if exists
      const discordUserId = interaction.member?.user.id || interaction.user?.id;
      let gamerhubUserId: string | null = null;

      if (discordUserId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: connectionData } = await (adminDb as any)
          .from("discord_connections")
          .select("user_id")
          .eq("discord_user_id", discordUserId)
          .single();

        const connection = connectionData as { user_id: string } | null;
        if (connection) {
          gamerhubUserId = connection.user_id;
        }
      }

      // Log the interaction - eslint-disable for untyped table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminDb as any).from("discord_interactions").insert({
        interaction_id: interaction.id,
        interaction_type: interaction.type,
        guild_id: interaction.guild_id,
        channel_id: interaction.channel_id,
        user_id: discordUserId,
        gamerhub_user_id: gamerhubUserId,
        command_name: commandName,
        command_options: interaction.data?.options || [],
      });

      // Route to command handlers
      let response;
      switch (commandName) {
        case "link":
        case "gamerhub":
          response = await handleLinkCommand(interaction);
          break;
        case "leaderboard":
          response = await handleLeaderboardCommand(interaction);
          break;
        case "tournament":
        case "tournaments":
          response = await handleTournamentCommand(interaction);
          break;
        case "match":
        case "matches":
          response = await handleMatchCommand(interaction);
          break;
        case "profile":
          response = await handleProfileCommand(interaction);
          break;
        default:
          response = createInteractionResponse(
            InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            {
              content: `❓ Unknown command: \`/${commandName}\``,
              flags: 64,
            }
          );
      }

      return NextResponse.json(response);
    }

    // Unknown interaction type
    return NextResponse.json(
      { error: "Unknown interaction type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Discord webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
