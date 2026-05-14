import type { Metadata } from "next";
import Link from "next/link";
import { Construction, ArrowRight } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Player Insights · ggLobby",
  description: "Player Insights is on hold while we rework how stats are sourced. Check back soon.",
  robots: { index: false, follow: false },
};

export default function TrackerOnHoldPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <Card variant="elevated" className="max-w-xl w-full">
        <CardContent className="p-8 sm:p-10 text-center space-y-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Construction className="w-7 h-7 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-text">
              Player Insights is on hold
            </h1>
            <p className="text-text-secondary text-sm sm:text-base">
              We&apos;re rethinking how this feature sources real game data so the stats it shows are
              actually trustworthy. The page is paused until we have something worth shipping.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-light p-4 text-left text-sm text-text-secondary space-y-2">
            <p className="text-text font-medium">Why it&apos;s paused</p>
            <p>
              CS2 and Valorant have official data paths we can use. BGMI and Free Fire don&apos;t —
              there&apos;s no official API, and the third-party scrapers break too often to be a
              real product. We&apos;d rather hold than ship something fake.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/pro">
              <Button variant="primary" className="w-full sm:w-auto">
                Explore Pro Scene
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/tools">
              <Button variant="secondary" className="w-full sm:w-auto">
                Try Gamer Tools
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
