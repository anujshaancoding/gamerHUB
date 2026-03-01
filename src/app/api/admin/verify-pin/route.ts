import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";
import { getUser } from "@/lib/auth/get-user";
import { getPool } from "@/lib/db/index";

const PIN_COOKIE_MAX_AGE = 4 * 60 * 60; // 4 hours

// --- Rate limiting ---
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 30 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 30 * 60 * 1000);

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - 1, retryAfterSeconds: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - entry.count, retryAfterSeconds: 0 };
}

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
    // Rate limit check
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip);
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
      return NextResponse.json(
        { error: "Invalid PIN", remaining: rateLimit.remaining },
        { status: 401 }
      );
    }

    // Set cookie (NOT httpOnly — client-side layout needs to read it for persistence across refreshes)
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_pin_verified", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: PIN_COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("PIN verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
