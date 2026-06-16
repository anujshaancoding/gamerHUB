import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Brain,
  AlertCircle,
  Unlock,
  Target,
  HelpCircle,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui";
import { rankIconUrl } from "@/lib/features/tools/valorant-ranks";
import { rankAccent, type RankUpTier } from "@/lib/data/valorant-rank-up";
import { RankUpCta } from "./rank-up-cta";

const TOC: { id: string; label: string }[] = [
  { id: "tldr", label: "TL;DR" },
  { id: "how-it-thinks", label: "How this rank thinks" },
  { id: "bad-habits", label: "Habits holding you back" },
  { id: "unlocks", label: "Unlocks to climb" },
  { id: "drills", label: "Drills" },
  { id: "pillars", label: "Cross-cutting pillars" },
  { id: "faq", label: "FAQ" },
];

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  color,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${color}1a`, border: `1px solid ${color}40`, color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-base font-bold text-text sm:text-lg">{title}</h2>
        <p className="text-xs text-text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

export function RankUpGuide({ tier }: { tier: RankUpTier }) {
  const color = rankAccent(tier.group);
  const emblem = rankIconUrl(tier.rank);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:py-10">
      {/* Back nav */}
      <Link
        href="/rank-up"
        className="mb-3 inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> All ranks
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-xl border sm:flex"
          style={{ background: `${color}1a`, borderColor: `${color}40` }}
        >
          {emblem ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={emblem} alt={`${tier.rank} rank emblem`} width={52} height={52} className="h-12 w-12 object-contain" />
          ) : (
            <span className="text-3xl font-black" style={{ color }}>{tier.rank[0]}</span>
          )}
        </div>
        <div className="min-w-0">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest"
            style={{ borderColor: `${color}55`, background: `${color}1a`, color }}
          >
            {tier.rank} → {tier.nextRank}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-text md:text-3xl">
            How to climb from {tier.rank} to {tier.nextRank} in Valorant
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">{tier.deck}</p>
        </div>
      </div>

      {/* Mobile ToC pills */}
      <nav
        aria-label="On this page"
        className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2 md:hidden"
      >
        {TOC.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div className="mt-6 md:grid md:grid-cols-[1fr_11rem] md:items-start md:gap-8">
        {/* Body */}
        <div className="min-w-0 space-y-8">
          {/* TL;DR */}
          <section id="tldr" className="scroll-mt-24">
            <Card
              className="border-l-4 p-5 sm:p-6"
              style={{ borderLeftColor: color }}
            >
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-dim">
                <ListChecks className="h-4 w-4" style={{ color }} /> TL;DR — the {tier.unlocks.length} unlocks
              </p>
              <ul className="space-y-2">
                {tier.tldr.map((t, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-text-secondary">
                    <span className="font-bold" style={{ color }}>{i + 1}.</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* How this rank thinks */}
          <section id="how-it-thinks" className="scroll-mt-24 space-y-3">
            <SectionHeader icon={Brain} title="How this rank thinks" subtitle={`The ${tier.rank} mental model`} color={color} />
            <Card className="space-y-3 p-5 sm:p-6">
              {tier.howThisRankThinks.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-text-secondary">{p}</p>
              ))}
            </Card>
          </section>

          {/* Habits */}
          <section id="bad-habits" className="scroll-mt-24 space-y-3">
            <SectionHeader icon={AlertCircle} title="The habits holding you back" subtitle="Name them so you can break them" color={color} />
            <Card className="space-y-4 p-5 sm:p-6">
              {tier.habits.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error/70" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-text">{h.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{h.detail}</p>
                  </div>
                </div>
              ))}
            </Card>
          </section>

          {/* Unlocks */}
          <section id="unlocks" className="scroll-mt-24 space-y-3">
            <SectionHeader icon={Unlock} title={`The ${tier.unlocks.length} unlocks to reach ${tier.nextRank}`} subtitle="Concrete shifts, in order" color={color} />
            <ol className="space-y-3">
              {tier.unlocks.map((u, i) => (
                <li key={i}>
                  <Card className="p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black"
                        style={{ background: `${color}1a`, color }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-text sm:text-base">{u.title}</h3>
                          <span
                            className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                            style={{ borderColor: `${color}40`, color }}
                          >
                            {u.pillar}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{u.theShift}</p>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          </section>

          {/* Drills */}
          <section id="drills" className="scroll-mt-24 space-y-3">
            <SectionHeader icon={Target} title="Drills to build these unlocks" subtitle="Repeatable, low-time-cost practice" color={color} />
            <div className="grid gap-3 sm:grid-cols-2">
              {tier.drills.map((d, i) => (
                <div key={i} className="rounded-lg border border-border/60 bg-surface-light p-3.5">
                  <p className="text-sm font-semibold text-text">{d.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {d.mode && (
                      <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                        {d.mode}
                      </span>
                    )}
                    {d.repsOrTime && (
                      <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                        {d.repsOrTime}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-text-muted">{d.how}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Cross-cutting pillars */}
          <section id="pillars" className="scroll-mt-24">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-text sm:text-lg">
              <span className="h-4 w-1 rounded-full" style={{ background: color }} />
              Cross-cutting pillars
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {tier.pillars.map((p) => (
                <div key={p.label} className="rounded-xl border border-border bg-surface p-4">
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-text-dim">{p.label}</p>
                  <p className="text-sm leading-relaxed text-text-secondary">{p.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-24 space-y-3">
            <SectionHeader icon={HelpCircle} title="FAQ" subtitle={`Common ${tier.rank} questions`} color={color} />
            <div className="space-y-3">
              {tier.faq.map((f, i) => (
                <Card key={i} className="p-5">
                  <p className="text-sm font-semibold text-text">{f.q}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{f.a}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* North Star CTA */}
          <RankUpCta rank={tier.rank} />

          {/* Related reading */}
          <section className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-text-dim">Keep reading</p>
            <div className="space-y-1.5">
              {tier.related.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-secondary transition-colors hover:border-primary/30 hover:text-text"
                >
                  <span>{r.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-text-dim" />
                </Link>
              ))}
            </div>
          </section>

          {/* Sources / research trail */}
          <section className="border-t border-border pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-text-dim">How we researched this</p>
            <ul className="mt-2 space-y-1">
              {tier.sources.map((s, i) => (
                <li key={i} className="text-xs leading-relaxed text-text-muted">• {s}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-text-dim">Last updated {tier.updatedAt}</p>
          </section>
        </div>

        {/* Sticky ToC (desktop) */}
        <nav
          aria-label="On this page"
          className="sticky top-20 hidden rounded-xl border border-border bg-surface p-4 md:block"
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-text-dim">On this page</p>
          <ol className="space-y-1">
            {TOC.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block py-0.5 text-xs text-text-secondary transition-colors hover:text-text"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}
