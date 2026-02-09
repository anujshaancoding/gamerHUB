import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Xbox Live OAuth configuration
const XBOX_CONFIG = {
  clientId: process.env.XBOX_CLIENT_ID!,
  clientSecret: process.env.XBOX_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/xbox/callback`,
  scope: "XboxLive.signin XboxLive.offline_access",
};

function getXboxOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: XBOX_CONFIG.clientId,
    redirect_uri: XBOX_CONFIG.redirectUri,
    response_type: "code",
    scope: XBOX_CONFIG.scope,
    state,
  });

  return `https://login.live.com/oauth20_authorize.srf?${params.toString()}`;
}

// GET - Initiate Xbox OAuth flow or show manual entry option
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if OAuth is configured
    if (XBOX_CONFIG.clientId && XBOX_CONFIG.clientSecret) {
      const state = crypto.randomUUID();
      const authUrl = getXboxOAuthUrl(state);

      const response = NextResponse.redirect(authUrl);

      response.cookies.set("xbox_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      });

      response.cookies.set("xbox_oauth_user", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      });

      return response;
    }

    // Fall back to manual entry
    return NextResponse.json({
      method: "manual",
      instructions: "Enter your Xbox Gamertag manually",
      connect_url: null,
    });
  } catch (error) {
    console.error("Xbox connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Xbox connection" },
      { status: 500 }
    );
  }
}

// POST - Manual Gamertag connection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gamertag } = await request.json();

    if (!gamertag || gamertag.trim().length < 3) {
      return NextResponse.json(
        { error: "Valid Xbox Gamertag required" },
        { status: 400 }
      );
    }

    // Check if Gamertag is already linked to another account
    const { data: existingConnection } = await supabase
      .from("console_connections")
      .select("user_id")
      .eq("platform", "xbox")
      .eq("online_id", gamertag.trim())
      .neq("user_id", user.id)
      .single();

    if (existingConnection) {
      return NextResponse.json(
        { error: "This Gamertag is already linked to another account" },
        { status: 400 }
      );
    }

    // Upsert the connection
    const { data, error } = await supabase
      .from("console_connections")
      .upsert({
        user_id: user.id,
        platform: "xbox",
        platform_user_id: gamertag.trim().toLowerCase(),
        platform_username: gamertag.trim(),
        online_id: gamertag.trim(),
        is_verified: false,
        verification_method: "manual",
        is_active: true,
        connected_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,platform",
      })
      .select()
      .single();

    if (error) {
      console.error("Xbox connection error:", error);
      return NextResponse.json(
        { error: "Failed to connect Xbox account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connection: data,
    });
  } catch (error) {
    console.error("Xbox connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect Xbox account" },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect Xbox
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("console_connections")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", "xbox");

    if (error) {
      console.error("Xbox disconnect error:", error);
      return NextResponse.json(
        { error: "Failed to disconnect Xbox" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Xbox disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Xbox" },
      { status: 500 }
    );
  }
}
