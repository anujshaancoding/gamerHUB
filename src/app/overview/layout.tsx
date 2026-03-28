import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview — Find Teammates, Join Clans, Level Up | ggLobby",
  description:
    "ggLobby is the gaming social platform where you find teammates, join clans, track stats, complete quests, and build your gaming reputation — all for free.",
};

export default function OverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
