import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRiotAuthUrl } from "@/lib/integrations/riot";
import { nanoid } from "nanoid";

// GET - Initiate Riot OAuth flow
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
    const state = nanoid(32);

    // Store state in session/cookie (expires in 10 minutes)
    const response = NextResponse.redirect(getRiotAuthUrl(state));
    response.cookies.set("riot_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Store user ID to associate after callback
    response.cookies.set("riot_oauth_user", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Riot connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Riot connection" },
      { status: 500 }
    );
  }
}
