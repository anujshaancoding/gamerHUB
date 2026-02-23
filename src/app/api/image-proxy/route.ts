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
  console.log("[image-proxy] Request received, url param:", url);

  if (!url) {
    console.log("[image-proxy] Missing url param");
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    console.log("[image-proxy] Invalid url:", url);
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  console.log("[image-proxy] Hostname:", parsed.hostname);

  // Also allow any *.supabase.co or *.googleusercontent.com host
  const isAllowed =
    ALLOWED_HOSTS.has(parsed.hostname) ||
    parsed.hostname.endsWith(".supabase.co") ||
    parsed.hostname.endsWith(".googleusercontent.com");

  if (!isAllowed) {
    console.log("[image-proxy] Host not allowed:", parsed.hostname);
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    console.log("[image-proxy] Fetching upstream:", url);
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
    console.log("[image-proxy] Upstream response:", res.status, res.statusText, "content-type:", res.headers.get("content-type"));

    if (!res.ok) {
      console.error("[image-proxy] Upstream returned error:", res.status);
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 },
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    console.log("[image-proxy] SUCCESS - buffer size:", buffer.byteLength, "content-type:", contentType);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[image-proxy] Fetch failed:", message, err);
    return NextResponse.json(
      { error: `Failed to fetch image: ${message}` },
      { status: 502 },
    );
  }
}
