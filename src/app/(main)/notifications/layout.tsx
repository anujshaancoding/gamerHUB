import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your ggLobby notifications.",
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
