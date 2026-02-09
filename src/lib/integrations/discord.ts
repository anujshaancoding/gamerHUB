// Discord Integration Library
// Handles OAuth, Interactions API, and webhook notifications

const DISCORD_API_URL = "https://discord.com/api/v10";
const DISCORD_CDN_URL = "https://cdn.discordapp.com";

// Environment variables
const getDiscordConfig = () => ({
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  botToken: process.env.DISCORD_BOT_TOKEN!,
  publicKey: process.env.DISCORD_PUBLIC_KEY!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/discord/callback`,
});

// Discord OAuth scopes
export const DISCORD_SCOPES = [
  "identify",
  "email",
  "guilds",
  "guilds.members.read",
];

// Types
export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar?: string;
  email?: string;
  verified?: boolean;
  flags?: number;
  premium_type?: number;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  owner: boolean;
  permissions: string;
  features: string[];
}

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface DiscordWebhook {
  id: string;
  type: number;
  guild_id?: string;
  channel_id?: string;
  name?: string;
  avatar?: string;
  token?: string;
  url?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
    icon_url?: string;
  };
  image?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

export interface DiscordInteraction {
  id: string;
  application_id: string;
  type: InteractionType;
  data?: InteractionData;
  guild_id?: string;
  channel_id?: string;
  member?: {
    user: DiscordUser;
    roles: string[];
    permissions: string;
  };
  user?: DiscordUser;
  token: string;
  version: number;
}

export interface InteractionData {
  id: string;
  name: string;
  type: number;
  options?: InteractionOption[];
}

export interface InteractionOption {
  name: string;
  type: number;
  value?: string | number | boolean;
  options?: InteractionOption[];
}

export enum InteractionType {
  PING = 1,
  APPLICATION_COMMAND = 2,
  MESSAGE_COMPONENT = 3,
  APPLICATION_COMMAND_AUTOCOMPLETE = 4,
  MODAL_SUBMIT = 5,
}

export enum InteractionResponseType {
  PONG = 1,
  CHANNEL_MESSAGE_WITH_SOURCE = 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
  DEFERRED_UPDATE_MESSAGE = 6,
  UPDATE_MESSAGE = 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT = 8,
  MODAL = 9,
}

// Color constants for embeds
export const EMBED_COLORS = {
  primary: 0x7c3aed, // Purple
  success: 0x22c55e, // Green
  warning: 0xf59e0b, // Yellow
  error: 0xef4444, // Red
  info: 0x3b82f6, // Blue
};

// Generate OAuth URL
export function getDiscordOAuthUrl(state: string): string {
  const config = getDiscordConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: DISCORD_SCOPES.join(" "),
    state,
    prompt: "consent",
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

// Exchange code for tokens
export async function exchangeDiscordCode(
  code: string
): Promise<DiscordTokenResponse> {
  const config = getDiscordConfig();

  const response = await fetch(`${DISCORD_API_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Discord code: ${error}`);
  }

  return response.json();
}

// Refresh access token
export async function refreshDiscordToken(
  refreshToken: string
): Promise<DiscordTokenResponse> {
  const config = getDiscordConfig();

  const response = await fetch(`${DISCORD_API_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Discord token");
  }

  return response.json();
}

// Get current user
export async function getDiscordUser(
  accessToken: string
): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API_URL}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Discord user");
  }

  return response.json();
}

// Get user's guilds
export async function getDiscordGuilds(
  accessToken: string
): Promise<DiscordGuild[]> {
  const response = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Discord guilds");
  }

  return response.json();
}

// Get avatar URL
export function getDiscordAvatarUrl(
  userId: string,
  avatar?: string,
  discriminator?: string
): string {
  if (avatar) {
    const ext = avatar.startsWith("a_") ? "gif" : "png";
    return `${DISCORD_CDN_URL}/avatars/${userId}/${avatar}.${ext}?size=256`;
  }

  // Default avatar
  const index = discriminator
    ? parseInt(discriminator) % 5
    : parseInt(userId) % 5;
  return `${DISCORD_CDN_URL}/embed/avatars/${index}.png`;
}

// Get guild icon URL
export function getGuildIconUrl(
  guildId: string,
  icon?: string
): string | null {
  if (!icon) return null;
  const ext = icon.startsWith("a_") ? "gif" : "png";
  return `${DISCORD_CDN_URL}/icons/${guildId}/${icon}.${ext}?size=256`;
}

// Verify interaction signature
export async function verifyDiscordInteraction(
  signature: string,
  timestamp: string,
  body: string
): Promise<boolean> {
  const config = getDiscordConfig();

  try {
    const encoder = new TextEncoder();
    const publicKey = await crypto.subtle.importKey(
      "raw",
      hexToUint8Array(config.publicKey),
      { name: "Ed25519", namedCurve: "Ed25519" },
      false,
      ["verify"]
    );

    const message = encoder.encode(timestamp + body);
    const signatureBytes = hexToUint8Array(signature);

    return await crypto.subtle.verify(
      "Ed25519",
      publicKey,
      signatureBytes,
      message
    );
  } catch {
    return false;
  }
}

// Helper to convert hex string to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Send webhook message
export async function sendWebhookMessage(
  webhookUrl: string,
  options: {
    content?: string;
    embeds?: DiscordEmbed[];
    username?: string;
    avatar_url?: string;
  }
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send webhook message: ${error}`);
  }
}

// Create webhook in channel
export async function createWebhook(
  channelId: string,
  name: string
): Promise<DiscordWebhook> {
  const config = getDiscordConfig();

  const response = await fetch(
    `${DISCORD_API_URL}/channels/${channelId}/webhooks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${config.botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create webhook");
  }

  return response.json();
}

