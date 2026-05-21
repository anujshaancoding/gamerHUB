import Link from "next/link";
import {
  TIER_ORDER,
  TIER_META,
  type TierListSnapshot,
} from "@/lib/data/valorant-patches";
import { getAgent } from "@/lib/data/valorant-agents";
import { getMap } from "@/lib/data/valorant-maps";

function Pill({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:border-primary hover:text-primary transition-colors"
    >
      {label}
    </Link>
  );
}

function TierTable({
  title,
  rows,
}: {
  title: string;
  rows: { tier: (typeof TIER_ORDER)[number]; items: { href: string; label: string }[] }[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h3>
      <div className="overflow-hidden rounded-xl border border-border">
        {rows.map(({ tier, items }) => (
          <div
            key={tier}
            className="flex flex-col gap-3 border-b border-border last:border-b-0 sm:flex-row sm:items-start"
          >
            <div
              className={`flex w-full shrink-0 items-center justify-center border-b border-border px-4 py-3 sm:w-24 sm:border-b-0 sm:border-r ${TIER_META[tier].className}`}
            >
              <span className="text-lg font-extrabold">{TIER_META[tier].label}</span>
            </div>
            <div className="flex-1 px-4 py-3">
              {items.length === 0 ? (
                <span className="text-xs text-text-muted">—</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {items.map((it) => (
                    <Pill key={it.href} href={it.href} label={it.label} />
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-text-muted">{TIER_META[tier].blurb}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PatchTierList({ tierList }: { tierList: TierListSnapshot }) {
  const agentRows = TIER_ORDER.map((tier) => ({
    tier,
    items: (tierList.agents[tier] ?? []).map((slug) => {
      const a = getAgent(slug);
      return { href: `/agents/${slug}`, label: a?.name ?? slug };
    }),
  }));

  const mapRows = TIER_ORDER.map((tier) => ({
    tier,
    items: (tierList.maps[tier] ?? []).map((slug) => {
      const m = getMap(slug);
      return { href: `/maps/${slug}`, label: m?.name ?? slug };
    }),
  }));

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <TierTable title="Agent tier list" rows={agentRows} />
      <TierTable title="Map pool tier list" rows={mapRows} />
    </div>
  );
}
