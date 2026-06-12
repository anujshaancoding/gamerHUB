import type { Metadata } from "next";
import { permanentRedirect, notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import { BASE_URL } from "@/lib/features/seo";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 3600;

async function getSlug(id: string) {
  const db = createClient();
  const { data } = await db
    .from("blog_posts")
    .select("slug")
    .eq("id", id)
    .eq("status", "published")
    .single();
  return (data as { slug?: string | null } | null)?.slug || null;
}

// This route exists only as a permanent redirect to /blog/{slug} so any
// legacy /community/post/{id} links (shared on socials, indexed by Google)
// keep working while we consolidate canonical URLs on /blog/{slug}.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const slug = await getSlug(id);
  if (!slug) return { robots: { index: false, follow: false } };
  return {
    alternates: { canonical: `${BASE_URL}/blog/${slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function LegacyCommunityPostRedirect({ params }: Props) {
  const { id } = await params;
  const slug = await getSlug(id);
  if (!slug) notFound();
  permanentRedirect(`/blog/${slug}`);
}
