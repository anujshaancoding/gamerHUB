// Twitch API Integration
// Supports OAuth, EventSub webhooks, and Helix API

const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2";
const TWITCH_API_URL = "https://api.twitch.tv/helix";

// Scopes needed for streamer features
export const TWITCH_SCOPES = [
  "user:read:email",
  "channel:read:stream_key",
  "channel:manage:broadcast",
  "channel:read:subscriptions",
];

export interface TwitchTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string[];
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email?: string;
  created_at: string;
}

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: "live" | "";
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  tags: string[];
  is_mature: boolean;
}

export interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
  igdb_id?: string;
}

export interface TwitchChannel {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  broadcaster_language: string;
  game_id: string;
  game_name: string;
  title: string;
  delay: number;
  tags: string[];
  content_classification_labels: string[];
  is_branded_content: boolean;
}

export interface EventSubSubscription {
  id: string;
  status: string;
  type: string;
  version: string;
  condition: Record<string, string>;
  created_at: string;
  transport: {
    method: string;
    callback: string;
  };
}

// Generate OAuth URL
export function getTwitchAuthUrl(state: string): string {
  const clientId = process.env.TWITCH_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/twitch/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: TWITCH_SCOPES.join(" "),
    state,
  });

  return `${TWITCH_AUTH_URL}/authorize?${params.toString()}`;
}

// Exchange code for tokens
export async function exchangeTwitchCode(code: string): Promise<TwitchTokens> {
  const clientId = process.env.TWITCH_CLIENT_ID!;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/twitch/callback`;

  const response = await fetch(`${TWITCH_AUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Twitch code: ${error}`);
  }

  return response.json();
}

// Refresh access token
export async function refreshTwitchToken(refreshToken: string): Promise<TwitchTokens> {
  const clientId = process.env.TWITCH_CLIENT_ID!;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET!;

  const response = await fetch(`${TWITCH_AUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Twitch token");
  }

  return response.json();
}

// Validate token
export async function validateTwitchToken(accessToken: string): Promise<{
  client_id: string;
  login: string;
  scopes: string[];
  user_id: string;
  expires_in: number;
} | null> {
  const response = await fetch(`${TWITCH_AUTH_URL}/validate`, {
    headers: {
      Authorization: `OAuth ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

// Get app access token (for server-side API calls without user token)
export async function getAppAccessToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID!;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET!;

  const response = await fetch(`${TWITCH_AUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get app access token");
  }

  const data = await response.json();
  return data.access_token;
}

// Get user info
export async function getTwitchUser(accessToken: string): Promise<TwitchUser> {
  const response = await fetch(`${TWITCH_API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get Twitch user");
  }

  const data = await response.json();
  return data.data[0];
}

// Get user by ID (server-side with app token)
export async function getTwitchUserById(
  userId: string,
  appAccessToken: string
): Promise<TwitchUser | null> {
  const response = await fetch(`${TWITCH_API_URL}/users?id=${userId}`, {
    headers: {
      Authorization: `Bearer ${appAccessToken}`,
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.data[0] || null;
}

// Get streams (check if users are live)
export async function getTwitchStreams(
  userIds: string[],
  appAccessToken: string
): Promise<TwitchStream[]> {
  if (userIds.length === 0) return [];

  const params = new URLSearchParams();
  userIds.forEach((id) => params.append("user_id", id));

  const response = await fetch(`${TWITCH_API_URL}/streams?${params}`, {
    headers: {
      Authorization: `Bearer ${appAccessToken}`,
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get Twitch streams");
  }

  const data = await response.json();
  return data.data;
}

// Get channel info
export async function getTwitchChannel(
  broadcasterId: string,
  appAccessToken: string
): Promise<TwitchChannel | null> {
  const response = await fetch(
    `${TWITCH_API_URL}/channels?broadcaster_id=${broadcasterId}`,
    {
      headers: {
        Authorization: `Bearer ${appAccessToken}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID!,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.data[0] || null;
}

// Get game by ID
export async function getTwitchGame(
  gameId: string,
  appAccessToken: string
): Promise<TwitchGame | null> {
  const response = await fetch(`${TWITCH_API_URL}/games?id=${gameId}`, {
    headers: {
      Authorization: `Bearer ${appAccessToken}`,
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.data[0] || null;
}

// Search games
export async function searchTwitchGames(
  query: string,
  appAccessToken: string,
  limit: number = 10
): Promise<TwitchGame[]> {
  const params = new URLSearchParams({
    query,
    first: limit.toString(),
  });

  const response = await fetch(`${TWITCH_API_URL}/search/categories?${params}`, {
    headers: {
      Authorization: `Bearer ${appAccessToken}`,
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to search games");
  }

  const data = await response.json();
  return data.data;
}

// EventSub - Create subscription
export async function createEventSubSubscription(
  type: string,
  condition: Record<string, string>,
  appAccessToken: string
): Promise<EventSubSubscription> {
  const response = await fetch(`${TWITCH_API_URL}/eventsub/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appAccessToken}`,
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type,
      version: "1",
      condition,
      transport: {
        method: "webhook",
        callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twitch/webhook`,
        secret: process.env.TWITCH_WEBHOOK_SECRET,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create EventSub subscription: ${error}`);
  }

  const data = await response.json();
  return data.data[0];
}

// EventSub - Delete subscription
export async function deleteEventSubSubscription(
  subscriptionId: string,
  appAccessToken: string
): Promise<void> {
  const response = await fetch(
    `${TWITCH_API_URL}/eventsub/subscriptions?id=${subscriptionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${appAccessToken}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID!,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete EventSub subscription");
  }
}

// EventSub - List subscriptions
export async function listEventSubSubscriptions(
  appAccessToken: string
): Promise<EventSubSubscription[]> {
  const response = await fetch(`${TWITCH_API_URL}/eventsub/subscriptions`, {
    headers: {
      Authorization: `Bearer ${appAccessToken}`,
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to list EventSub subscriptions");
  }

  const data = await response.json();
  return data.data;
}

// Verify EventSub webhook signature
export function verifyTwitchWebhook(
  messageId: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  const crypto = require("crypto");
  const secret = process.env.TWITCH_WEBHOOK_SECRET!;
  const message = messageId + timestamp + body;

  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(message).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Generate embed URL
export function getTwitchEmbedUrl(
  channel: string,
  parent: string
): { player: string; chat: string } {
  return {
    player: `https://player.twitch.tv/?channel=${channel}&parent=${parent}&muted=false`,
    chat: `https://www.twitch.tv/embed/${channel}/chat?parent=${parent}&darkpopout`,
  };
}

// Format thumbnail URL
export function formatThumbnailUrl(
  url: string,
  width: number = 440,
  height: number = 248
): string {
  return url.replace("{width}", width.toString()).replace("{height}", height.toString());
}
