import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ggLobby - Where Gamers Unite";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0f",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow effects */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,255,136,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Border */}
        <div
          style={{
            position: "absolute",
            inset: 16,
            border: "2px solid rgba(0,255,136,0.2)",
            borderRadius: 24,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            position: "relative",
          }}
        >
          {/* Logo text */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: "#00ff88",
                letterSpacing: "-4px",
              }}
            >
              gg
            </span>
            <span
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-4px",
              }}
            >
              Lobby
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: "#b8b8c8",
              fontWeight: 500,
              letterSpacing: "4px",
              textTransform: "uppercase" as const,
            }}
          >
            Where Gamers Unite
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 24,
            }}
          >
            {["Find Teammates", "Build Clans", "Track Stats", "Compete"].map(
              (feature) => (
                <div
                  key={feature}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 999,
                    border: "1px solid rgba(0,255,136,0.3)",
                    backgroundColor: "rgba(0,255,136,0.08)",
                    color: "#00ff88",
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {feature}
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 20,
            color: "#5a5a6a",
            letterSpacing: "2px",
          }}
        >
          gglobby.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
