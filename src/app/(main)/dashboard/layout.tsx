import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personalized gaming dashboard on ggLobby.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
