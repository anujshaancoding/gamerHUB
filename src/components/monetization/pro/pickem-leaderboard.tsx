import Link from "next/link";
import { Crown } from "lucide-react";
import { Avatar } from "@/components/ui";
import type { PickemLeaderRow } from "@/lib/pro/pickem-queries";

export function PickemLeaderboard({ rows }: { rows: PickemLeaderRow[] }) {
  return (
    <aside className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-3 bg-surface-light/30 border-b border-border flex items-center gap-2">
        <Crown className="h-4 w-4 text-warning" />
        <h2 className="text-sm font-semibold text-text">Leaderboard</h2>
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-text-muted">No results yet. Once matches resolve, points appear here.</p>
      ) : (
        <ol className="divide-y divide-border/50">
          {rows.map((r, i) => (
            <li key={r.user_id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-6 text-xs font-mono font-semibold text-text-muted text-right">{i + 1}</span>
              <Avatar src={r.avatar_url ?? undefined} size="xs" alt={r.username ?? ""} fallback={(r.display_name || r.username || "?")[0]} />
              <Link
                href={r.username ? `/profile/${r.username}` : "#"}
                className="flex-1 min-w-0 text-sm font-medium text-text hover:text-primary truncate"
              >
                {r.display_name || r.username || "anon"}
              </Link>
              <span className="text-xs text-text-muted">{r.correct_picks} ✓</span>
              <span className="text-sm font-bold text-primary font-mono">{r.points}</span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
