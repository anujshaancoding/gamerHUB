import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const XBOX_CONFIG = {
  clientId: process.env.XBOX_CLIENT_ID!,
  clientSecret: process.env.XBOX_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/xbox/callback`,
};

interface XboxTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface XboxProfile {
  xuid: string;
  gamertag: string;
  gamerscore: number;
  avatar?: string;
}

async function exchangeCodeForTokens(code: string): Promise<XboxTokenResponse> {
  const response = await fetch("https://login.live.com/oauth20_token.srf", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: XBOX_CONFIG.clientId,
      client_secret: XBOX_CONFIG.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: XBOX_CONFIG.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for tokens");
  }

  return response.json();
}

async function getXboxProfile(accessToken: string): Promise<XboxProfile> {
  // First, get Xbox Live token
  const xblResponse = await fetch(
    "https://user.auth.xboxlive.com/user/authenticate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-xbl-contract-version": "1",
      },
      body: JSON.stringify({
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT",
        Properties: {
          AuthMethod: "RPS",
          SiteName: "user.auth.xboxlive.com",
          RpsTicket: `d=${accessToken}`,
        },
      }),
    }
  );

  if (!xblResponse.ok) {
    throw new Error("Failed to authenticate with Xbox Live");
  }

  const xblData = await xblResponse.json();
  const userHash = xblData.DisplayClaims.xui[0].uhs;
  const xblToken = xblData.Token;

  // Get XSTS token
  const xstsResponse = await fetch(
    "https://xsts.auth.xboxlive.com/xsts/authorize",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-xbl-contract-version": "1",
      },
      body: JSON.stringify({
        RelyingParty: "http://xboxlive.com",
        TokenType: "JWT",
        Properties: {
          SandboxId: "RETAIL",
          UserTokens: [xblToken],
        },
      }),
    }
  );

  if (!xstsResponse.ok) {
    throw new Error("Failed to get XSTS token");
  }

  const xstsData = await xstsResponse.json();
  const xuid = xstsData.DisplayClaims.xui[0].xid;
  const gamertag = xstsData.DisplayClaims.xui[0].gtg;

  return {
    xuid,
    gamertag,
    gamerscore: 0,
  };
}

// GET - Handle Xbox OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("Xbox OAuth error:", error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=xbox_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=invalid_request`
      );
    }

    // Verify state
    const storedState = request.cookies.get("xbox_oauth_state")?.value;
    const userId = request.cookies.get("xbox_oauth_user")?.value;

    if (!storedState || storedState !== state || !userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=invalid_state`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get Xbox profile
    const profile = await getXboxProfile(tokens.access_token);

    // Store in database
    const supabase = await createClient();

    // Check if XUID is already linked
    const { data: existingConnection } = await supabase
      .from("console_connections")
      .select("user_id")
      .eq("platform", "xbox")
      .eq("platform_user_id", profile.xuid)
      .neq("user_id", userId)
      .single();

    if (existingConnection) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=xbox_already_linked`
      );
    }

    // Upsert connection
    const { error: upsertError } = await supabase
      .from("console_connections")
      .upsert({
        user_id: userId,
        platform: "xbox",
        platform_user_id: profile.xuid,
        platform_username: profile.gamertag,
        online_id: profile.gamertag,
        is_verified: true,
        verification_method: "oauth",
        verified_at: new Date().toISOString(),
        is_active: true,
        connected_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,platform",
      });

    if (upsertError) {
      console.error("Xbox save error:", upsertError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=save_failed`
      );
    }

    // Clear cookies
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?success=xbox_connected`
    );

    response.cookies.delete("xbox_oauth_state");
    response.cookies.delete("xbox_oauth_user");

    return response;
  } catch (error) {
    console.error("Xbox callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/connections?error=callback_failed`
    );
  }
}
