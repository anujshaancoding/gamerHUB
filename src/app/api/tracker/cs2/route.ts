/**
 * GET /api/tracker/cs2?steamId=<steamid64-or-vanity>
 *
 * Fetches CS2 stats from Steam Web API (or mock fallback) and runs the analyzer.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchCs2Stats, isValidSteamInput, normalizeSteamInput } from "@/lib/tracker/cs2-fetcher";
import { analyzeCs2 } from "@/lib/tracker/cs2-analyzer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("steamId")?.trim() ?? "";
  const input = normalizeSteamInput(raw);

  if (!input) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_FORMAT", message: "Enter a SteamID64, vanity, or steamcommunity.com URL." } },
      { status: 400 }
    );
  }
  if (!isValidSteamInput(input)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_FORMAT",
          message: "Invalid Steam input. Paste your steamcommunity.com URL, a 17-digit SteamID64, or your vanity (e.g. 'gabe').",
        },
      },
      { status: 400 }
    );
  }

  try {
    const result = await fetchCs2Stats(input);
    if (result.kind === "error") {
      const status = result.code === "NOT_FOUND" ? 404 : result.code === "PRIVATE_PROFILE" ? 403 : 502;
      return NextResponse.json({ ok: false, error: { code: result.code, message: result.message } }, { status });
    }
    const insights = analyzeCs2(result.stats, result.fromMock);
    return NextResponse.json({ ok: true, insights });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: { code: "UPSTREAM_ERROR", message: msg } }, { status: 500 });
  }
}
