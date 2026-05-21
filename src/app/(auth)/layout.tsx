import { VALORANT } from "@/lib/theme/valorant-theme";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{ background: VALORANT.bg, color: VALORANT.cream }}
    >
      <main id="main-content">{children}</main>
    </div>
  );
}
