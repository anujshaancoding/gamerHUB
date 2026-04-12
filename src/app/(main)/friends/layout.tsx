import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Friends",
  description: "Manage your gaming friends list on ggLobby.",
};

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
