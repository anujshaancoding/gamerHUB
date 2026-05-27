import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to this directory. Without this, Next 16
  // mis-infers the root as the parent dir when the project path contains a
  // space (e.g. "e:\OFFICE WORK\gamer hub"), which breaks tailwindcss resolution.
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Remove X-Powered-By header for security + smaller response
  poweredByHeader: false,

  // Enable gzip compression
  compress: true,

  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Serve modern formats when supported
    formats: ["image/avif", "image/webp"],
    // Keep optimized image responses on the server for 30 days. Riot/Valorant
    // asset UUIDs are stable, so a repeat visitor never re-downloads.
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/**",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "gglobby.in",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "api-assets.clashofclans.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "media.valorant-api.com",
        pathname: "/**",
      },
    ],
  },

  // Allow local network devices (phone, tablet) to access dev server.
  // Only honored in dev; production deploys leave this empty so a LAN attacker
  // on the same subnet as the VPS can't satisfy Next's dev-origin check.
  allowedDevOrigins:
    process.env.NODE_ENV === "development"
      ? (process.env.ALLOWED_DEV_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean)
      : [],

  // 485 pre-existing type errors need fixing before this can be removed.
  // Run `tsc --noEmit` separately for type checking until then.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize tree-shaking for barrel-exported packages
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "framer-motion", "@radix-ui/react-icons"],
  },

  // Permanent redirects for V2 route moves to top-level SEO-canonical paths.
  // Keeps any indexed/bookmarked/external V1 links alive (308 preserves method
  // and signals a permanent move to crawlers).
  async redirects() {
    return [
      { source: "/pro/valorant", destination: "/pros", permanent: true },
      {
        source: "/pro/valorant/:slug",
        destination: "/pros/:slug",
        permanent: true,
      },
      { source: "/tools/crosshairs", destination: "/crosshairs", permanent: true },
      { source: "/tools/tier-list", destination: "/tier-list", permanent: true },

      // Frozen Phase-3 social routes (V2-PLAN.md: "keep code, remove from
      // nav"). The code/routes still exist but must not be reachable or
      // render half-broken for users who hit a direct/legacy URL. Temporary
      // (307) — these are paused for V2, not gone forever (Phase 3 revives
      // them), so we do NOT signal a permanent move to crawlers.
      // NOTE: /find-gamers, /lfg and /messages were re-surfaced in nav under
      // "You" and are NOT frozen — they must stay routable.
      ...["/clans", "/friends"].flatMap((base) => [
        { source: base, destination: "/", permanent: false },
        { source: `${base}/:path*`, destination: "/", permanent: false },
      ]),
    ];
  },

  // Proxy /uploads to VPS in development so images load locally
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [{ source: "/uploads/:path*", destination: "https://gglobby.in/uploads/:path*" }]
      : [];
  },

  // Security + caching headers
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    // Next.js/Turbopack dev mode needs eval + ws for HMR and source-map reconstruction.
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com"
      : "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com";
    const connectSrc = isDev
      ? "connect-src 'self' ws: wss: https://www.google-analytics.com https://www.googletagmanager.com https://api.stripe.com wss://gglobby.in"
      : "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://api.stripe.com wss://gglobby.in";

    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=()" },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          scriptSrc,
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: blob: https://upload.wikimedia.org https://i.pinimg.com https://api.dicebear.com https://images.unsplash.com https://gglobby.in https://api-assets.clashofclans.com https://cdn.discordapp.com https://*.googleusercontent.com https://www.googletagmanager.com https://media.valorant-api.com",
          "font-src 'self' https://fonts.gstatic.com",
          connectSrc,
          "media-src 'self' https:",
          "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.twitch.tv https://js.stripe.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "upgrade-insecure-requests",
        ].join("; "),
      },
    ];

    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
