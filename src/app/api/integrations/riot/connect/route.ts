import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getRiotAuthUrl } from "@/lib/services/integrations/riot";
import { nanoid } from "nanoid";
import { getUser } from "@/lib/auth/get-user";
import { logger } from "@/lib/logger";

/**
 * Sanitize a caller-supplied returnTo path so we can't be turned into an open
 * redirect. Only allow same-origin, relative paths (start with a single "/").
 */
function safeReturnTo(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

// GET - Initiate Riot OAuth flow
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const returnTo = safeReturnTo(
      new URL(request.url).searchParams.get("returnTo")
    );

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

    // Remember where to send the user back to after a successful link.
    if (returnTo) {
      response.cookies.set("riot_oauth_return", returnTo, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    logger.error("Riot connect error", error);
    return NextResponse.json(
      { error: "Failed to initiate Riot connection" },
      { status: 500 }
    );
  }
}
