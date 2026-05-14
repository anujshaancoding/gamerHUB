/**
 * Amazon India affiliate helper.
 *
 * Builds a search URL with the configured affiliate tag appended so we earn
 * commission on any purchase that comes from a click-through.
 *
 * Set NEXT_PUBLIC_AMAZON_AFFILIATE_TAG in .env (e.g. "gglobby-21").
 * If the tag is missing, we still return a plain Amazon India search URL so
 * the buttons remain useful — we just don't get a kickback.
 */

const AFFILIATE_TAG =
  process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG?.trim() || "";

const AMAZON_IN = "https://www.amazon.in/s";

/**
 * Build an Amazon India search URL for the given gear name, optionally tagged.
 */
export function amazonInSearchUrl(query: string): string {
  const q = query.trim();
  if (!q) return "https://www.amazon.in";
  const url = new URL(AMAZON_IN);
  url.searchParams.set("k", q);
  if (AFFILIATE_TAG) {
    url.searchParams.set("tag", AFFILIATE_TAG);
  }
  return url.toString();
}

export function hasAffiliateTag(): boolean {
  return AFFILIATE_TAG.length > 0;
}
