import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Write",
  description: "Create and publish content on ggLobby.",
};

export default function WriteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
