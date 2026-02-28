import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getDiscordOAuthUrl } from "@/lib/integrations/discord";
import { getUser } from "@/lib/auth/get-user";

// GET - Initiate Discord OAuth flow
export async function GET() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate state token for CSRF protection
    const state = crypto.randomUUID();
    const authUrl = getDiscordOAuthUrl(state);

    // Store state and user ID in cookies for callback verification
    const response = NextResponse.redirect(authUrl);

    response.cookies.set("discord_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    response.cookies.set("discord_oauth_user", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Discord connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Discord connection" },
      { status: 500 }
    );
  }
}
