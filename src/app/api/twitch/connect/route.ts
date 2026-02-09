import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTwitchAuthUrl } from "@/lib/integrations/twitch";

// GET - Initiate Twitch OAuth flow
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({ userId: user.id, timestamp: Date.now() })
    ).toString("base64url");

    // Store state in cookie
    const response = NextResponse.redirect(getTwitchAuthUrl(state));
    response.cookies.set("twitch_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Twitch connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Twitch connection" },
      { status: 500 }
    );
  }
}
