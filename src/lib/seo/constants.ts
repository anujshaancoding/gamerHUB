export const SITE_NAME = "ggLobby";
export const SITE_TAGLINE = "Where Gamers Unite";
export const SITE_DESCRIPTION =
  "The ultimate gaming social platform. Connect with gamers, find teammates, and compete worldwide. GG starts here.";

export const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://gglobby.in";

export const ORGANIZATION_JSONLD = {
  "@type": "Organization" as const,
  name: SITE_NAME,
  url: BASE_URL,
  logo: {
    "@type": "ImageObject" as const,
    url: `${BASE_URL}/icons/icon-512x512.png`,
    width: 512,
    height: 512,
  },
};
