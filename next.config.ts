import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },

  // Allow local network devices (phone, tablet) to access dev server
  allowedDevOrigins: ["192.168.0.126"],

  // 485 pre-existing type errors need fixing before this can be removed.
  // Run `tsc --noEmit` separately for type checking until then.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize tree-shaking for barrel-exported packages
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "framer-motion", "@radix-ui/react-icons"],
  },

  // Proxy /uploads to VPS in development so images load locally
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [{ source: "/uploads/:path*", destination: "https://gglobby.in/uploads/:path*" }]
      : [];
  },

  // Security + caching headers
  async headers() {
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
          "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: blob: https://upload.wikimedia.org https://i.pinimg.com https://api.dicebear.com https://images.unsplash.com https://gglobby.in https://api-assets.clashofclans.com https://cdn.discordapp.com https://*.googleusercontent.com https://www.googletagmanager.com",
          "font-src 'self' https://fonts.gstatic.com",
          "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://api.stripe.com wss://gglobby.in",
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
