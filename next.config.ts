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

  // Run `tsc --noEmit` separately for type checking (Turbopack's checker can OOM on large type files).
  // Do NOT set ignoreBuildErrors — build must fail on type errors.

  // Optimize tree-shaking for barrel-exported packages
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "framer-motion", "@radix-ui/react-icons"],
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
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: blob: https: http:",
          "font-src 'self' https://fonts.gstatic.com",
          "connect-src 'self' https: wss:",
          "media-src 'self' https:",
          "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.twitch.tv https://js.stripe.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
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
