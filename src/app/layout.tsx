import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import { QueryProvider } from "@/lib/query";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { AuthGateProvider } from "@/components/auth/auth-gate-provider";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { AppShell } from "@/components/layout/AppShell";
import { PageLoadTimer } from "@/components/dev/PageLoadTimer";
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
  title: "GamerHub - Connect. Play. Compete.",
  description: "The ultimate gaming social platform. Create your profile, find teammates, schedule matches, and compete with gamers worldwide.",
  keywords: ["gaming", "social", "esports", "multiplayer", "valorant", "cs2", "dota2", "pubg"],
  authors: [{ name: "GamerHub" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GamerHub",
  },
  openGraph: {
    title: "GamerHub - Connect. Play. Compete.",
    description: "The ultimate gaming social platform for gamers worldwide.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <PWAProvider>
                <AuthGateProvider>
                  <AppShell>{children}</AppShell>
                  <PageLoadTimer />
                </AuthGateProvider>
              </PWAProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
