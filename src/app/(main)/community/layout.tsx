import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Join the ggLobby gaming community. Read articles, discuss strategies, participate in tournaments, and connect with gamers across India.",
  openGraph: {
    title: "Community | ggLobby",
    description:
      "Join the ggLobby gaming community. Read articles, discuss strategies, and connect with gamers across India.",
    type: "website",
  },
  alternates: {
    canonical: "/community",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
