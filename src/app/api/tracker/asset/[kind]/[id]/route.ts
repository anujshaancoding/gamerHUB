/**
 * GET /api/tracker/asset/agent/jett
 * GET /api/tracker/asset/weapon/vandal
 *
 * Proxies Valorant artwork from valorant-api.com so that:
 *   - The browser only ever talks to our own origin (no CSP changes needed).
 *   - We can edge-cache forever (asset UUIDs are stable).
 *
 * If the upstream fetch fails we return a 1x1 transparent PNG so the UI
 * degrades to a placeholder instead of a broken image.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  AGENTS,
  WEAPONS,
  agentDisplayIconUrl,
  weaponDisplayIconUrl,
} from "@/lib/tracker/valorant-assets";

// 1x1 transparent PNG, base64
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

export const dynamic = "force-static";
export const revalidate = false;

function emptyResponse(): NextResponse {
  return new NextResponse(TRANSPARENT_PNG, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> }
): Promise<NextResponse> {
  const { kind, id } = await params;
  const key = id.toLowerCase();

  let upstream: string | null = null;
  if (kind === "agent" && AGENTS[key]) {
    upstream = agentDisplayIconUrl(AGENTS[key].uuid);
  } else if (kind === "weapon" && WEAPONS[key]) {
    upstream = weaponDisplayIconUrl(WEAPONS[key].uuid);
  }

  if (!upstream) return emptyResponse();

  try {
    const res = await fetch(upstream, { next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!res.ok) return emptyResponse();
    const buf = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "image/png",
        "Cache-Control": "public, max-age=2592000, immutable",
      },
    });
  } catch {
    return emptyResponse();
  }
}
