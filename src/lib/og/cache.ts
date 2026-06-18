/**
 * Shared caches for `next/og` (Satori) image routes.
 *
 * Satori re-fetches every remote `<img src>` and every font on each render and
 * keeps nothing between requests, so an OG route that renders the same art/font
 * pays the network cost every time. These module-level caches resolve each
 * asset once per server instance; warm renders then do zero asset network I/O.
 *
 * Adopt these in every OG route (profile, post, rank-card, …) instead of
 * re-implementing per route — see src/app/api/og/rank-card/route.tsx.
 */

export type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal";
};

// ── Remote image art → cached data URI ──────────────────────────────────────
const artCache = new Map<string, string>();

/**
 * Resolve a remote image URL to a base64 data URI and cache it for the server's
 * lifetime, so Satori does no network fetch on warm renders. Returns the raw
 * URL on any failure (Satori then fetches it itself, as before) and null for a
 * null input.
 */
export async function artUri(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const cached = artCache.get(url);
  if (cached) return cached;
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";
    const uri = `data:${contentType};base64,${Buffer.from(buf).toString("base64")}`;
    artCache.set(url, uri);
    return uri;
  } catch {
    return url;
  }
}

// ── Google Fonts (TTF for Satori) → cached per family+weight ─────────────────
// Sending NO user-agent makes Google's css2 endpoint serve plain TTF (Satori
// cannot parse woff/woff2). Every failure is swallowed — a missing weight just
// falls back to the built-in font, never a 500.
const fontCache = new Map<string, SatoriFont>();

/**
 * Load the requested Google Font weights as Satori fonts, in parallel, caching
 * each family+weight across requests and instances. Pass the families/weights a
 * given card needs; the returned array only contains weights that loaded.
 */
export async function loadFonts(
  wanted: Array<{ family: string; weight: SatoriFont["weight"] }>,
): Promise<SatoriFont[]> {
  const results = await Promise.all(
    wanted.map(async ({ family, weight }): Promise<SatoriFont | null> => {
      const key = `${family}:${weight}`;
      const cached = fontCache.get(key);
      if (cached) return cached;
      try {
        const css = await fetch(
          `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`,
        ).then((r) => r.text());
        const url = css.match(/src:\s*url\((https:\/\/[^)]+\.ttf)\)/)?.[1];
        if (!url) return null;
        const data = await fetch(url).then((r) => r.arrayBuffer());
        const font: SatoriFont = { name: family, data, weight, style: "normal" };
        fontCache.set(key, font);
        return font;
      } catch {
        return null;
      }
    }),
  );
  return results.filter((f): f is SatoriFont => f !== null);
}

/** Shared long-lived cache header for deterministic OG images. */
export const OG_CACHE_CONTROL =
  "public, max-age=600, s-maxage=2592000, stale-while-revalidate=604800";
