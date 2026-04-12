import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for gamers, clans, posts, and more on ggLobby.",
  alternates: { canonical: "https://gglobby.in/search" },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
