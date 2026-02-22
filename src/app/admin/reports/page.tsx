"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useAdminReports, useResolveReport } from "@/lib/hooks/useAdminReports";
import type { ReportStatus, ReportPriority, ReportType } from "@/types/verification";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  investigating: { label: "Investigating", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  resolved: { label: "Resolved", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  dismissed: { label: "Dismissed", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  escalated: { label: "Escalated", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const PRIORITY_STYLES: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  normal: { label: "Normal", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  high: { label: "High", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  critical: { label: "Critical", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  bot: "Bot",
  fake_account: "Fake Account",
  harassment: "Harassment",
  spam: "Spam",
  toxic: "Toxic",
  cheating: "Cheating",
  impersonation: "Impersonation",
  other: "Other",
};

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<ReportPriority | "">("");
  const [typeFilter, setTypeFilter] = useState<ReportType | "">("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState<{ id: string; action: ReportStatus } | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionAction, setResolutionAction] = useState("");

  const { reports, total, totalPages, loading, refetch } = useAdminReports({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    report_type: typeFilter || undefined,
    page,
  });

  const { resolveReport, isResolving } = useResolveReport();

  const handleResolve = async (reportId: string, status: ReportStatus) => {
    if (["resolved", "dismissed"].includes(status) && !resolutionNote.trim()) {
      toast.error("Please add a resolution note");
      return;
    }

    try {
      await resolveReport({
        report_id: reportId,
        status,
        resolution_note: resolutionNote.trim() || undefined,
        resolution_action: resolutionAction.trim() || undefined,
      });
      toast.success(`Report ${status}`);
      setResolveModal(null);
      setResolutionNote("");
      setResolutionAction("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update report");
    }
  };

  const quickAction = async (reportId: string, status: ReportStatus) => {
    try {
      await resolveReport({ report_id: reportId, status });
      toast.success(`Report marked as ${status}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ReportStatus | "");
            setPage(1);
          }}
          className="px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="escalated">Escalated</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value as ReportPriority | "");
            setPage(1);
          }}
          className="px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as ReportType | "");
            setPage(1);
          }}
          className="px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
        >
          <option value="">All Types</option>
          {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-white/30">
        {loading ? "Loading..." : `${total} report${total !== 1 ? "s" : ""} found`}
      </p>

      {/* Reports list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-violet-400" />
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center text-white/30 text-sm">
            No reports found
          </div>
        ) : (
          reports.map((report) => {
            const statusStyle = STATUS_STYLES[report.status] || STATUS_STYLES.pending;
            const priorityStyle = PRIORITY_STYLES[report.priority] || PRIORITY_STYLES.normal;
            const isExpanded = expandedId === report.id;
            const reportedUser = report.reported_user as { id: string; username: string; display_name?: string; avatar_url?: string } | undefined;
            const reporter = report.reporter as { id: string; username: string; display_name?: string; avatar_url?: string } | undefined;

            return (
              <div
                key={report.id}
                className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
              >
                {/* Report header */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${priorityStyle.className}`}
                      >
                        {priorityStyle.label}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusStyle.className}`}
                      >
                        {statusStyle.label}
                      </span>
                      <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">
                        {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/60">
                        <strong className="text-red-400">
                          {reportedUser?.display_name || reportedUser?.username || "Unknown"}
                        </strong>
                        {" "}reported by{" "}
                        <span className="text-white/40">
                          {reporter?.display_name || reporter?.username || "Anonymous"}
                        </span>
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-white/20 hidden sm:block whitespace-nowrap">
                    {formatDate(report.created_at)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-white/20 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/20 flex-shrink-0" />
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-4 space-y-4">
                    {report.description && (
                      <div>
                        <p className="text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">Description</p>
                        <p className="text-sm text-white/70">{report.description}</p>
                      </div>
                    )}

                    {report.context_type && (
                      <div>
                        <p className="text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">Context</p>
                        <p className="text-sm text-white/50 capitalize">{report.context_type}</p>
                      </div>
                    )}

                    {report.evidence_urls && report.evidence_urls.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">Evidence</p>
                        <div className="space-y-1">
                          {report.evidence_urls.map((url: string, i: number) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.resolution_note && (
                      <div>
                        <p className="text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">Resolution Note</p>
                        <p className="text-sm text-white/50">{report.resolution_note}</p>
                      </div>
                    )}

                    {/* View user profile link */}
                    {reportedUser?.username && (
                      <a
                        href={`/profile/${reportedUser.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View reported user profile
                      </a>
                    )}

                    {/* Actions */}
                    {!["resolved", "dismissed"].includes(report.status) && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                        {report.status === "pending" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              quickAction(report.id, "investigating");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
                          >
                            <Clock className="h-3 w-3" />
                            Investigate
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setResolveModal({ id: report.id, action: "resolved" });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Resolve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setResolveModal({ id: report.id, action: "dismissed" });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded-lg hover:bg-zinc-500/20 transition-colors"
                        >
                          <XCircle className="h-3 w-3" />
                          Dismiss
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            quickAction(report.id, "escalated");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Escalate
                        </button>
                      </div>
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

      {/* Resolve/Dismiss modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0a12] border border-white/10 rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {resolveModal.action === "resolved" ? "Resolve Report" : "Dismiss Report"}
            </h3>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                Resolution Note *
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Describe the resolution..."
                rows={3}
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                Action Taken (optional)
              </label>
              <input
                type="text"
                value={resolutionAction}
                onChange={(e) => setResolutionAction(e.target.value)}
                placeholder="e.g., User warned, Account suspended..."
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setResolveModal(null);
                  setResolutionNote("");
                  setResolutionAction("");
                }}
                className="px-4 py-2 text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve(resolveModal.id, resolveModal.action)}
                disabled={isResolving}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  resolveModal.action === "resolved"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-zinc-600 hover:bg-zinc-700 text-white"
                }`}
              >
                {isResolving && <Loader2 className="h-3 w-3 animate-spin" />}
                {resolveModal.action === "resolved" ? "Resolve" : "Dismiss"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
