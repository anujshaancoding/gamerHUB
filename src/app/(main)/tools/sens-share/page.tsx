import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Smartphone } from "lucide-react";
import { SensShareBoard } from "@/components/gaming/tools/sens-share-board";

export const metadata: Metadata = {
  title: "Community Sensitivity Share — Valorant configs · ggLobby",
  description:
    "Publish your full Valorant sens config. Copy any pro's setup with one click — sorted by upvotes.",
  alternates: { canonical: "/tools/sens-share" },
};

export default function SensSharePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <div>
        <Link href="/tools" className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text mb-3">
          <ArrowLeft className="h-3 w-3" /> All tools
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-500/15 border border-orange-500/30 p-2.5">
            <Smartphone className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text">Community sens share</h1>
            <p className="text-text-muted mt-1 text-sm">
              Publish your sens, see what configs the rest of the community is running.
              Sorted by upvotes. Sign in to publish or vote.
            </p>
          </div>
        </div>
      </div>

      <SensShareBoard />
    </div>
  );
}
