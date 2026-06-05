import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { tierColor, normaliseTier } from "@/lib/tools/valorant-ranks";

// Valorant rank-card OG image (1080x1080, square — built for IG Stories /
// WhatsApp / Discord sharing). Renders the player's actual Valorant rank from
// their `user_games` row with a rank-tier-tinted skin and a gglobby.in
// watermark/handle that routes curious viewers to signup.
//
// VIEWING/downloading this image is FREE (no account). The account gate lives
// on the /rank-card page's "save/publish to profile" action, not here.

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  // Allow a fully query-driven preview (no DB) so the tool works for guests
  // who have not linked a Valorant account yet.
  const rankParam = request.nextUrl.searchParams.get("rank");
  const nameParam = request.nextUrl.searchParams.get("name");

  try {
    let displayName = nameParam || "Player";
    let handle: string | null = username;
    let rank: string | null = rankParam;
    let avatarUrl: string | null = null;

    if (username) {
      const db = createAdminClient();
      const { data: profile } = await db
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("username", username)
        .single();

      if (profile) {
        const p = profile as Record<string, unknown>;
        displayName = (p.display_name as string) || (p.username as string);
        handle = p.username as string;
        avatarUrl = (p.avatar_url as string) || null;

        if (!rank) {
          // Pull a Valorant rank from the user's games, preferring Valorant.
          const { data: games } = await db
            .from("user_games")
            .select("rank, game:games(name)")
            .eq("user_id", p.id as string)
            .eq("is_public", true)
            .limit(8);
          const rows = (games || []) as { rank?: string; game?: { name: string } | null }[];
          const val = rows.find((g) => (g.game?.name || "").toLowerCase().includes("valorant"));
          rank = (val?.rank || rows.find((g) => g.rank)?.rank || null) ?? null;
        }
      }
    }

    const tier = normaliseTier(rank) || rank || "Unranked";
    const accent = tierColor(typeof tier === "string" ? tier : "all");

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0a0a0f",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Rank-tinted glows */}
          <div
            style={{
              position: "absolute",
              top: -160,
              right: -120,
              width: 560,
              height: 560,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -160,
              left: -120,
              width: 520,
              height: 520,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
            }}
          />

          {/* Top accent bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 10,
              background: `linear-gradient(90deg, ${accent}, #ff4655)`,
            }}
          />

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 30,
              padding: "90px 80px 0 80px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexShrink: 0,
                width: 160,
                height: 160,
                borderRadius: "50%",
                border: `5px solid ${accent}`,
                overflow: "hidden",
                boxShadow: `0 0 50px ${accent}55`,
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  width={160}
                  height={160}
                  style={{ objectFit: "cover", width: 160, height: 160 }}
                />
              ) : (
                <div
                  style={{
                    width: 160,
                    height: 160,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${accent}22`,
                    fontSize: 64,
                    fontWeight: 800,
                    color: accent,
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 30, color: "#7a7a8a", fontWeight: 600 }}>
                VALORANT RANK
              </span>
              <span style={{ fontSize: 56, color: "#ffffff", fontWeight: 800, lineHeight: 1.05 }}>
                {displayName}
              </span>
              {handle && (
                <span style={{ fontSize: 28, color: accent, fontWeight: 600 }}>
                  @{handle}
                </span>
              )}
            </div>
          </div>

          {/* Rank centerpiece */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: 8,
            }}
          >
            <span style={{ fontSize: 32, color: "#9e9eae", fontWeight: 600, letterSpacing: 4 }}>
              CURRENT RANK
            </span>
            <span
              style={{
                fontSize: 150,
                fontWeight: 900,
                color: accent,
                lineHeight: 1,
                textShadow: `0 0 60px ${accent}66`,
                textAlign: "center",
              }}
            >
              {tier}
            </span>
          </div>

          {/* Bottom watermark / signup billboard */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "30px 80px 60px 80px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: accent }}>gg</span>
              <span style={{ fontSize: 44, fontWeight: 900, color: "#ffffff" }}>Lobby</span>
            </div>
            <span style={{ fontSize: 30, color: "#9e9eae", fontWeight: 600 }}>
              gglobby.in/rank-card
            </span>
          </div>

          {/* Bottom accent bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 8,
              background: `linear-gradient(90deg, #ff4655, ${accent})`,
            }}
          />
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      },
    );
  } catch (error) {
    console.error("[og/rank-card] Error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
