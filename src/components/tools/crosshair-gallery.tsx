"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Badge } from "@/components/ui";
import type { CrosshairEntry } from "@/lib/pro/queries";

interface Props {
  entries: CrosshairEntry[];
}

export function CrosshairGallery({ entries }: Props) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  const roles = useMemo(() => {
    const s = new Set(entries.map((e) => e.role).filter(Boolean) as string[]);
    return ["", ...Array.from(s).sort()];
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (roleFilter && e.role !== roleFilter) return false;
      if (!q) return true;
      return (
        e.ign.toLowerCase().includes(q) ||
        (e.team_name?.toLowerCase().includes(q) ?? false) ||
        (e.role?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [entries, query, roleFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players, teams or roles…"
            className="w-full pl-9 pr-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
        >
          {roles.map((r) => (
            <option key={r || "all"} value={r}>{r || "All roles"}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-text-muted">{filtered.length} of {entries.length} pros</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((e) => (
          <CrosshairCard key={e.player_id} entry={e} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-text-muted col-span-full text-center py-8">No matches.</p>
        )}
      </div>
    </div>
  );
}

function CrosshairCard({ entry }: { entry: CrosshairEntry }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(entry.crosshair_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar src={entry.photo_url ?? undefined} alt={entry.ign} size="md" fallback={entry.ign[0]} />
        <div className="flex-1 min-w-0">
          <Link href={`/pros/${entry.player_slug}`} className="font-semibold text-text hover:text-primary truncate block">
            {entry.ign}
          </Link>
          <p className="text-xs text-text-muted truncate">
            {entry.team_short ?? entry.team_name ?? "Free agent"}
            {entry.role && <> · {entry.role}</>}
          </p>
        </div>
        {entry.role && <Badge variant="secondary" size="sm">{entry.role.split(" ")[0]}</Badge>}
      </div>

      <button
        onClick={copy}
        className={cn(
          "mt-3 w-full rounded-lg border px-3 py-2.5 font-mono text-xs flex items-center justify-between gap-2 transition-colors",
          copied ? "border-success/40 bg-success/10 text-success" : "border-border bg-surface-light/40 text-text hover:border-primary/40"
        )}
      >
        <span className="truncate text-left">{entry.crosshair_code}</span>
        {copied ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <Copy className="h-3.5 w-3.5 flex-shrink-0" />}
      </button>
    </div>
  );
}
