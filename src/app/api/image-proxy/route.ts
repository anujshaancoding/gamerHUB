import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "i.pinimg.com",
  "images.unsplash.com",
  "upload.wikimedia.org",
  "cdn.discordapp.com",
  "api.dicebear.com",
  "api-assets.clashofclans.com",
]);

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  // Allow our own domain and *.googleusercontent.com host
  const isAllowed =
    ALLOWED_HOSTS.has(parsed.hostname) ||
    parsed.hostname === "gglobby.in" ||
    parsed.hostname.endsWith(".googleusercontent.com");

  if (!isAllowed) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: parsed.origin + "/",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 },
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    // Restrict CORS to own domain
    const origin = req.headers.get("origin") || "";
    const allowedOrigins = ["https://gglobby.in", "https://www.gglobby.in"];
    const corsOrigin = allowedOrigins.includes(origin) ? origin : "https://gglobby.in";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": corsOrigin,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[image-proxy] Fetch failed:", message);
    return NextResponse.json(
      { error: `Failed to fetch image: ${message}` },
      { status: 502 },
    );
  }
}
