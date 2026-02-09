"use client";

import Link from "next/link";
import { useLiveStreamers } from "@/lib/hooks/useStreaming";
import { StreamerCard } from "./StreamerCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, ChevronRight, Loader2 } from "lucide-react";

interface LiveNowSectionProps {
  maxItems?: number;
}

export function LiveNowSection({ maxItems = 4 }: LiveNowSectionProps) {
  const { data, isLoading } = useLiveStreamers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  const liveStreamers = data?.streamers?.slice(0, maxItems) || [];

  if (liveStreamers.length === 0) {
    return null; // Don't show section if no one is live
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="h-5 w-5 text-red-500" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
          <h2 className="text-lg font-semibold text-white">Live Now</h2>
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
            {data?.liveCount || 0} streaming
          </Badge>
        </div>

        <Link href="/streamers?filter=live">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {liveStreamers.map((streamer) => (
          <StreamerCard key={streamer.id} streamer={streamer} />
        ))}
      </div>
    </div>
  );
}
