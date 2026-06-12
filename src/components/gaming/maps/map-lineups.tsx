"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  MapPin,
  ArrowRight,
  Video,
  Clapperboard,
  Maximize2,
  X,
  Users,
  Swords,
  Shield,
  History,
  CalendarDays,
  Globe,
} from "lucide-react";
import {
  type ValorantMap,
  mapSplash,
  mapMinimap,
} from "@/lib/data/valorant-maps";
import type { MapCallout } from "@/lib/data/valorant-callouts";
import {
  AGENTS,
  ROLE_META,
  getAgent,
  agentIcon,
} from "@/lib/data/valorant-agents";
import { bestCompsForMap } from "@/lib/data/valorant-meta";
import {
  type Lineup,
  type LineupSide,
  SIDES,
  DIFFICULTY_LABEL,
} from "@/lib/data/lineup-types";

export function MapLineups({
  map,
  callouts = [],
}: {
  map: ValorantMap;
  callouts?: MapCallout[];
}) {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<string>("all");
  const [side, setSide] = useState<LineupSide | "all">("all");
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/lineups?map=${map.slug}`)
      .then((r) => (r.ok ? r.json() : { lineups: [] }))
      .then((d) => active && setLineups(d.lineups ?? []))
      .catch(() => active && setLineups([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [map.slug]);

  const agentsWithLineups = useMemo(() => {
    const slugs = new Set(lineups.map((l) => l.agent));
    return AGENTS.filter((a) => slugs.has(a.slug));
  }, [lineups]);

  const filtered = lineups.filter(
    (l) =>
      (agent === "all" || l.agent === agent) &&
      (side === "all" || l.side === side)
  );

  return (
    <div className="-m-4 lg:-m-6">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden sm:h-72">
        <Image
          src={mapSplash(map.uuid)}
          alt={map.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-5 sm:px-6">
          <Link
            href="/maps"
            className="inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
          >
            <ChevronLeft className="h-4 w-4" /> All maps
          </Link>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-text sm:text-6xl">
            {map.name}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            {map.blurb}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <MapHistorySection map={map} />

        <MapBestComps mapSlug={map.slug} mapName={map.name} />

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Callouts / minimap */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-text-dim">
              <MapPin className="h-4 w-4" /> Callouts
            </h2>
            <button
              type="button"
              onClick={() => setZoomed(true)}
              aria-label={`Expand ${map.name} callouts map`}
              className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-border-light"
            >
              <Image
                src={mapMinimap(map.uuid)}
                alt={`${map.name} callouts map`}
                width={520}
                height={520}
                className="h-auto w-full rounded-lg"
              />
              <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/0 transition-colors group-hover:bg-background/40">
                <span className="flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-xs font-semibold text-text opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-3.5 w-3.5" />
                  {callouts.length > 0 ? "View callouts" : "Expand map"}
                </span>
              </span>
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
              {map.sites.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-surface-light px-2.5 py-1 text-xs font-semibold text-text-secondary"
                >
                  {s} Site
                </span>
              ))}
            </div>
          </div>

          {/* Lineups */}
          <div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-text">
                <Clapperboard className="h-5 w-5 text-primary" />
                Lineups
                <span className="text-sm font-normal text-text-dim">
                  ({filtered.length})
                </span>
              </h2>
            </div>

            {/* Filters */}
            <div className="mb-5 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Chip
                  active={agent === "all"}
                  onClick={() => setAgent("all")}
                  label="All agents"
                />
                {agentsWithLineups.map((a) => (
                  <Chip
                    key={a.slug}
                    active={agent === a.slug}
                    onClick={() => setAgent(a.slug)}
                    label={a.name}
                    color={ROLE_META[a.role].color}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip
                  active={side === "all"}
                  onClick={() => setSide("all")}
                  label="Both sides"
                />
                {SIDES.map((s) => (
                  <Chip
                    key={s}
                    active={side === s}
                    onClick={() => setSide(s)}
                    label={s}
                  />
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-2xl border border-border bg-surface"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState mapName={map.name} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map((l) => (
                  <LineupCard key={l.id} lineup={l} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {zoomed && (
        <CalloutsModal
          map={map}
          callouts={callouts}
          onClose={() => setZoomed(false)}
        />
      )}
    </div>
  );
}

function CalloutsModal({
  map,
  callouts,
  onClose,
}: {
  map: ValorantMap;
  callouts: MapCallout[];
  onClose: () => void;
}) {
  const [side, setSide] = useState<"attacker" | "defender">("attacker");
  const [hovered, setHovered] = useState<number | null>(null);
  const rotated = side === "defender";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${map.name} callouts`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/90 p-4 backdrop-blur-sm sm:p-6"
    >
      <div className="flex w-full max-w-[min(90vw,85vh)] items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-text sm:text-lg">
          <MapPin className="h-4 w-4 text-primary" />
          {map.name} · Callouts
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border border-border bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setSide("attacker")}
              aria-pressed={side === "attacker"}
              title="View from Attacker side"
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold transition-colors sm:px-3 ${
                side === "attacker"
                  ? "bg-primary text-background"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <Swords className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Attacker</span>
            </button>
            <button
              type="button"
              onClick={() => setSide("defender")}
              aria-pressed={side === "defender"}
              title="View from Defender side"
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold transition-colors sm:px-3 ${
                side === "defender"
                  ? "bg-primary text-background"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Defender</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-border bg-surface p-2 text-text-muted transition-colors hover:border-border-light hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative aspect-square w-[min(90vw,85vh)] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <div
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{ transform: rotated ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <Image
            src={mapMinimap(map.uuid)}
            alt={`${map.name} callouts map`}
            fill
            sizes="90vw"
            className="object-cover"
          />
          {callouts.map((c, i) => {
            const dimmed = hovered !== null && hovered !== i;
            return (
              <span
                key={`${c.label}-${i}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
                className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-opacity duration-200 ${
                  dimmed ? "opacity-20" : "opacity-100"
                }`}
              >
                <span
                  className="flex flex-col items-center transition-transform duration-500 ease-in-out"
                  style={{
                    transform: rotated ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
                  <span className="mt-1 whitespace-nowrap rounded bg-background/85 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-tight tracking-wide text-text shadow backdrop-blur sm:text-[11px]">
                    {c.label}
                  </span>
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-text-dim">
        {callouts.length > 0
          ? "Press Esc or the ✕ button to close"
          : "Callout labels unavailable for this map · press Esc to close"}
      </p>
    </div>
  );
}

function MapHistorySection({ map }: { map: ValorantMap }) {
  const h = map.history;
  if (!h) return null;

  return (
    <section className="mb-8">
      <h2 className="flex items-center gap-2 text-lg font-bold text-text">
        <History className="h-5 w-5 text-primary" />
        History &amp; Lore
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        How {map.name} came to be and how it has changed.
      </p>

      <div className="mt-4 rounded-2xl border border-border bg-surface/80 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-semibold text-text-dim">Released</span>
            <span className="text-text-secondary">{h.released}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-semibold text-text-dim">Setting</span>
            <span className="text-text-secondary">{h.setting}</span>
          </div>
        </div>

        <ol className="mt-5 border-t border-border pt-5">
          {h.timeline.map((ev, i) => {
            const last = i === h.timeline.length - 1;
            return (
              <li key={`${ev.date}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Rail + node */}
                <div className="relative flex w-24 shrink-0 justify-end sm:w-32">
                  <span className="text-xs font-bold uppercase tracking-wide text-primary">
                    {ev.date}
                  </span>
                </div>
                <div className="relative flex flex-col items-center">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-surface" />
                  {!last && (
                    <span
                      aria-hidden
                      className="absolute top-3.5 h-[calc(100%-0.5rem)] w-px bg-border"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-0.5">
                  <p className="text-sm font-bold text-text">{ev.title}</p>
                  {ev.detail && (
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">
                      {ev.detail}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function MapBestComps({
  mapSlug,
  mapName,
}: {
  mapSlug: string;
  mapName: string;
}) {
  const comps = bestCompsForMap(mapSlug);
  if (comps.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="flex items-center gap-2 text-lg font-bold text-text">
        <Users className="h-5 w-5 text-primary" />
        Best 5-Stacks
        <span className="text-sm font-normal text-text-dim">
          (top {comps.length})
        </span>
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        Meta team compositions for {mapName} and how to play each side.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {comps.map((comp, i) => (
          <article
            key={comp.name}
            className="flex flex-col rounded-2xl border border-border bg-surface/80 p-5"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-surface-light px-2 py-0.5 text-[11px] font-bold text-primary">
                #{i + 1}
              </span>
              <h3 className="text-base font-bold text-text">{comp.name}</h3>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {comp.agents.map((slug) => {
                const a = getAgent(slug);
                if (!a) return null;
                const c = ROLE_META[a.role].color;
                return (
                  <Link
                    key={slug}
                    href={`/agents/${a.slug}`}
                    title={`${a.name} · ${a.role}`}
                    className="flex items-center gap-1.5 rounded-full border bg-background py-1 pl-1 pr-2.5 transition-colors hover:border-border-light"
                    style={{ borderColor: `${c}55` }}
                  >
                    <span
                      className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full"
                      style={{ background: `${c}26` }}
                    >
                      <Image
                        src={agentIcon(a.uuid)}
                        alt={a.name}
                        fill
                        sizes="28px"
                        className="object-cover"
                      />
                    </span>
                    <span className="text-xs font-semibold text-text">
                      {a.name}
                    </span>
                  </Link>
                );
              })}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              {comp.strategy}
            </p>

            <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs leading-relaxed">
              <p className="flex gap-2 text-text-muted">
                <span className="inline-flex shrink-0 items-center gap-1 font-bold text-primary">
                  <Swords className="h-3.5 w-3.5" /> Attack
                </span>
                <span>{comp.attack}</span>
              </p>
              <p className="flex gap-2 text-text-muted">
                <span className="inline-flex shrink-0 items-center gap-1 font-bold text-accent">
                  <Shield className="h-3.5 w-3.5" /> Defense
                </span>
                <span>{comp.defense}</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Chip({
  active,
  onClick,
  label,
  color = "var(--primary)",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs font-semibold transition-all"
      style={{
        borderColor: active ? color : "var(--border)",
        background: active ? `${color}1f` : "transparent",
        color: active ? color : "var(--text-muted)",
      }}
    >
      {label}
    </button>
  );
}

function LineupCard({ lineup }: { lineup: Lineup }) {
  const agentData = AGENTS.find((a) => a.slug === lineup.agent);
  const color = agentData ? ROLE_META[agentData.role].color : "var(--primary)";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-border-light">
      <div className="relative aspect-video bg-background">
        {lineup.youtubeId ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${lineup.youtubeId}`}
            title={lineup.title}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : lineup.videoUrl ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={lineup.videoUrl}
            controls
            preload="metadata"
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-dim">
            <Video className="h-8 w-8 opacity-40" />
            <span className="text-xs">Video coming soon</span>
          </div>
        )}
        <span
          className="absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold uppercase backdrop-blur"
          style={{ background: `${color}26`, color }}
        >
          {lineup.side} · {lineup.site}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-text">{lineup.title}</h3>
          <span className="shrink-0 rounded-md bg-surface-light px-2 py-0.5 text-[10px] font-semibold text-text-muted">
            {DIFFICULTY_LABEL[lineup.difficulty]}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-dim">
          {agentData && (
            <Link
              href={`/agents/${agentData.slug}`}
              className="font-semibold transition-colors hover:underline"
              style={{ color }}
            >
              {agentData.name}
            </Link>
          )}
          <span>·</span>
          <span className="text-text-secondary">{lineup.ability}</span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="rounded bg-surface-light px-2 py-1 text-text-secondary">
            {lineup.fromCallout}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-text-dim" />
          <span className="rounded bg-surface-light px-2 py-1 text-text-secondary">
            {lineup.toCallout}
          </span>
        </div>

        {lineup.description && (
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            {lineup.description}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ mapName }: { mapName: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
      <Clapperboard className="mx-auto h-10 w-10 text-text-dim" />
      <p className="mt-3 font-semibold text-text">
        No lineups for {mapName} yet
      </p>
      <p className="mt-1 text-sm text-text-muted">
        Lineups are added regularly. Check back soon — or follow ggLobby for
        updates.
      </p>
    </div>
  );
}
