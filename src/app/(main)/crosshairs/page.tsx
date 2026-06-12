import type { Metadata } from "next";
import Link from "next/link";
import { Crosshair, ArrowLeft } from "lucide-react";
import { listValorantCrosshairs } from "@/lib/pro/queries";
import { CrosshairGallery } from "@/components/gaming/tools/crosshair-gallery";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Valorant Pro Crosshair Codes — One-click copy · ggLobby",
  description:
    "Every Indian Valorant pro's crosshair code in one place. Click to copy, paste into Valorant — instant pro crosshair.",
  alternates: { canonical: "/crosshairs" },
  openGraph: {
    title: "Pro Crosshair Codes — Valorant · ggLobby",
    description: "Copy any Indian Valorant pro's crosshair with one click.",
    type: "website",
  },
};

export default async function CrosshairGalleryPage() {
  const entries = await listValorantCrosshairs();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <div>
        <Link href="/tools" className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text mb-3">
          <ArrowLeft className="h-3 w-3" /> All tools
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-red-500/15 border border-red-500/30 p-2.5">
            <Crosshair className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text">Valorant pro crosshairs</h1>
            <p className="text-text-muted mt-1 text-sm">
              Click any code to copy, then paste into Valorant&apos;s crosshair menu (Settings → Crosshair → Import Profile Code).
            </p>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-text-secondary">
          No crosshair codes published yet. Codes appear here as soon as an admin saves them on a pro player page.
        </div>
      ) : (
        <CrosshairGallery entries={entries} />
      )}
    </div>
  );
}
