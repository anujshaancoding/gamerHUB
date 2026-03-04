import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/db/admin";

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("id");
  if (!postId) {
    return new Response("Missing post id", { status: 400 });
  }

  try {
    const db = createAdminClient();

    const { data: post } = await db
      .from("friend_posts")
      .select("id, content, user_id, likes_count, comments_count")
      .eq("id", postId)
      .single();

    if (!post) {
      return new Response("Post not found", { status: 404 });
    }

    const { data: profile } = await db
      .from("profiles")
      .select("display_name, username")
      .eq("id", (post as any).user_id)
      .single();

    const authorName =
      (profile as any)?.display_name ||
      (profile as any)?.username ||
      "a gamer";
    const username = (profile as any)?.username || "";
    const content = (post as any).content as string;
    const likes = (post as any).likes_count || 0;
    const comments = (post as any).comments_count || 0;

    const displayContent =
      content.length > 240 ? content.slice(0, 237) + "..." : content;

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
          {/* Background glow effects */}
          <div
            style={{
              position: "absolute",
              top: -120,
              left: -120,
              width: 400,
              height: 400,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(0,255,136,0.12) 0%, transparent 70%)",
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
              background:
                "radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)",
            }}
          />

          {/* Outer border */}
          <div
            style={{
              position: "absolute",
              inset: 12,
              border: "1.5px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
            }}
          />

          {/* Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "100%",
              height: "100%",
              padding: 48,
            }}
          >
            {/* Top: branding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: "#00ff88",
                  letterSpacing: "-1px",
                }}
              >
                gg
              </span>
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "-1px",
                }}
              >
                Lobby
              </span>
            </div>

            {/* Middle: author + content */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 24,
                flex: 1,
                justifyContent: "center",
              }}
            >
              {/* Author row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    backgroundColor: "rgba(0,255,136,0.15)",
                    border: "2.5px solid rgba(0,255,136,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 700,
                    color: "#00ff88",
                  }}
                >
                  {authorName.charAt(0).toUpperCase()}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#ffffff",
                      lineHeight: 1.2,
                    }}
                  >
                    {authorName}
                  </span>
                  {username && (
                    <span style={{ fontSize: 18, color: "#6b6b7b" }}>
                      @{username}
                    </span>
                  )}
                </div>
              </div>

              {/* Post content */}
              <div
                style={{
                  fontSize: 32,
                  color: "#d4d4e0",
                  lineHeight: 1.5,
                  display: "flex",
                }}
              >
                {displayContent}
              </div>
            </div>

            {/* Bottom: engagement + url */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: 24 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#6b6b7b",
                    fontSize: 18,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{likes}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#6b6b7b",
                    fontSize: 18,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b6b7b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{comments}</span>
                </div>
              </div>
              <span
                style={{
                  fontSize: 16,
                  color: "#4a4a5a",
                  letterSpacing: "1px",
                }}
              >
                gglobby.in
              </span>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error) {
    console.error("OG image generation error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
