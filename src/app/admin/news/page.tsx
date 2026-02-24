"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Star,
  Pin,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Gamepad2,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminNewsArticles,
  useAdminNewsAction,
  useAdminNewsDelete,
  useAdminNewsFetch,
} from "@/lib/hooks/useAdminNews";
import type { GameSlug, NewsStatus, NewsCategory, NewsRegion } from "@/types/news";
import { NEWS_CATEGORIES, NEWS_REGIONS } from "@/types/news";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  approved: { label: "Approved", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  published: { label: "Published", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  rejected: { label: "Rejected", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const GAME_STYLES: Record<string, { label: string; className: string }> = {
  valorant: { label: "Valorant", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  bgmi: { label: "BGMI", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  freefire: { label: "Free Fire", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
};

type NewsTab = "manual" | "fetched";

export default function AdminNewsPage() {
  const [activeTab, setActiveTab] = useState<NewsTab>("manual");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<NewsStatus | "">("");
  const [gameFilter, setGameFilter] = useState<GameSlug | "">("");
  const [categoryFilter, setCategoryFilter] = useState<NewsCategory | "">("");
  const [regionFilter, setRegionFilter] = useState<NewsRegion | "">("");
  const [page, setPage] = useState(1);

  const { articles, total, totalPages, loading, refetch } = useAdminNewsArticles({
    search: debouncedSearch,
    status: statusFilter || undefined,
    game: gameFilter || undefined,
    category: categoryFilter || undefined,
    region: regionFilter || undefined,
    type: activeTab,
    page,
  });

  const router = useRouter();
  const { updateArticle } = useAdminNewsAction();
  const { deleteArticle } = useAdminNewsDelete();
  const { fetchNews, isFetching } = useAdminNewsFetch();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleTabChange = (tab: NewsTab) => {
    setActiveTab(tab);
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setGameFilter("");
    setCategoryFilter("");
    setRegionFilter("");
    setPage(1);
  };

  const handleAction = async (
    id: string,
    updates: Record<string, unknown>,
    successMsg: string
  ) => {
    try {
      await updateArticle({ id, updates });
      toast.success(successMsg);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteArticle(id);
      toast.success("Article deleted");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleFetchNews = async () => {
    try {
      const result = await fetchNews();
      const removedMsg = result.totalRemoved ? ` ${result.totalRemoved} old articles removed.` : "";
      toast.success(
        `Fetched from ${result.sourcesProcessed} sources. ${result.totalNew} new articles found.${removedMsg}`
      );
      if (result.errors?.length) {
        result.errors.forEach((e) => toast.error(e));
      }
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fetch failed");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top bar: Title + Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">News Articles</h2>
          <p className="text-xs text-white/40">Manage fetched & manually posted news</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "fetched" && (
            <button
              onClick={handleFetchNews}
              disabled={isFetching}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isFetching ? "Fetching..." : "Fetch Latest News"}
            </button>
          )}
          {activeTab === "manual" && (
            <Link
              href="/admin/news/post"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Post News
            </Link>
          )}
        </div>
      </div>

      {/* Tabs: Our News / Fetched News */}
      <div className="flex gap-1 border-b border-white/10">
        <button
          onClick={() => handleTabChange("manual")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "manual"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-white/40 hover:text-white/60"
          }`}
        >
          Our News
        </button>
        <button
          onClick={() => handleTabChange("fetched")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "fetched"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-white/40 hover:text-white/60"
          }`}
        >
          Fetched News
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <Select value={gameFilter || "all"} onValueChange={(v) => { setGameFilter(v === "all" ? "" : v as GameSlug); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-white/[0.03] border-white/10 text-sm text-white focus:ring-violet-500/50 focus:ring-offset-0">
            <SelectValue placeholder="All Games" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            <SelectItem value="valorant">Valorant</SelectItem>
            <SelectItem value="bgmi">BGMI</SelectItem>
            <SelectItem value="freefire">Free Fire</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v as NewsStatus); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-white/[0.03] border-white/10 text-sm text-white focus:ring-violet-500/50 focus:ring-offset-0">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter || "all"} onValueChange={(v) => { setCategoryFilter(v === "all" ? "" : v as NewsCategory); setPage(1); }}>
          <SelectTrigger className="w-[150px] bg-white/[0.03] border-white/10 text-sm text-white focus:ring-violet-500/50 focus:ring-offset-0">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(NEWS_CATEGORIES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={regionFilter || "all"} onValueChange={(v) => { setRegionFilter(v === "all" ? "" : v as NewsRegion); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-white/[0.03] border-white/10 text-sm text-white focus:ring-violet-500/50 focus:ring-offset-0">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {Object.entries(NEWS_REGIONS).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-xs text-white/30">
        {loading ? "Loading..." : `${total} article${total !== 1 ? "s" : ""} found`}
      </p>

      {/* Articles table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                Article
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">
                Game
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden lg:table-cell">
                Source
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden sm:table-cell">
                Date
              </th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-violet-400 mx-auto" />
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">
                  No news articles found. Click &quot;Fetch Latest News&quot; to pull from RSS sources.
                </td>
              </tr>
            ) : (
              articles.map((article) => {
                const status = STATUS_STYLES[article.status] || STATUS_STYLES.pending;
                const game = GAME_STYLES[article.game_slug];
                const catInfo = NEWS_CATEGORIES[article.category];
                return (
                  <tr
                    key={article.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {article.thumbnail_url && (
                          <img
                            src={article.thumbnail_url}
                            alt=""
                            className="h-10 w-14 rounded object-cover hidden sm:block flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-[300px]">
                            {article.title}
                            {article.is_featured && (
                              <Star className="inline h-3 w-3 text-yellow-400 ml-1.5 fill-yellow-400" />
                            )}
                            {article.is_pinned && (
                              <Pin className="inline h-3 w-3 text-blue-400 ml-1" />
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {catInfo && (
                              <span className="text-[10px] text-white/30 capitalize">
                                {catInfo.label}
                              </span>
                            )}
                            {article.region !== "global" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 uppercase">
                                {article.region}
                              </span>
                            )}
                            {article.views_count > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] text-white/20">
                                <Eye className="h-2.5 w-2.5" />
                                {article.views_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {game && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${game.className}`}>
                          <Gamepad2 className="h-3 w-3" />
                          {game.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-white/40">
                        {(article.source as { name?: string } | undefined)?.name || "Manual"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/30 hidden sm:table-cell">
                      {formatDate(article.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-white/10 transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-white/40" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {article.original_url && (
                            <DropdownMenuItem
                              onClick={() => window.open(article.original_url, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Source
                            </DropdownMenuItem>
                          )}
                          {activeTab === "fetched" && (
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/news/edit/${article.id}`)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Article
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {article.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (activeTab === "fetched") {
                                    router.push(`/admin/news/edit/${article.id}`);
                                  } else {
                                    handleAction(article.id, { status: "published" }, "Article published");
                                  }
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                                <span className="text-green-400">
                                  {activeTab === "fetched" ? "Edit & Publish" : "Publish"}
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleAction(article.id, { status: "approved" }, "Article approved")
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-blue-400" />
                                <span className="text-blue-400">Approve</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleAction(article.id, { status: "rejected" }, "Article rejected")
                                }
                              >
                                <XCircle className="h-4 w-4 mr-2 text-red-400" />
                                <span className="text-red-400">Reject</span>
                              </DropdownMenuItem>
                            </>
                          )}
                          {article.status === "approved" && (
                            <DropdownMenuItem
                              onClick={() => {
                                if (activeTab === "fetched") {
                                  router.push(`/admin/news/edit/${article.id}`);
                                } else {
                                  handleAction(article.id, { status: "published" }, "Article published");
                                }
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                              <span className="text-green-400">
                                {activeTab === "fetched" ? "Edit & Publish" : "Publish"}
                              </span>
                            </DropdownMenuItem>
                          )}
                          {article.status === "published" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction(article.id, { status: "pending" }, "Article unpublished")
                              }
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Unpublish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(
                                article.id,
                                { is_featured: !article.is_featured },
                                article.is_featured ? "Unfeatured" : "Featured"
                              )
                            }
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {article.is_featured ? "Unfeature" : "Feature"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(
                                article.id,
                                { is_pinned: !article.is_pinned },
                                article.is_pinned ? "Unpinned" : "Pinned"
                              )
                            }
                          >
                            <Pin className="h-4 w-4 mr-2" />
                            {article.is_pinned ? "Unpin" : "Pin"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-400 focus:text-red-400"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete this article?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete &quot;{article.title}&quot;. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(article.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
