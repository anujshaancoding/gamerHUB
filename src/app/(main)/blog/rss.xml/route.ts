import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { BASE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

export const revalidate = 3600;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function GET() {
  const db = createClient();
  const { data: posts } = await db
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, content, featured_image_url, category, tags, published_at, updated_at, author:profiles!blog_posts_author_id_fkey(display_name, username)"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  const items = (posts || [])
    .filter((post: Record<string, unknown>) => !!post.slug)
    .map((post: Record<string, unknown>) => {
      const slug = post.slug as string;
      const title = (post.title as string) || "";
      const excerpt = (post.excerpt as string) || "";
      const content = (post.content as string) || "";
      const description = excerpt || stripHtml(content).slice(0, 320);
      const url = `${BASE_URL}/blog/${slug}`;
      const pubDate = new Date(
        (post.published_at as string) || (post.updated_at as string) || Date.now()
      ).toUTCString();
      const author = post.author as { display_name?: string } | null;
      const category = (post.category as string) || "";
      const image = post.featured_image_url as string | null;

      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      ${author?.display_name ? `<dc:creator>${escapeXml(author.display_name)}</dc:creator>` : ""}
      ${category ? `<category>${escapeXml(category)}</category>` : ""}
      <description>${escapeXml(description)}</description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
      ${image ? `<enclosure url="${escapeXml(image)}" type="image/jpeg" />` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} — Gaming Blog</title>
    <link>${BASE_URL}/blog</link>
    <atom:link href="${BASE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
