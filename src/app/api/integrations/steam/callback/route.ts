import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { verifySteamAuth, getSteamUser } from "@/lib/integrations/steam";
import { cookies } from "next/headers";

// GET - Handle Steam OpenID callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get user ID from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get("steam_oauth_user")?.value;

    if (!userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=session_expired`
      );
    }

    // Verify Steam OpenID response
    const steamId = await verifySteamAuth(searchParams);

    if (!steamId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=steam_verification_failed`
      );
    }

    // Get Steam user profile
    const steamUser = await getSteamUser(steamId);

    if (!steamUser) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=steam_profile_not_found`
      );
    }

    // Store connection in database
    const db = createClient();

    const { error: upsertError } = await db
      .from("game_connections")
      .upsert(
        {
          user_id: userId,
          provider: "steam",
          provider_user_id: steamId,
          provider_username: steamUser.personaname,
          provider_avatar_url: steamUser.avatarfull,
          // Steam OpenID doesn't use tokens, just the verified Steam ID
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
          scopes: ["openid"],
          metadata: {
            profile_url: steamUser.profileurl,
            persona_state: steamUser.personastate,
            visibility: steamUser.communityvisibilitystate,
            country: steamUser.loccountrycode,
            time_created: steamUser.timecreated,
          },
          is_active: true,
          connected_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,provider",
        }
      );

    if (upsertError) {
      console.error("Error storing Steam connection:", upsertError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=storage_failed`
      );
    }

    // Clear OAuth cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?success=steam_connected`
    );
    response.cookies.delete("steam_oauth_user");

    return response;
  } catch (error) {
    console.error("Steam callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=callback_failed`
    );
  }
}
