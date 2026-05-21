"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
  Loader2,
  Mail,
} from "lucide-react";
import { useAdminEmails } from "@/lib/hooks/useAdminEmails";

export default function AdminEmailsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const { emails, total, totalPages, loading } = useAdminEmails({
    search: debouncedSearch,
    page,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ format: "csv" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/emails?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Export failed");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gglobby-emails-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Emails exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleCopyPage = async () => {
    const list = emails.map((e) => e.email).join(", ");
    try {
      await navigator.clipboard.writeText(list);
      toast.success(`Copied ${emails.length} email${emails.length !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header / actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Registered Emails</h1>
            <p className="text-xs text-white/40">
              All signed-up users. Export for marketing or outreach.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPage}
            disabled={loading || emails.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white/[0.03] border border-white/10 text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Copy className="h-4 w-4" />
            Copy page
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          type="text"
          placeholder="Search by email or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
        />
      </div>

      <p className="text-xs text-white/30">
        {loading
          ? "Loading..."
          : `${total} email${total !== 1 ? "s" : ""}${
              debouncedSearch ? " matching search" : " registered"
            }`}
      </p>

      {/* Emails table */}
      <div className="rounded-xl border border-white/5 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden sm:table-cell">
                Username
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">
                Source
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden lg:table-cell">
                Verified
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">
                Joined
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
            ) : emails.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-white/30 text-sm"
                >
                  No emails found
                </td>
              </tr>
            ) : (
              emails.map((e) => (
                <tr
                  key={e.email}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm text-white font-medium break-all">
                      {e.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-white/50">
                      {e.username ? `@${e.username}` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                        e.provider === "google"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-white/5 text-white/50 border-white/10"
                      }`}
                    >
                      {e.provider === "google" ? "Google" : "Email"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {e.email_confirmed_at ? (
                      <span className="text-xs text-green-400">Verified</span>
                    ) : (
                      <span className="text-xs text-white/30">Unverified</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/30 hidden md:table-cell">
                    {formatDate(e.created_at)}
                  </td>
                </tr>
              ))
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