// Respond to interaction
export function createInteractionResponse(
  type: InteractionResponseType,
  data?: {
    content?: string;
    embeds?: DiscordEmbed[];
    flags?: number;
    components?: unknown[];
  }
) {
  return {
    type,
    data,
  };
}

// Slash command builders
export function buildEmbed(options: {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: string;
  thumbnail?: string;
  image?: string;
  url?: string;
  author?: { name: string; icon_url?: string; url?: string };
}): DiscordEmbed {
  const embed: DiscordEmbed = {};

  if (options.title) embed.title = options.title;
  if (options.description) embed.description = options.description;
  if (options.color) embed.color = options.color;
  if (options.url) embed.url = options.url;
  if (options.fields) embed.fields = options.fields;
  if (options.footer) embed.footer = { text: options.footer };
  if (options.thumbnail) embed.thumbnail = { url: options.thumbnail };
  if (options.image) embed.image = { url: options.image };
  if (options.author) embed.author = options.author;

  embed.timestamp = new Date().toISOString();

  return embed;
}

// Command handlers
export interface CommandHandler {
  name: string;
  description: string;
  handler: (
    interaction: DiscordInteraction,
    userId?: string
  ) => Promise<{
    content?: string;
    embeds?: DiscordEmbed[];
    ephemeral?: boolean;
  }>;
}

// Pre-built notification embeds
export function buildMatchReminderEmbed(match: {
  game: string;
  opponent: string;
  scheduledAt: Date;
  matchUrl: string;
}): DiscordEmbed {
  return buildEmbed({
    title: "⚔️ Match Reminder",
    description: `Your match is starting soon!`,
    color: EMBED_COLORS.warning,
    fields: [
      { name: "Game", value: match.game, inline: true },
      { name: "Opponent", value: match.opponent, inline: true },
      {
        name: "Time",
        value: `<t:${Math.floor(match.scheduledAt.getTime() / 1000)}:R>`,
        inline: true,
      },
    ],
    footer: "GamerHub Match Notification",
    url: match.matchUrl,
  });
}

export function buildAchievementEmbed(achievement: {
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  username: string;
  profileUrl: string;
}): DiscordEmbed {
  return buildEmbed({
    title: "🏆 Achievement Unlocked!",
    description: `**${achievement.username}** earned a new achievement!`,
    color: EMBED_COLORS.success,
    fields: [
      { name: achievement.name, value: achievement.description },
      { name: "XP Reward", value: `+${achievement.xpReward} XP`, inline: true },
    ],
    thumbnail: achievement.icon,
    footer: "GamerHub Achievements",
    url: achievement.profileUrl,
  });
}

export function buildTournamentEmbed(tournament: {
  name: string;
  game: string;
  startTime: Date;
  participants: number;
  maxParticipants: number;
  prizePool?: string;
  tournamentUrl: string;
}): DiscordEmbed {
  return buildEmbed({
    title: `🎮 ${tournament.name}`,
    description: `A new tournament is starting!`,
    color: EMBED_COLORS.primary,
    fields: [
      { name: "Game", value: tournament.game, inline: true },
      {
        name: "Participants",
        value: `${tournament.participants}/${tournament.maxParticipants}`,
        inline: true,
      },
      {
        name: "Start Time",
        value: `<t:${Math.floor(tournament.startTime.getTime() / 1000)}:F>`,
        inline: true,
      },
      ...(tournament.prizePool
        ? [{ name: "Prize Pool", value: tournament.prizePool, inline: true }]
        : []),
    ],
    footer: "GamerHub Tournaments",
    url: tournament.tournamentUrl,
  });
}

export function buildLeaderboardEmbed(leaderboard: {
  title: string;
  entries: Array<{
    rank: number;
    username: string;
    score: number;
  }>;
  leaderboardUrl: string;
}): DiscordEmbed {
  const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `**${rank}.**`;
  };

  const description = leaderboard.entries
    .map((e) => `${rankEmoji(e.rank)} ${e.username} - ${e.score.toLocaleString()} pts`)
    .join("\n");

  return buildEmbed({
    title: `📊 ${leaderboard.title}`,
    description,
    color: EMBED_COLORS.info,
    footer: "GamerHub Leaderboards",
    url: leaderboard.leaderboardUrl,
  });
}

export function buildMemberJoinedEmbed(member: {
  username: string;
  avatarUrl?: string;
  clanName: string;
  memberCount: number;
  profileUrl: string;
}): DiscordEmbed {
  return buildEmbed({
    title: "👋 New Member Joined!",
    description: `**${member.username}** has joined **${member.clanName}**!`,
    color: EMBED_COLORS.success,
    fields: [
      { name: "Total Members", value: member.memberCount.toString(), inline: true },
    ],
    thumbnail: member.avatarUrl,
    footer: "GamerHub Clans",
    url: member.profileUrl,
  });
}

export function buildLevelUpEmbed(levelUp: {
  username: string;
  avatarUrl?: string;
  newLevel: number;
  profileUrl: string;
}): DiscordEmbed {
  return buildEmbed({
    title: "⬆️ Level Up!",
    description: `**${levelUp.username}** reached **Level ${levelUp.newLevel}**!`,
    color: EMBED_COLORS.primary,
    thumbnail: levelUp.avatarUrl,
    footer: "GamerHub Progression",
    url: levelUp.profileUrl,
  });
}
