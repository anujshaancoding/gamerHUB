"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Zap,
  Newspaper,
  Shield,
} from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTriggerNewsFetch, useTriggerNewsProcess } from "@/lib/hooks/useNews";
import { NewsModerationQueue } from "@/components/news/NewsModerationQueue";

export default function NewsModeration() {
  const { user, profile } = useAuth();
  const fetchMutation = useTriggerNewsFetch();
  const processMutation = useTriggerNewsProcess();
  const [fetchResult, setFetchResult] = useState<Record<string, unknown> | null>(null);
  const [processResult, setProcessResult] = useState<Record<string, unknown> | null>(null);

  const handleFetch = async () => {
    try {
      const result = await fetchMutation.mutateAsync();
      setFetchResult(result);
    } catch {
      // Error handled by mutation
    }
  };

  const handleProcess = async () => {
    try {
      const result = await processMutation.mutateAsync();
      setProcessResult(result);
    } catch {
      // Error handled by mutation
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="p-8 text-center max-w-md">
          <Shield className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text mb-2">Authentication Required</h2>
          <p className="text-text-muted">You need to be logged in to access the moderation panel.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/community" className="text-text-muted hover:text-text transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text">News Moderation</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Review and publish AI-processed news articles
          </p>
        </div>
      </div>

      {/* Admin Actions */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-text mb-3">Pipeline Controls</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleFetch}
              disabled={fetchMutation.isPending}
              leftIcon={<RefreshCw className={cn("h-4 w-4", fetchMutation.isPending && "animate-spin")} />}
            >
              {fetchMutation.isPending ? "Fetching..." : "Fetch News"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleProcess}
              disabled={processMutation.isPending}
              leftIcon={<Zap className={cn("h-4 w-4", processMutation.isPending && "animate-spin")} />}
            >
              {processMutation.isPending ? "Processing..." : "Process with AI"}
            </Button>
          </div>

          {/* Fetch results */}
          {fetchResult && (
            <div className="mt-3 p-3 bg-surface-light rounded text-xs text-text-muted">
              <p className="font-medium text-text mb-1">Fetch Results:</p>
              <p>Sources fetched: {fetchResult.sources_fetched as number}</p>
              <p>Articles found: {fetchResult.total_found as number}</p>
              <p>New articles: {fetchResult.total_new as number}</p>
            </div>
          )}

          {/* Process results */}
          {processResult && (
            <div className="mt-3 p-3 bg-surface-light rounded text-xs text-text-muted">
              <p className="font-medium text-text mb-1">Process Results:</p>
              <p>Processed: {processResult.processed as number}</p>
              <p>Approved: {processResult.approved as number}</p>
              <p>Rejected: {processResult.rejected as number}</p>
            </div>
          )}

          {fetchMutation.isError && (
            <p className="mt-2 text-xs text-error">
              Fetch failed: {fetchMutation.error?.message}
            </p>
          )}
          {processMutation.isError && (
            <p className="mt-2 text-xs text-error">
              Process failed: {processMutation.error?.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Moderation Queue */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          Moderation Queue
        </h2>
        <NewsModerationQueue />
      </div>
    </div>
  );
}
