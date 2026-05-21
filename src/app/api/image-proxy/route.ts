import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "i.pinimg.com",
  "images.unsplash.com",
  "upload.wikimedia.org",
  "cdn.discordapp.com",
  "api.dicebear.com",
  "api-assets.clashofclans.com",
]);

/** Block loopback / link-local / private-range literals (basic anti-SSRF). */
function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  // IPv6 loopback / unique-local
  if (h === "::1" || h.startsWith("fd") || h.startsWith("fe80")) return true;
  // IPv4 literals in private / link-local / loopback ranges
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

function isAllowedHost(hostname: string): boolean {
  if (isPrivateHost(hostname)) return false;
  return (
    ALLOWED_HOSTS.has(hostname) ||
    hostname === "gglobby.in" ||
    hostname.endsWith(".googleusercontent.com")
  );
}

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

  if (parsed.protocol !== "https:" || !isAllowedHost(parsed.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // Follow redirects MANUALLY so every hop's host is re-validated against the
    // allowlist (an open redirect on an allowed CDN can't pivot us to internal
    // endpoints).
    let currentUrl = parsed.toString();
    let res: Response | null = null;
    for (let hop = 0; hop < 5; hop++) {
      res = await fetch(currentUrl, {
        signal: controller.signal,
        cache: "no-store",
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          Referer: parsed.origin + "/",
        },
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) break;
        let next: URL;
        try {
          next = new URL(location, currentUrl);
        } catch {
          clearTimeout(timeout);
          return NextResponse.json({ error: "Invalid redirect" }, { status: 502 });
        }
        if (next.protocol !== "https:" || !isAllowedHost(next.hostname)) {
          clearTimeout(timeout);
          return NextResponse.json({ error: "Redirect host not allowed" }, { status: 403 });
        }
        currentUrl = next.toString();
        continue;
      }
      break;
    }

    clearTimeout(timeout);

    if (!res || (res.status >= 300 && res.status < 400)) {
      return NextResponse.json({ error: "Too many redirects" }, { status: 502 });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 },
      );
    }

    // Only proxy actual images.
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) {
      return NextResponse.json(
        { error: "Upstream is not an image" },
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
