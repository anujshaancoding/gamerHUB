/**
 * GET /api/tracker/valorant?riotId=Name%23TAG
 *
 * Fetches raw stats (mock for now), runs the analyzer, returns insights.
 * Self-contained — no auth required, no DB writes.
 */
import { NextRequest, NextResponse } from "next/server";
import { analyzeValorant } from "@/lib/tracker/analyzer";
import { fetchValorantStats, isValidRiotId } from "@/lib/tracker/fetchers";
import type { TrackerLookupResponse } from "@/lib/tracker/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse<TrackerLookupResponse>> {
  const riotId = req.nextUrl.searchParams.get("riotId")?.trim() ?? "";
  const act = req.nextUrl.searchParams.get("act")?.trim() || undefined;

  if (!riotId) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_FORMAT",
          message: "Enter a Riot ID in the format PlayerName#TAG.",
        },
      },
      { status: 400 }
    );
  }

  if (!isValidRiotId(riotId)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_FORMAT",
          message:
            "That doesn't look like a valid Riot ID. Format: PlayerName#TAG (e.g. Phoenix#NA1).",
        },
      },
      { status: 400 }
    );
  }

  try {
    const result = await fetchValorantStats(riotId, act);
    if (result.kind === "error") {
      const status = result.code === "NOT_FOUND" ? 404 : result.code === "PRIVATE_PROFILE" ? 403 : 502;
      return NextResponse.json(
        { ok: false, error: { code: result.code, message: result.message } },
        { status }
      );
    }
    const insights = analyzeValorant(result.stats, result.fromMock);
    return NextResponse.json({ ok: true, insights });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: { code: "UPSTREAM_ERROR", message: msg } },
      { status: 500 }
    );
  }
}
