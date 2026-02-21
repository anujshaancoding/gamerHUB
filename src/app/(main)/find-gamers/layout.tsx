import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Gamers",
  description:
    "Find and connect with gamers who match your playstyle. Filter by game, rank, region, and language on ggLobby.",
  openGraph: {
    title: "Find Gamers | ggLobby",
    description:
      "Find and connect with gamers who match your playstyle on ggLobby.",
    type: "website",
  },
  alternates: {
    canonical: "/find-gamers",
  },
};

export default function FindGamersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
