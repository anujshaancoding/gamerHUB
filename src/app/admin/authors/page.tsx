"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface BlogAuthor {
  id: string;
  user_id: string;
  role: string;
  bio: string | null;
  can_publish_directly: boolean;
  is_verified: boolean;
  articles_count: number;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const res = await fetch(
        `/api/admin/blog-authors?limit=${limit}&offset=${offset}`
      );
      if (res.ok) {
        const data = await res.json();
        setAuthors(data.authors || []);
        setTotal(data.total || 0);
      }
    } catch {
      toast.error("Failed to fetch authors");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  const updateAuthor = async (
    authorId: string,
    updates: Record<string, unknown>
  ) => {
    setUpdatingId(authorId);
    try {
      const res = await fetch("/api/admin/blog-authors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author_id: authorId, updates }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }
      toast.success("Author updated");
      fetchAuthors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const ROLES = ["contributor", "journalist", "editor", "admin"];

  const ROLE_STYLES: Record<string, string> = {
    contributor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    journalist: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    editor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    admin: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <p className="text-sm text-white/50">
          Manage blog authors and their publishing permissions. Authors with{" "}
          <strong className="text-white/70">Direct Publish</strong> enabled can publish posts
          immediately. Others&apos; posts will go to &quot;Pending Review&quot; for admin approval.
        </p>
      </div>

      <p className="text-xs text-white/30">
        {loading ? "Loading..." : `${total} author${total !== 1 ? "s" : ""}`}
      </p>

      {/* Authors table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                Author
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                Role
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden sm:table-cell">
                Articles
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                Direct Publish
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden sm:table-cell">
                Verified
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-violet-400 mx-auto" />
                </td>
              </tr>
            ) : authors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-white/30 text-sm">
                  No blog authors found
                </td>
              </tr>
            ) : (
              authors.map((author) => {
                const isUpdating = updatingId === author.id;
                const roleStyle = ROLE_STYLES[author.role] || ROLE_STYLES.contributor;

                return (
                  <tr
                    key={author.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {author.user?.avatar_url ? (
                          <img
                            src={author.user.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/40">
                            {(author.user?.username || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">
                            {author.user?.display_name || author.user?.username || "Unknown"}
                          </p>
                          <p className="text-xs text-white/30">
                            @{author.user?.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={author.role}
                        onChange={(e) =>
                          updateAuthor(author.id, { role: e.target.value })
                        }
                        disabled={isUpdating}
                        className={`px-2 py-1 rounded text-xs font-medium border bg-transparent focus:outline-none cursor-pointer ${roleStyle}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="bg-[#0a0a12]">
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-white/50">
                        {author.articles_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          updateAuthor(author.id, {
                            can_publish_directly: !author.can_publish_directly,
                          })
                        }
                        disabled={isUpdating}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          author.can_publish_directly
                            ? "bg-green-500"
                            : "bg-white/10"
                        } ${isUpdating ? "opacity-50" : ""}`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            author.can_publish_directly
                              ? "translate-x-4"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <button
                        onClick={() =>
                          updateAuthor(author.id, {
                            is_verified: !author.is_verified,
                          })
                        }
                        disabled={isUpdating}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          author.is_verified
                            ? "bg-violet-500"
                            : "bg-white/10"
                        } ${isUpdating ? "opacity-50" : ""}`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            author.is_verified
                              ? "translate-x-4"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
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
