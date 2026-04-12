import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages",
  description: "Your ggLobby messages and conversations.",
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
