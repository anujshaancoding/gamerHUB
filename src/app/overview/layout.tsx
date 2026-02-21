import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview - Explore All Features | ggLobby",
  description:
    "Discover everything ggLobby has to offer. Explore 40+ features for gaming social networking, tournaments, clans, messaging, and more.",
};

export default function OverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
