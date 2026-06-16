import type { Metadata } from "next";
import { VALORANT } from "@/lib/features/theme/valorant-theme";

export const metadata: Metadata = {
  title: "Home Design Demos",
  robots: { index: false, follow: false },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: VALORANT.bg, color: VALORANT.cream, minHeight: "100vh" }}>
      {children}
    </div>
  );
}
