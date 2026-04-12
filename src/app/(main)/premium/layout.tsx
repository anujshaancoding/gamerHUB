import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium",
  description: "Upgrade to ggLobby Premium for exclusive features, badges, and enhanced gaming profile customization.",
  alternates: { canonical: "https://gglobby.in/premium" },
};

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
