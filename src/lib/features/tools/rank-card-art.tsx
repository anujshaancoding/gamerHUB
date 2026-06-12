/**
 * Shared Valorant rank-card artwork (SVG).
 *
 * Used by BOTH the on-screen preview (`valorant-rank-card-client.tsx`) and the
 * downloadable PNG (`/api/og/rank-card` via next/og + Satori). Keep these as
 * plain SVG primitives (polygon / path / circle / line) with attribute-based
 * styling only — Satori does not support CSS classes or SVG `transform` on
 * children, so all geometry is expressed in absolute viewBox coordinates.
 *
 * No "use client" and no React hooks, so it is safe to import on the server
 * (OG route) and the client (preview) alike.
 */

type GemProps = {
  /** Rendered width in px. Height is derived from the gem's aspect ratio. */
  size: number;
  /** Tier accent colour (the gem body colour). */
  accent: string;
};

// Real Valorant rank emblem (official tier artwork). `src` is either the
// proxied own-origin URL (client preview) or the valorant-api.com URL (OG
// image, fetched server-side by Satori). Plain <img> on purpose — Satori does
// not support next/image. Falls back to <RankGem> at call sites when a tier has
// no emblem (Unranked / unknown).
export function RankEmblem({ size, src, alt }: { size: number; src: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? "Rank emblem"}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

// Faceted rank gem — a vertical brilliant-cut stone in a metallic frame, with
// two side "wing" diamonds. Shading is done with translucent white/black facet
// overlays so the whole thing is driven by a single `accent` colour.
export function RankGem({ size, accent }: GemProps) {
  const height = Math.round(size * 1.18);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 200 236"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Soft glow plate behind the gem */}
      <circle cx="100" cy="120" r="96" fill={accent} fillOpacity="0.10" />

      {/* Side wing diamonds (metallic) */}
      <polygon points="22,118 36,104 50,118 36,132" fill="#cdd5dd" />
      <polygon points="28,118 36,110 44,118 36,126" fill={accent} fillOpacity="0.85" />
      <polygon points="150,118 164,104 178,118 164,132" fill="#cdd5dd" />
      <polygon points="156,118 164,110 172,118 164,126" fill={accent} fillOpacity="0.85" />

      {/* Gem body base */}
      <polygon points="100,14 168,92 100,224 32,92" fill={accent} />

      {/* Facet shading */}
      <polygon points="100,14 168,92 100,150" fill="#ffffff" fillOpacity="0.30" />
      <polygon points="100,14 32,92 100,150" fill="#ffffff" fillOpacity="0.12" />
      <polygon points="32,92 100,224 100,150" fill="#000000" fillOpacity="0.22" />
      <polygon points="168,92 100,224 100,150" fill="#000000" fillOpacity="0.40" />
      {/* Bright top crown sliver */}
      <polygon points="100,14 72,46 100,66 128,46" fill="#ffffff" fillOpacity="0.45" />

      {/* Metallic frame */}
      <polygon
        points="100,14 168,92 100,224 32,92"
        fill="none"
        stroke="#e6ecf2"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <polygon
        points="100,26 156,92 100,210 44,92"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Stylised Valorant-style angular "V" mark for the main-agent chip.
export function ValorantMark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="2,4 8,4 14,15 14,21" fill={color} />
      <polygon points="22,4 22,11 16,19 16,8" fill={color} />
    </svg>
  );
}

// Crosshair mark for the role chip.
export function CrosshairMark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="7" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="1.6" fill={color} />
      <line x1="12" y1="1.5" x2="12" y2="5.5" stroke={color} strokeWidth="2" />
      <line x1="12" y1="18.5" x2="12" y2="22.5" stroke={color} strokeWidth="2" />
      <line x1="1.5" y1="12" x2="5.5" y2="12" stroke={color} strokeWidth="2" />
      <line x1="18.5" y1="12" x2="22.5" y2="12" stroke={color} strokeWidth="2" />
    </svg>
  );
}

// Compact rank gem for the peak-rank chip.
export function MiniGem({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 20,10 12,22 4,10" fill={color} />
      <polygon points="12,2 20,10 12,12" fill="#ffffff" fillOpacity="0.4" />
      <polygon points="12,2 20,10 12,22 4,10" fill="none" stroke="#e6ecf2" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
