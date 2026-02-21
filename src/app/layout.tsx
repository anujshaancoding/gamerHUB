import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import { QueryProvider } from "@/lib/query";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { PresenceProvider } from "@/lib/presence/PresenceProvider";
import { AuthGateProvider } from "@/components/auth/auth-gate-provider";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { AppShell } from "@/components/layout/AppShell";
// import { PageLoadTimer } from "@/components/dev/PageLoadTimer";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
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
  title: "ggLobby - Where Gamers Unite",
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
    google: "_fOha3A6zhf9yZkYw34lQa6hO0KFMDsorhDzs75QBYE",
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
