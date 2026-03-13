import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { exchangeRiotCode, getRiotAccount } from "@/lib/integrations/riot";
import { cookies } from "next/headers";
import { encryptToken } from "@/lib/security/encryption";
import { logger } from "@/lib/logger";

// GET - Handle Riot OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      logger.error("Riot OAuth error", undefined, { detail: error });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=riot_auth_failed`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=missing_params`
      );
    }

    // Verify state parameter
    const cookieStore = await cookies();
    const storedState = cookieStore.get("riot_oauth_state")?.value;
    const userId = cookieStore.get("riot_oauth_user")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=invalid_state`
      );
    }

    if (!userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=session_expired`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeRiotCode(code);

    // Get Riot account info
    const account = await getRiotAccount(tokens.access_token);

    // Store connection in database
    const db = createClient();

    const { error: upsertError } = await db
      .from("game_connections")
      .upsert(
        {
          user_id: userId,
          provider: "riot",
          provider_user_id: account.puuid,
          provider_username: `${account.gameName}#${account.tagLine}`,
          access_token: encryptToken(tokens.access_token),
          refresh_token: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
          token_expires_at: new Date(
            Date.now() + tokens.expires_in * 1000
          ).toISOString(),
          scopes: tokens.scope.split(" "),
          metadata: {
            game_name: account.gameName,
            tag_line: account.tagLine,
          },
          is_active: true,
          connected_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,provider",
        }
      );

    if (upsertError) {
      logger.error("Error storing Riot connection", upsertError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=storage_failed`
      );
    }

    // Clear OAuth cookies
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?success=riot_connected`
    );
    response.cookies.delete("riot_oauth_state");
    response.cookies.delete("riot_oauth_user");

    return response;
  } catch (error) {
    logger.error("Riot callback error", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=callback_failed`
    );
  }
}
