import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";
import { getUser } from "@/lib/auth/get-user";
import { getPool } from "@/lib/db/index";
import { setCsrfCookie } from "@/lib/security/csrf";
import { createAdminToken } from "@/lib/security/admin-token";
import { getClientIdentifier, checkPinRateLimit, logFailedPinAttempt } from "@/lib/security/rate-limit";

const PIN_COOKIE_MAX_AGE = 8 * 60 * 60; // 8 hours (matches token TTL)

/** Read ADMIN_PIN_HASH directly from .env.local to avoid dotenv-expand mangling $ signs */
function getPinHash(): string | null {
  // Try process.env first (works in dev mode where Next.js loads it correctly)
  const fromEnv = process.env.ADMIN_PIN_HASH;
  if (fromEnv && fromEnv.startsWith("$2")) return fromEnv;

  // Fallback: read from file (production with custom server)
  try {
    const envPath = join(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf8");
    const match = content.match(/^ADMIN_PIN_HASH='?([^'\n\r]+)'?/m);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit check (stricter: 5 per 15 min, 1-hour lockout after 10)
    const ip = getClientIdentifier(request);
    const rateLimit = checkPinRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minutes.` },
        { status: 429 }
      );
    }

    // Must be authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Must be admin
    const sql = getPool();
    const rows = await sql`SELECT is_admin FROM profiles WHERE id = ${user.id}`;
    if (!rows[0]?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { pin } = await request.json();
    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    const pinHash = getPinHash();
    if (!pinHash) {
      console.error("ADMIN_PIN_HASH not found in env or .env.local");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const valid = await compare(pin, pinHash);
    if (!valid) {
      logFailedPinAttempt(ip);
      return NextResponse.json(
        { error: "Invalid PIN", remaining: rateLimit.remaining },
        { status: 401 }
      );
    }

    // Set HMAC-signed admin token cookie — client checks via /api/admin/check-pin
    const adminToken = createAdminToken(user.id);
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_pin_verified", adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: PIN_COOKIE_MAX_AGE,
      path: "/",
    });

    // Set CSRF cookie so admin can make state-changing API requests
    setCsrfCookie(response);

    return response;
  } catch (error) {
    console.error("PIN verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
