"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ScrollText,
  Search,
  RefreshCw,
  ChevronDown,
  Loader2,
  ShieldAlert,
  User,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** High-signal actions get a louder colour so destructive events stand out. */
function actionTone(action: string): string {
  if (/delete|remove|disband|ban/.test(action)) return "bg-red-500/10 text-red-400 border-red-500/20";
  if (/make_admin|admin|super/.test(action)) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (/stop|disable|lock|hide/.test(action)) return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  if (/start|enable|publish|pin/.test(action)) return "bg-green-500/10 text-green-400 border-green-500/20";
  return "bg-violet-500/10 text-violet-400 border-violet-500/20";
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [actorFilter, setActorFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (actorFilter) params.set("actor", actorFilter);
      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [offset, actorFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setActorFilter(search.trim());
  };

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + PAGE_SIZE, total);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-violet-400" />
            Audit Log
          </h2>
          <p className="text-sm text-white/40 mt-1">
            Every sensitive admin action — who did it, what, and when.
          </p>
        </div>
        <button
          onClick={() => fetchLogs()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white/50 text-sm hover:text-white/80 transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by admin email…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm outline-none focus:border-violet-500/50 placeholder:text-white/20"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30 text-sm font-medium hover:bg-violet-500/30 transition-colors"
        >
          Search
        </button>
        {actorFilter && (
          <button
            type="button"
            onClick={() => { setSearch(""); setActorFilter(""); setOffset(0); }}
            className="px-3 py-2 rounded-lg bg-white/5 text-white/50 text-sm hover:bg-white/10 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* List */}
      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            No audit records yet.
            {!actorFilter && " Sensitive admin actions will appear here once the migration is applied."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const hasMeta = log.metadata && Object.keys(log.metadata).length > 0;
            const expanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
              >
                <div className="p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white truncate">
                        {log.actor_email || log.actor_id?.slice(0, 8) || "unknown"}
                      </span>
                      <span className={cn("text-[11px] px-1.5 py-0.5 rounded border font-mono", actionTone(log.action))}>
                        {log.action}
                      </span>
                      <span className="text-xs text-white/20 ml-auto flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        {timeAgo(log.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-white/30">
                      {log.target_type && (
                        <span>
                          target: {log.target_type}
                          {log.target_id ? ` (${log.target_id.slice(0, 12)}${log.target_id.length > 12 ? "…" : ""})` : ""}
                        </span>
                      )}
                      {log.ip && <span>IP: {log.ip}</span>}
                      <span title={new Date(log.created_at).toLocaleString()}>
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {hasMeta && (
                    <button
                      onClick={() => setExpandedId(expanded ? null : log.id)}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors shrink-0",
                        expanded ? "text-violet-400 bg-violet-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5",
                      )}
                      title="View details"
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                    </button>
                  )}
                </div>
                {expanded && hasMeta && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3">
                    <pre className="text-xs text-white/50 whitespace-pre-wrap break-all font-mono bg-black/20 rounded-lg p-3 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-white/40">
            {pageStart}–{pageEnd} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={pageEnd >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
