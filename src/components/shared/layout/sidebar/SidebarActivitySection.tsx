"use client";

import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSidebarActivity } from "@/lib/hooks/useSidebarActivity";
import { CompactActivityItem } from "./CompactActivityItem";

export function SidebarActivitySection() {
  const { items, loading } = useSidebarActivity();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-text">Activity</h3>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-2.5 px-2 py-2 animate-pulse">
              <div className="w-4 h-4 rounded bg-surface-light mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-full bg-surface-light rounded mb-1" />
                <div className="h-3 w-20 bg-surface-light rounded" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-sm text-text-muted">No recent activity</p>
          </Card>
        ) : (
          items.map((item) => (
            <CompactActivityItem key={`${item.type}-${item.id}`} item={item} />
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="shrink-0 pt-2 border-t border-border mt-2">
          <Link href="/community">
            <Button variant="ghost" size="sm" className="w-full text-text-muted">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
