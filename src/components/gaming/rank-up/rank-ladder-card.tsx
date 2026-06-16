import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { rankIconUrl } from "@/lib/features/tools/valorant-ranks";
import { rankAccent, type LadderEntry } from "@/lib/data/valorant-rank-up";

const PILLS = ["How it thinks", "Bad habits", "Unlocks", "Drills"];

/**
 * A single rank on the Rank Up hub ladder. Live tiers link to their guide;
 * locked tiers render as a dimmed "coming soon" card (lock icon + text, so the
 * state never relies on color alone).
 */
export function RankLadderCard({ entry }: { entry: LadderEntry }) {
  const color = rankAccent(entry.group);
  const emblem = rankIconUrl(entry.rank);

  if (!entry.live) {
    return (
      <div
        role="article"
        aria-label={`${entry.rank} — coming soon`}
        title="Coming soon"
        className="relative flex select-none flex-col rounded-2xl border border-border/50 bg-surface/40 p-6 opacity-60"
      >
        <Lock className="absolute right-4 top-4 h-4 w-4 text-text-dim" aria-hidden />
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/60">
          {emblem ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={emblem} alt="" width={44} height={44} className="h-11 w-11 object-contain grayscale" />
          ) : (
            <span className="text-2xl font-black text-text-dim">{entry.rank[0]}</span>
          )}
        </div>
        <h3 className="mt-4 text-xl font-black uppercase tracking-tight text-text-secondary">{entry.rank}</h3>
        <p className="mt-1 text-xs text-text-dim">Coming soon</p>
      </div>
    );
  }

  return (
    <Link
      href={`/rank-up/${entry.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:border-border/80"
    >
      {/* hover glow */}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(120% 80% at 0% 0%, ${color}22, transparent 60%)` }}
        aria-hidden
      />
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-xl border"
        style={{ background: `${color}1a`, borderColor: `${color}40` }}
      >
        {emblem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={emblem} alt={`${entry.rank} rank emblem`} width={44} height={44} className="h-11 w-11 object-contain" />
        ) : (
          <span className="text-2xl font-black" style={{ color }}>{entry.rank[0]}</span>
        )}
      </div>
      <h3 className="relative mt-4 text-xl font-black uppercase tracking-tight text-text">
        {entry.rank} <span className="text-text-dim">→</span> {entry.nextRank}
      </h3>
      <p className="relative mt-1 flex-1 text-sm text-text-muted">{entry.hook}</p>
      <div className="relative mt-3 flex flex-wrap gap-1.5">
        {PILLS.map((p) => (
          <span
            key={p}
            className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ borderColor: `${color}40`, color }}
          >
            {p}
          </span>
        ))}
      </div>
      <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100" style={{ color }}>
        Read guide <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
