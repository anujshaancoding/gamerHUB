/**
 * Canonical URL for a blog post. Prefer the slug-based URL since it's
 * keyword-rich and SEO-friendly. Fall back to the legacy id-based URL
 * (which redirects to the slug URL when a slug exists) only when slug
 * is missing.
 */
export function blogPostHref(post: {
  id?: string | null;
  slug?: string | null;
}): string {
  if (post.slug) return `/blog/${post.slug}`;
  if (post.id) return `/community/post/${post.id}`;
  return "/blog";
}
