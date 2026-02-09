"use client";

import { useState } from "react";
import {
  Check,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { usePendingNews, useModerateNews } from "@/lib/hooks/useNews";
import {
  GAME_DISPLAY_NAMES,
  GAME_COLORS,
  CATEGORY_COLORS,
} from "@/lib/news/constants";
import { NEWS_CATEGORIES } from "@/types/news";
import type { NewsArticle } from "@/types/news";

function ArticleModerationCard({ article }: { article: NewsArticle }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const moderateMutation = useModerateNews();

  const gameName = GAME_DISPLAY_NAMES[article.game_slug] || article.game_slug;
  const gameColor = GAME_COLORS[article.game_slug] || "bg-primary/20 text-primary";
  const categoryInfo = NEWS_CATEGORIES[article.category];
  const categoryColor = CATEGORY_COLORS[article.category] || "bg-gray-500/20 text-gray-400";

  const handlePublish = () => {
    moderateMutation.mutate({ articleId: article.id, action: "publish" });
  };

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    moderateMutation.mutate({
      articleId: article.id,
      action: "reject",
      rejectionReason: rejectionReason || "Not relevant",
    });
  };

  const isPending = moderateMutation.isPending;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={cn("px-2 py-0.5 rounded text-xs font-medium", gameColor)}>
                {gameName}
              </span>
              <span className={cn("px-2 py-0.5 rounded text-xs font-medium", categoryColor)}>
                {categoryInfo?.label || article.category}
              </span>
              {article.ai_relevance_score > 0 && (
                <span className="text-xs text-text-muted">
                  AI Score: {(article.ai_relevance_score * 100).toFixed(0)}%
                </span>
              )}
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                article.status === "approved" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
              )}>
                {article.status}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-text line-clamp-2 mb-1">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="text-xs text-text-muted line-clamp-2">{article.excerpt}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={article.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-text-muted hover:text-text rounded transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border">
            {article.summary && (
              <div className="mb-3">
                <p className="text-xs font-medium text-text-secondary mb-1">AI Summary:</p>
                <p className="text-sm text-text-muted whitespace-pre-wrap">{article.summary}</p>
              </div>
            )}
            {article.tags && article.tags.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                <span className="text-xs text-text-secondary">Tags:</span>
                {article.tags.map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 bg-surface-light rounded text-xs text-text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="text-xs text-text-muted space-y-0.5">
              <p>Source: {article.original_title}</p>
              <p>Region: {article.region}</p>
              {article.ai_processing_error && (
                <p className="flex items-center gap-1 text-warning">
                  <AlertCircle className="h-3 w-3" />
                  AI Error: {article.ai_processing_error}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Reject reason input */}
        {showRejectInput && (
          <div className="mt-3">
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              className="w-full bg-surface-light border border-border rounded p-2 text-sm text-text placeholder-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
              rows={2}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPending}
            leftIcon={<Check className="h-3.5 w-3.5" />}
          >
            Publish
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReject}
            disabled={isPending}
            leftIcon={<X className="h-3.5 w-3.5" />}
            className="text-error hover:text-error"
          >
            {showRejectInput ? "Confirm Reject" : "Reject"}
          </Button>
          {showRejectInput && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowRejectInput(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function NewsModerationQueue() {
  const [statusFilter, setStatusFilter] = useState<string>("approved");
  const { data, isLoading, error } = usePendingNews(statusFilter);

  const articles = (data?.articles || []) as NewsArticle[];
  const total = data?.total || 0;

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex gap-2">
        {[
          { value: "approved", label: "AI Approved" },
          { value: "pending", label: "Pending" },
          { value: "all", label: "All" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-medium transition-colors",
              statusFilter === opt.value
                ? "bg-primary/20 text-primary"
                : "text-text-muted hover:text-text"
            )}
          >
            {opt.label}
          </button>
        ))}
        <span className="text-xs text-text-muted self-center ml-2">
          {total} article{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Articles */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[20vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-error mx-auto mb-2" />
          <p className="text-text-muted">Failed to load moderation queue</p>
        </Card>
      ) : articles.length === 0 ? (
        <Card className="p-6 text-center">
          <Check className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="text-text-muted">No articles waiting for moderation</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <ArticleModerationCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
