import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/db/admin";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  if (!username) {
    return new Response("Missing username", { status: 400 });
  }

  try {
    const db = createAdminClient();

    const { data: profile } = await db
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, region, is_premium")
      .eq("username", username)
      .single();

    if (!profile) {
      return new Response("Profile not found", { status: 404 });
    }

    const p = profile as Record<string, unknown>;
    const displayName = (p.display_name as string) || (p.username as string);
    const bio = (p.bio as string) || "Gamer on ggLobby";
    const region = (p.region as string) || null;
    const isPremium = (p.is_premium as boolean) || false;
    const avatarUrl = p.avatar_url as string | null;

    // Fetch game count
    const { count: gamesCount } = await db
      .from("user_games")
      .select("*", { count: "exact", head: true })
      .eq("user_id", p.id as string)
      .eq("is_public", true);

    // Fetch primary game
    const { data: games } = await db
      .from("user_games")
      .select("rank, game:games(name)")
      .eq("user_id", p.id as string)
      .eq("is_public", true)
      .limit(1);

    const primaryGame = games?.[0] as { rank?: string; game?: { name: string } | null } | undefined;

    // Fetch follower count
    const { count: followers } = await db
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", p.id as string);

    const displayBio = bio.length > 100 ? bio.slice(0, 97) + "..." : bio;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundColor: "#0a0a0f",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: "absolute",
              top: -100,
              left: -100,
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(159,122,234,0.15) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -80,
              right: -80,
              width: 350,
              height: 350,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)",
            }}
          />

          {/* Top accent bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 5,
              background: "linear-gradient(90deg, #9f7aea, #00d4ff, #ff00ff)",
            }}
          />

          {/* Main layout */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "60px 70px",
              width: "100%",
              height: "100%",
              gap: 50,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                display: "flex",
                flexShrink: 0,
                width: 200,
                height: 200,
                borderRadius: "50%",
                border: "4px solid #9f7aea",
                overflow: "hidden",
                boxShadow: "0 0 40px rgba(159,122,234,0.4)",
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  width={200}
                  height={200}
                  style={{ objectFit: "cover", width: 200, height: 200 }}
                />
              ) : (
                <div
                  style={{
                    width: 200,
                    height: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(159,122,234,0.2)",
                    fontSize: 72,
                    fontWeight: 700,
                    color: "#9f7aea",
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                gap: 12,
              }}
            >
              {/* Name row */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: "#ffffff",
                    lineHeight: 1.1,
                  }}
                >
                  {displayName}
                </span>
                {isPremium && (
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#0a0a0f",
                      background: "#FFD700",
                      padding: "4px 12px",
                      borderRadius: 8,
                    }}
                  >
                    PRO
                  </span>
                )}
              </div>

              {/* Username */}
              <span style={{ fontSize: 26, color: "#9f7aea", fontWeight: 500 }}>
                @{p.username}
              </span>

              {/* Bio */}
              <span style={{ fontSize: 22, color: "#b8b8c8", marginTop: 4 }}>
                {displayBio}
              </span>

              {/* Stats row */}
              <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
                {primaryGame?.game?.name && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 16px",
                      borderRadius: 12,
                      background: "rgba(159,122,234,0.12)",
                      border: "1px solid rgba(159,122,234,0.25)",
                    }}
                  >
                    <span style={{ fontSize: 18, color: "#9f7aea", fontWeight: 600 }}>
                      🎮 {primaryGame.game.name}
                    </span>
                    {primaryGame.rank && (
                      <span style={{ fontSize: 16, color: "#00d4ff", fontWeight: 600 }}>
                        {primaryGame.rank}
                      </span>
                    )}
                  </div>
                )}
                {region && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 16px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <span style={{ fontSize: 18, color: "#9e9eae" }}>
                      📍 {region}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ fontSize: 18, color: "#9e9eae" }}>
                    👥 {followers || 0} followers
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span style={{ fontSize: 18, color: "#9e9eae" }}>
                    🎮 {gamesCount || 0} games
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom branding bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 70px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(10,10,15,0.8)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#9f7aea" }}>
                gg
              </span>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#ffffff" }}>
                Lobby
              </span>
            </div>
            <span style={{ fontSize: 18, color: "#7a7a8a" }}>
              gglobby.in/profile/{p.username}
            </span>
          </div>

          {/* Bottom accent bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "linear-gradient(90deg, #9f7aea, #00d4ff, #ff00ff)",
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error("[og/profile] Error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
