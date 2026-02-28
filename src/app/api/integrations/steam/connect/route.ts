import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getSteamAuthUrl } from "@/lib/integrations/steam";
import { getUser } from "@/lib/auth/get-user";

// GET - Initiate Steam OpenID flow
export async function GET() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/steam/callback`;
    const authUrl = getSteamAuthUrl(returnUrl);

    // Store user ID to associate after callback
    const response = NextResponse.redirect(authUrl);
    response.cookies.set("steam_oauth_user", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Steam connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Steam connection" },
      { status: 500 }
    );
  }
}
