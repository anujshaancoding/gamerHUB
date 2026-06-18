import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/features/theme";
import { QueryProvider } from "@/lib/query";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { SocketProvider } from "@/lib/realtime/SocketProvider";
import { PresenceProvider } from "@/lib/presence/PresenceProvider";
import { AuthGateProvider } from "@/components/shared/auth/auth-gate-provider";
import { PWAProvider } from "@/components/system/pwa/PWAProvider";
import { PWAInstallPrompt } from "@/components/system/pwa/PWAInstallPrompt";
import { AppShell } from "@/components/shared/layout/AppShell";
import { FeedbackWidget } from "@/components/system/feedback/feedback-widget";
import { PageViewTracker } from "@/components/system/analytics";
import { JsonLd, BASE_URL, SITE_NAME, SITE_DESCRIPTION, ORGANIZATION_JSONLD } from "@/lib/features/seo";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://gglobby.in"),
  title: {
    default: "ggLobby - Where Gamers Unite",
    template: "%s | ggLobby",
  },
  description: "The ultimate gaming social platform. Connect with gamers, find teammates, and compete worldwide. GG starts here.",
  keywords: ["gaming", "social", "esports", "multiplayer", "valorant", "gg", "lobby", "gamer"],
  authors: [{ name: "ggLobby" }],
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ggLobby",
  },
  openGraph: {
    title: "ggLobby - Where Gamers Unite",
    description: "The ultimate gaming social platform for gamers worldwide. GG starts here.",
    type: "website",
    siteName: "ggLobby",
    url: "https://gglobby.in",
  },
  twitter: {
    card: "summary_large_image",
    title: "ggLobby - Where Gamers Unite",
    description: "The ultimate gaming social platform for gamers worldwide. GG starts here.",
  },
  verification: {
    google: [
      "_fOha3A6zhf9yZkYw34lQa6hO0KFMDsorhDzs75QBYE",
      "vj3nOvDs5QgHHN227bkiRwziaSp_GHsGuhgUVpPzy1s",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <head>
        {/* Preconnect/dns-prefetch to external origins for faster resource loading.
            Note: no Google-Fonts preconnect — fonts are self-hosted via next/font,
            so fonts.googleapis.com / fonts.gstatic.com are never requested. */}
        <link rel="dns-prefetch" href="https://api.dicebear.com" />
        <link rel="dns-prefetch" href="https://cdn.discordapp.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Google Analytics intentionally removed (2026-06-06): we rely on
            first-party analytics only, so the Privacy Policy's "no cross-site
            tracking cookies" statement stays true. Do not re-add without a
            matching policy update + consent gate. */}
        <PageViewTracker />
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              ...ORGANIZATION_JSONLD,
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              alternateName: ORGANIZATION_JSONLD.alternateName,
              url: BASE_URL,
              description: SITE_DESCRIPTION,
              publisher: {
                "@type": "Organization",
                name: ORGANIZATION_JSONLD.name,
                url: ORGANIZATION_JSONLD.url,
              },
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            },
          ]}
        />
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
            <PresenceProvider>
            <ThemeProvider>
              <PWAProvider>
                <AuthGateProvider>
                  {/* Skip navigation link for keyboard/screen reader users (WCAG 2.4.1) */}
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-background focus:text-sm focus:font-semibold"
                  >
                    Skip to main content
                  </a>
                  <AppShell>{children}</AppShell>
                  <FeedbackWidget />
                  <Toaster theme="dark" position="bottom-right" richColors />
                  <PWAInstallPrompt />
                </AuthGateProvider>
              </PWAProvider>
            </ThemeProvider>
          </PresenceProvider>
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
