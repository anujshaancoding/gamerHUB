export const SITE_NAME = "ggLobby";
export const SITE_TAGLINE = "Where Gamers Unite";
export const SITE_DESCRIPTION =
  "The ultimate gaming social platform. Connect with gamers, find teammates, and compete worldwide. GG starts here.";

export const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://gglobby.in";

/**
 * Brand-name variants. Google autocorrects the coined name "gglobby" to the
 * common word / npm package "globby", which buries us on brand searches.
 * Declaring these as `alternateName` on the Organization/WebSite entity tells
 * Google "gglobby" is a real, distinct brand — the strongest on-site signal we
 * have against that autocorrect.
 */
export const BRAND_ALTERNATE_NAMES = ["gglobby", "gg lobby", "GG Lobby"];

/**
 * Official profiles that prove ggLobby is a real entity (Organization `sameAs`).
 * Add the canonical URL for each profile we actually control. Leaving this empty
 * weakens the entity signal — fill it with real, live URLs only.
 */
export const BRAND_SAME_AS: string[] = [];

export const ORGANIZATION_JSONLD = {
  "@type": "Organization" as const,
  name: SITE_NAME,
  alternateName: BRAND_ALTERNATE_NAMES,
  url: BASE_URL,
  logo: {
    "@type": "ImageObject" as const,
    url: `${BASE_URL}/icons/icon-512x512.png`,
    width: 512,
    height: 512,
  },
  ...(BRAND_SAME_AS.length > 0 ? { sameAs: BRAND_SAME_AS } : {}),
};
