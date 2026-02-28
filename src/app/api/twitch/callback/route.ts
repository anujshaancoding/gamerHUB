import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import {
  exchangeTwitchCode,
  getTwitchUser,
  createEventSubSubscription,
  getAppAccessToken,
} from "@/lib/integrations/twitch";
import { cookies } from "next/headers";

// GET - Handle Twitch OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Twitch OAuth error:", error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/streaming?error=twitch_auth_failed`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/streaming?error=missing_params`
      );
    }

    // Verify state parameter
    const cookieStore = await cookies();
    const storedState = cookieStore.get("twitch_oauth_state")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/streaming?error=invalid_state`
      );
    }

    // Decode state to get user ID
    let userId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
      userId = decoded.userId;
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/streaming?error=invalid_state`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeTwitchCode(code);

    // Get Twitch user info
    const twitchUser = await getTwitchUser(tokens.access_token);

    // Store in database
    const db = createClient();

    const { error: upsertError } = await db
      .from("streamer_profiles")
      .upsert(
        {
          user_id: userId,
          twitch_id: twitchUser.id,
          twitch_login: twitchUser.login,
          twitch_display_name: twitchUser.display_name,
          twitch_profile_image_url: twitchUser.profile_image_url,
          twitch_broadcaster_type: twitchUser.broadcaster_type,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(
            Date.now() + tokens.expires_in * 1000
          ).toISOString(),
          scopes: tokens.scope,
          connected_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (upsertError) {
      console.error("Error storing Twitch connection:", upsertError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/streaming?error=storage_failed`
      );
    }

    // Set up EventSub subscriptions for stream events
    try {
      const appToken = await getAppAccessToken();

      // Get the streamer profile ID
      const { data: profile } = await db
        .from("streamer_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (profile) {
        // Subscribe to stream.online
        const onlineSub = await createEventSubSubscription(
          "stream.online",
          { broadcaster_user_id: twitchUser.id },
          appToken
        );

        // Subscribe to stream.offline
        const offlineSub = await createEventSubSubscription(
          "stream.offline",
          { broadcaster_user_id: twitchUser.id },
          appToken
        );

        // Store subscription IDs
        await db.from("twitch_eventsub_subscriptions").insert([
          {
            twitch_subscription_id: onlineSub.id,
            streamer_id: profile.id,
            subscription_type: "stream.online",
          },
          {
            twitch_subscription_id: offlineSub.id,
            streamer_id: profile.id,
            subscription_type: "stream.offline",
          },
        ]);
      }
    } catch (eventSubError) {
      console.error("EventSub setup error:", eventSubError);
      // Don't fail the connection if EventSub fails
    }

    // Clear OAuth cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/streaming?success=twitch_connected`
    );
    response.cookies.delete("twitch_oauth_state");

    return response;
  } catch (error) {
    console.error("Twitch callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/streaming?error=callback_failed`
    );
  }
}
