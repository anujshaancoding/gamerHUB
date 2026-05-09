import { getRecentPublishedPosts } from "@/lib/data/blog";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gglobby.in";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await getRecentPublishedPosts();

  const newsItems = posts
    .map((post) => {
      const pubDate = new Date(post.published_at).toISOString();
      const keywords = (post.tags || []).join(", ");
      return `
  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>ggLobby</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>${
        keywords
          ? `
      <news:keywords>${escapeXml(keywords)}</news:keywords>`
          : ""
      }
    </news:news>
  </url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${newsItems}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
