// Discord Integration Types

export interface DiscordSettings {
  id: string;
  user_id: string;
  discord_user_id: string;
  discord_username: string | null;
  discord_discriminator: string | null;
  discord_avatar_hash: string | null;
  discord_email: string | null;
  guilds: DiscordGuild[];
  cross_post_lfg: boolean;
  cross_post_tournaments: boolean;
  cross_post_matches: boolean;
  rich_presence_enabled: boolean;
  show_discord_status: boolean;
  import_friends_enabled: boolean;
  share_activity: boolean;
  default_webhook_url: string | null;
  default_channel_id: string | null;
  default_guild_id: string | null;
  connected_at: string;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions?: string;
}

export interface DiscordCrosspost {
  id: string;
  user_id: string;
  content_type: 'lfg_post' | 'tournament' | 'match' | 'clan_recruitment';
  content_id: string;
  discord_message_id: string | null;
  discord_channel_id: string;
  discord_guild_id: string | null;
  status: 'pending' | 'posted' | 'failed' | 'deleted';
  error_message: string | null;
  posted_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface DiscordFriend {
  id: string;
  user_id: string;
  discord_friend_id: string;
  discord_friend_username: string | null;
  discord_friend_discriminator: string | null;
  discord_friend_avatar: string | null;
  gamerhub_user_id: string | null;
  is_matched: boolean;
  invite_sent: boolean;
  invite_sent_at: string | null;
  imported_at: string;
  // Joined data
  gamerhub_user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface DiscordWebhook {
  id: string;
  user_id: string;
  webhook_url: string;
  webhook_id: string | null;
  webhook_token: string | null;
  guild_id: string;
  guild_name: string | null;
  channel_id: string;
  channel_name: string | null;
  is_active: boolean;
  post_lfg: boolean;
  post_tournaments: boolean;
  post_clan_recruitment: boolean;
  created_at: string;
  updated_at: string;
}

// API Request/Response types
export interface ConnectDiscordRequest {
  code: string;
  redirect_uri: string;
}

export interface DiscordConnectionStatus {
  connected: boolean;
  discord_username: string | null;
  discord_avatar_url: string | null;
  settings: Partial<DiscordSettings>;
}

export interface UpdateDiscordSettingsRequest {
  cross_post_lfg?: boolean;
  cross_post_tournaments?: boolean;
  cross_post_matches?: boolean;
  rich_presence_enabled?: boolean;
  show_discord_status?: boolean;
  import_friends_enabled?: boolean;
  share_activity?: boolean;
  default_channel_id?: string;
  default_guild_id?: string;
}

export interface CrosspostRequest {
  content_type: 'lfg_post' | 'tournament' | 'match' | 'clan_recruitment';
  content_id: string;
  channel_id?: string;
  guild_id?: string;
}

export interface ImportFriendsResponse {
  imported_count: number;
  matched_count: number;
  friends: DiscordFriend[];
}

// Helper functions
export function getDiscordAvatarUrl(
  userId: string,
  avatarHash: string | null,
  size = 128
): string {
  if (!avatarHash) {
    // Default avatar based on discriminator
    const defaultIndex = parseInt(userId) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
  }

  const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=${size}`;
}

export function getDiscordGuildIconUrl(
  guildId: string,
  iconHash: string | null,
  size = 128
): string | null {
  if (!iconHash) return null;

  const extension = iconHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.${extension}?size=${size}`;
}
