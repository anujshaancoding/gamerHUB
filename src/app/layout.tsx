import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import { QueryProvider } from "@/lib/query";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { PresenceProvider } from "@/lib/presence/PresenceProvider";
import { AuthGateProvider } from "@/components/auth/auth-gate-provider";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { AppShell } from "@/components/layout/AppShell";
// import { PageLoadTimer } from "@/components/dev/PageLoadTimer";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { GoogleAnalytics } from "@/components/analytics";
import { JsonLd, BASE_URL, SITE_NAME, SITE_DESCRIPTION, ORGANIZATION_JSONLD } from "@/lib/seo";
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
  keywords: ["gaming", "social", "esports", "multiplayer", "valorant", "bgmi", "freefire", "gg", "lobby", "gamer"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <GoogleAnalytics />
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: ORGANIZATION_JSONLD.name,
              url: ORGANIZATION_JSONLD.url,
              logo: ORGANIZATION_JSONLD.logo,
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
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
            <PresenceProvider>
            <ThemeProvider>
              <PWAProvider>
                <AuthGateProvider>
                  <AppShell>{children}</AppShell>
                  {/* <PageLoadTimer /> */}
                  <FeedbackWidget />
                  <Toaster theme="dark" position="bottom-right" richColors />
                  <PWAInstallPrompt />
                </AuthGateProvider>
              </PWAProvider>
            </ThemeProvider>
          </PresenceProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
