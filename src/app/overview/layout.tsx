import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your Valorant Passport India",
  description:
    "Create your free Valorant Passport for India. Show your rank, peak, main agent, role, state, language and clips before Squad Finder opens.",
};

export default function OverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
