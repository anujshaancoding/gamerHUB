"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface SyncJob {
  id: string;
  sync_type: string;
  status: "pending" | "syncing" | "completed" | "failed";
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  stats_synced: number;
  matches_synced: number;
  created_at: string;
}

interface SyncStatusProps {
  jobs: SyncJob[];
  isSyncing: boolean;
  activeSyncJob: SyncJob | null;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/50",
    label: "Pending",
  },
  syncing: {
    icon: Loader2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
    label: "Syncing",
  },
  completed: {
    icon: Check,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/50",
    label: "Completed",
  },
  failed: {
    icon: X,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/50",
    label: "Failed",
  },
};

export function SyncStatus({
  jobs,
  isSyncing,
  activeSyncJob,
  className,
}: SyncStatusProps) {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Active Sync Indicator */}
      {isSyncing && activeSyncJob && (
        <Card className="p-3 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-300">
                Syncing in progress...
              </p>
              <p className="text-xs text-blue-400/70">
                Started{" "}
                {activeSyncJob.started_at
                  ? formatDistanceToNow(new Date(activeSyncJob.started_at), {
                      addSuffix: true,
                    })
                  : "just now"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Sync Jobs */}
      <div className="space-y-1">
        <p className="text-xs text-zinc-500 font-medium">Recent Syncs</p>
        {jobs.slice(0, 5).map((job) => {
          const config = statusConfig[job.status];
          const Icon = config.icon;

          return (
            <div
              key={job.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-900/50"
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={cn(
                    "h-4 w-4",
                    config.color,
                    job.status === "syncing" && "animate-spin"
                  )}
                />
                <div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      config.bgColor,
                      config.color,
                      config.borderColor
                    )}
                  >
                    {config.label}
                  </Badge>
                </div>
              </div>

              <div className="text-right">
                {job.status === "completed" && (
                  <p className="text-xs text-zinc-500">
                    {job.stats_synced} stats, {job.matches_synced} matches
                  </p>
                )}
                {job.status === "failed" && job.error_message && (
                  <p className="text-xs text-red-400 max-w-[200px] truncate">
                    {job.error_message}
                  </p>
                )}
                <p className="text-xs text-zinc-600">
                  {formatDistanceToNow(new Date(job.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
