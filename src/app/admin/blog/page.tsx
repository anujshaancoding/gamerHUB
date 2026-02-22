"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  Trash2,
  Star,
  Pin,
  Eye,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Archive,
  PauseCircle,
  MessageSquare,
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
  useAdminBlogPosts,
  useAdminBlogAction,
  useAdminBlogDelete,
} from "@/lib/hooks/useAdminBlog";
import type { BlogStatus, BlogCategory } from "@/types/blog";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  pending_review: { label: "Pending", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  published: { label: "Published", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  archived: { label: "Archived", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const CATEGORIES: { value: string; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "news", label: "News" },
  { value: "interview", label: "Interview" },
  { value: "analysis", label: "Analysis" },
  { value: "match_report", label: "Match Report" },
  { value: "opinion", label: "Opinion" },
  { value: "transfer", label: "Transfer" },
  { value: "guide", label: "Guide" },
  { value: "announcement", label: "Announcement" },
];

export default function AdminBlogPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BlogStatus | "">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return (params.get("status") as BlogStatus) || "";
    }
    return "";
  });
  const [categoryFilter, setCategoryFilter] = useState<BlogCategory | "">("");
  const [page, setPage] = useState(1);

  const { posts, total, totalPages, loading, refetch } = useAdminBlogPosts({
    search: debouncedSearch,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    page,
  });

  const { updatePost } = useAdminBlogAction();
  const { deletePost } = useAdminBlogDelete();
  const [suggestionSlug, setSuggestionSlug] = useState<string | null>(null);
  const [suggestionText, setSuggestionText] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAction = async (
    slug: string,
    updates: Record<string, unknown>,
    successMsg: string
  ) => {
    try {
      await updatePost({ slug, updates });
      toast.success(successMsg);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleDelete = async (slug: string) => {
    try {
      await deletePost(slug);
      toast.success("Post deleted");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleSubmitSuggestion = async () => {
    if (!suggestionSlug || !suggestionText.trim()) return;
    await handleAction(
      suggestionSlug,
      { editor_notes: suggestionText.trim() },
      "Editor suggestion added"
    );
    setSuggestionSlug(null);
    setSuggestionText("");
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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as BlogStatus | "");
            setPage(1);
          }}
          className="px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending Review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as BlogCategory | "");
            setPage(1);
          }}
          className="px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </div>

      {/* Results count */}
      <p className="text-xs text-white/30">
        {loading ? "Loading..." : `${total} post${total !== 1 ? "s" : ""} found`}
      </p>

      {/* Posts table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                Post
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">
                Author
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden lg:table-cell">
                Stats
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
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">
                  No posts found
                </td>
              </tr>
            ) : (
              posts.map((post) => {
                const status = STATUS_STYLES[post.status] || STATUS_STYLES.draft;
                const author = post.author as { id: string; username: string; display_name: string | null; avatar_url: string | null } | undefined;
                return (
                  <tr
                    key={post.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {post.featured_image_url && (
                          <img
                            src={post.featured_image_url}
                            alt=""
                            className="h-10 w-14 rounded object-cover hidden sm:block"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-[300px]">
                            {post.title}
                            {post.is_featured && (
                              <Star className="inline h-3 w-3 text-yellow-400 ml-1.5" />
                            )}
                            {post.is_pinned && (
                              <Pin className="inline h-3 w-3 text-blue-400 ml-1" />
                            )}
                          </p>
                          <p className="text-xs text-white/30 capitalize">
                            {post.category.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {author?.avatar_url ? (
                          <img
                            src={author.avatar_url}
                            alt=""
                            className="h-6 w-6 rounded-full"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-white/10" />
                        )}
                        <span className="text-xs text-white/50">
                          {author?.display_name || author?.username || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-3 text-xs text-white/30">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post.comments_count}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/30 hidden sm:table-cell">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-white/10 transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-white/40" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/blog/edit/${post.slug}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(`/blog/${post.slug}`, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSuggestionSlug(post.slug);
                              setSuggestionText("");
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2 text-amber-400" />
                            <span className="text-amber-400">Add Suggestion</span>
                          </DropdownMenuItem>
                          {post.status === "published" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction(post.slug, { status: "pending_review" }, "Post put on hold")
                              }
                            >
                              <PauseCircle className="h-4 w-4 mr-2 text-yellow-400" />
                              <span className="text-yellow-400">Hold</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {post.status === "pending_review" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction(post.slug, { status: "published" }, "Post approved and published")
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                              <span className="text-green-400">Approve</span>
                            </DropdownMenuItem>
                          )}
                          {post.status === "pending_review" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction(post.slug, { status: "draft" }, "Post rejected, moved to draft")
                              }
                            >
                              <XCircle className="h-4 w-4 mr-2 text-red-400" />
                              <span className="text-red-400">Reject</span>
                            </DropdownMenuItem>
                          )}
                          {post.status !== "published" && post.status !== "pending_review" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction(post.slug, { status: "published" }, "Post published")
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {post.status === "published" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction(post.slug, { status: "draft" }, "Post unpublished")
                              }
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Unpublish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(
                                post.slug,
                                { is_featured: !post.is_featured },
                                post.is_featured ? "Unfeatured" : "Featured"
                              )
                            }
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {post.is_featured ? "Unfeature" : "Feature"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(
                                post.slug,
                                { is_pinned: !post.is_pinned },
                                post.is_pinned ? "Unpinned" : "Pinned"
                              )
                            }
                          >
                            <Pin className="h-4 w-4 mr-2" />
                            {post.is_pinned ? "Unpin" : "Pin"}
                          </DropdownMenuItem>
                          {post.status !== "archived" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction(post.slug, { status: "archived" }, "Post archived")
                              }
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
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
                                  Delete this post?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete &quot;{post.title}&quot;. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(post.slug)}
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

      {/* Editor Suggestion Modal */}
      {suggestionSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSuggestionSlug(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-zinc-900 border border-white/10 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-400" />
              Add Editor Suggestion
            </h3>
            <p className="text-sm text-white/40 mb-4">
              The blog author will see this note when editing their post.
            </p>
            <textarea
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              placeholder="Write your suggestion or feedback here..."
              rows={4}
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 resize-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSuggestionSlug(null)}
                className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSuggestion}
                disabled={!suggestionText.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Save Suggestion
              </button>
            </div>
          </div>
        </div>
      )}

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
