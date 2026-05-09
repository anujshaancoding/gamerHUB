import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { BLOG_CATEGORIES } from "@/types/blog";

export const runtime = "nodejs";
export const revalidate = 86400;

const CATEGORY_HEX: Record<string, [string, string]> = {
  blue: ["#3b82f6", "#06b6d4"],
  green: ["#10b981", "#00ff88"],
  purple: ["#8b5cf6", "#a855f7"],
  orange: ["#f97316", "#fb923c"],
  red: ["#ef4444", "#f87171"],
  cyan: ["#06b6d4", "#67e8f9"],
  yellow: ["#eab308", "#facc15"],
  pink: ["#ec4899", "#f472b6"],
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) return new Response("Missing slug", { status: 400 });

  try {
    const db = createAdminClient();
    const { data: post } = await db
      .from("blog_posts")
      .select(
        "title, excerpt, category, tags, featured_image_url, author:profiles!blog_posts_author_id_fkey(display_name, username)"
      )
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!post) return new Response("Post not found", { status: 404 });

    const p = post as Record<string, unknown>;
    const title = (p.title as string) || "Untitled";
    const excerpt = (p.excerpt as string) || "";
    const categoryKey = (p.category as string) || "news";
    const categoryInfo =
      BLOG_CATEGORIES[categoryKey as keyof typeof BLOG_CATEGORIES];
    const categoryLabel = categoryInfo?.label || categoryKey.toUpperCase();
    const colorKey = categoryInfo?.color || "green";
    const [primaryHex, secondaryHex] = CATEGORY_HEX[colorKey] || CATEGORY_HEX.green;
    const author = p.author as { display_name?: string; username?: string } | null;
    const authorName = author?.display_name || author?.username || "ggLobby";
    const authorHandle = author?.username ? `@${author.username}` : "";

    const truncatedTitle =
      title.length > 110 ? title.slice(0, 107) + "..." : title;
    const truncatedExcerpt = excerpt
      ? excerpt.length > 160
        ? excerpt.slice(0, 157) + "..."
        : excerpt
      : "";

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
          <div
            style={{
              position: "absolute",
              top: -160,
              left: -160,
              width: 480,
              height: 480,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${primaryHex}33 0%, transparent 70%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -120,
              right: -120,
              width: 420,
              height: 420,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${secondaryHex}26 0%, transparent 70%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 14,
              border: "1.5px solid rgba(255,255,255,0.08)",
              borderRadius: 24,
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "100%",
              height: "100%",
              padding: 60,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span
                  style={{
                    fontSize: 38,
                    fontWeight: 900,
                    color: primaryHex,
                    letterSpacing: "-1px",
                  }}
                >
                  gg
                </span>
                <span
                  style={{
                    fontSize: 38,
                    fontWeight: 900,
                    color: "#ffffff",
                    letterSpacing: "-1px",
                  }}
                >
                  Lobby
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${primaryHex}, ${secondaryHex})`,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0a0a0f",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                {categoryLabel}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <div
                style={{
                  fontSize: truncatedTitle.length > 70 ? 56 : 64,
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1.1,
                  letterSpacing: "-1.5px",
                  display: "flex",
                }}
              >
                {truncatedTitle}
              </div>
              {truncatedExcerpt && (
                <div
                  style={{
                    fontSize: 24,
                    color: "#a0a0b0",
                    lineHeight: 1.4,
                    display: "flex",
                  }}
                >
                  {truncatedExcerpt}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${primaryHex}, ${secondaryHex})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#0a0a0f",
                  }}
                >
                  {authorName.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#ffffff",
                      lineHeight: 1.2,
                    }}
                  >
                    {authorName}
                  </span>
                  {authorHandle && (
                    <span style={{ fontSize: 16, color: "#6b6b7b" }}>
                      {authorHandle}
                    </span>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontSize: 18,
                  color: "#4a4a5a",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                gglobby.in/blog
              </span>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error) {
    console.error("Blog OG image generation error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
