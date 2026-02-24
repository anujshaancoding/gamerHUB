"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ImageIcon,
  Bug,
  Lightbulb,
  Palette,
  MessageCircle,
} from "lucide-react";

interface FeedbackItem {
  id: string;
  user_id: string | null;
  message: string;
  category: string;
  image_url: string | null;
  page_url: string | null;
  user_agent: string | null;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const CATEGORY_STYLES: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  bug: {
    label: "Bug",
    icon: Bug,
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  feature: {
    label: "Idea",
    icon: Lightbulb,
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  design: {
    label: "Design",
    icon: Palette,
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  general: {
    label: "General",
    icon: MessageCircle,
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
};

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (categoryFilter) params.set("category", categoryFilter);

      const res = await fetch(`/api/admin/feedback?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-white">User Feedback</h1>
        <p className="text-sm text-white/40">
          Feedback submitted by users via the feedback widget
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50 [&>option]:bg-zinc-900 [&>option]:text-white"
        >
          <option value="">All Categories</option>
          <option value="bug">Bug</option>
          <option value="feature">Idea</option>
          <option value="design">Design</option>
          <option value="general">General</option>
        </select>
      </div>

      <p className="text-xs text-white/30">
        {loading
          ? "Loading..."
          : `${total} feedback item${total !== 1 ? "s" : ""} found`}
      </p>

      {/* Feedback list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-violet-400" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center text-white/30 text-sm">
            No feedback found
          </div>
        ) : (
          feedback.map((item) => {
            const cat = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.general;
            const CatIcon = cat.icon;
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
              >
                {/* Header */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : item.id)
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cat.className}`}
                      >
                        <CatIcon className="h-3 w-3" />
                        {cat.label}
                      </span>
                      {item.image_url && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          <ImageIcon className="h-3 w-3" />
                          Screenshot
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70 truncate">
                      {item.message}
                    </p>
                    <p className="text-xs text-white/30 mt-1">
                      by{" "}
                      <span className="text-white/50">
                        {item.profiles?.display_name ||
                          item.profiles?.username ||
                          "Anonymous"}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs text-white/20 hidden sm:block whitespace-nowrap">
                    {formatDate(item.created_at)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-white/20 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/20 flex-shrink-0" />
                  )}
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-4 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">
                        Message
                      </p>
                      <p className="text-sm text-white/70 whitespace-pre-wrap">
                        {item.message}
                      </p>
                    </div>

                    {item.image_url && (
                      <div>
                        <p className="text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">
                          Screenshot
                        </p>
                        <a
                          href={item.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={item.image_url}
                            alt="Feedback screenshot"
                            className="max-w-md rounded-lg border border-white/10"
                          />
                        </a>
                      </div>
                    )}

                    {item.page_url && (
                      <div>
                        <p className="text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">
                          Page URL
                        </p>
                        <p className="text-sm text-violet-400">
                          {item.page_url}
                        </p>
                      </div>
                    )}

                    {item.user_agent && (
                      <div>
                        <p className="text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">
                          User Agent
                        </p>
                        <p className="text-xs text-white/30 break-all">
                          {item.user_agent}
                        </p>
                      </div>
                    )}

                    {item.profiles?.username && (
                      <a
                        href={`/profile/${item.profiles.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View user profile
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/10 text-white/50 hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/10 text-white/50 hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
