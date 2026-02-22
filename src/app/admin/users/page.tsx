"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  ExternalLink,
  Flag,
  Shield,
  ShieldOff,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminUsers, useAdminUserAction } from "@/lib/hooks/useAdminUsers";
import { useAdmin } from "@/lib/hooks/useAdmin";
import { getVerificationLevelLabel } from "@/types/verification";
import type { VerificationLevel } from "@/types/verification";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionModal, setActionModal] = useState<{
    userId: string;
    username: string;
    action: "flag" | "restrict";
  } | null>(null);
  const [reason, setReason] = useState("");

  const { adminRole } = useAdmin();
  const { users, total, totalPages, loading, refetch } = useAdminUsers({
    search: debouncedSearch,
    page,
  });
  const { performAction, isPerforming } = useAdminUserAction();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAction = async (userId: string, action: string, extra?: Record<string, unknown>) => {
    try {
      await performAction({ user_id: userId, action, ...extra });
      toast.success(`Action "${action}" completed`);
      setActionModal(null);
      setReason("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
        />
      </div>

      <p className="text-xs text-white/30">
        {loading ? "Loading..." : `${total} user${total !== 1 ? "s" : ""} found`}
      </p>

      {/* Users table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                User
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">
                Verification
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden lg:table-cell">
                Trust
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden sm:table-cell">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden lg:table-cell">
                Joined
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
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const verification = Array.isArray(user.account_verifications)
                  ? user.account_verifications[0]
                  : user.account_verifications;
                const isFlagged = verification?.is_flagged;
                const isRestricted = verification?.is_restricted;
                const trustScore = verification?.trust_score ?? 0;
                const verificationLevel = (verification?.verification_level ?? 0) as VerificationLevel;

                return (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/40">
                            {(user.username || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {user.display_name || user.username}
                            {user.is_admin && (
                              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                {user.admin_role || "Admin"}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-white/30">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-white/50">
                        {getVerificationLevelLabel(verificationLevel)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              trustScore >= 80
                                ? "bg-green-400"
                                : trustScore >= 60
                                ? "bg-blue-400"
                                : trustScore >= 40
                                ? "bg-yellow-400"
                                : "bg-red-400"
                            }`}
                            style={{ width: `${trustScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-white/30">{trustScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {isFlagged && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            Flagged
                          </span>
                        )}
                        {isRestricted && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            Restricted
                          </span>
                        )}
                        {!isFlagged && !isRestricted && (
                          <span className="text-xs text-white/20">Normal</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/30 hidden lg:table-cell">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-white/10 transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-white/40" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(`/profile/${user.username}`, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {isFlagged ? (
                            <DropdownMenuItem
                              onClick={() => handleAction(user.id, "unflag")}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Unflag User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                setActionModal({
                                  userId: user.id,
                                  username: user.username,
                                  action: "flag",
                                })
                              }
                            >
                              <Flag className="h-4 w-4 mr-2" />
                              Flag User
                            </DropdownMenuItem>
                          )}
                          {isRestricted ? (
                            <DropdownMenuItem
                              onClick={() => handleAction(user.id, "unrestrict")}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Remove Restriction
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                setActionModal({
                                  userId: user.id,
                                  username: user.username,
                                  action: "restrict",
                                })
                              }
                              className="text-red-400 focus:text-red-400"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Restrict User
                            </DropdownMenuItem>
                          )}
                          {adminRole === "super_admin" && (
                            <>
                              <DropdownMenuSeparator />
                              {user.is_admin ? (
                                <DropdownMenuItem
                                  onClick={() => handleAction(user.id, "remove_admin")}
                                  className="text-red-400 focus:text-red-400"
                                >
                                  <ShieldOff className="h-4 w-4 mr-2" />
                                  Remove Admin
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleAction(user.id, "make_admin", {
                                        admin_role: "editor",
                                      })
                                    }
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Make Editor
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleAction(user.id, "make_admin", {
                                        admin_role: "moderator",
                                      })
                                    }
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Make Moderator
                                  </DropdownMenuItem>
                                </>
                              )}
                            </>
                          )}
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

      {/* Flag/Restrict modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0a12] border border-white/10 rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {actionModal.action === "flag" ? "Flag" : "Restrict"} @{actionModal.username}
            </h3>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Why are you ${actionModal.action === "flag" ? "flagging" : "restricting"} this user?`}
                rows={3}
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setActionModal(null);
                  setReason("");
                }}
                className="px-4 py-2 text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleAction(actionModal.userId, actionModal.action, {
                    reason: reason.trim() || undefined,
                  })
                }
                disabled={isPerforming}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  actionModal.action === "restrict"
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-yellow-500 hover:bg-yellow-600 text-black"
                }`}
              >
                {isPerforming && <Loader2 className="h-3 w-3 animate-spin" />}
                {actionModal.action === "flag" ? "Flag User" : "Restrict User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
