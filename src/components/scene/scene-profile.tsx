"use client";

import Link from "next/link";
import {
  ExternalLink,
  Instagram,
  Twitch,
  Youtube,
  Trophy,
  MapPin,
  Cake,
  Crosshair,
  Vote,
  ChevronLeft,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { TIER_LABEL, type ScenePlayer } from "@/lib/data/india-scene";
import { useSceneVotes } from "@/lib/scene/votes";

interface Props {
  player: ScenePlayer;
}

export function SceneProfile({ player }: Props) {
  const { tally, user, toggle } = useSceneVotes();
  const voted = !!user[player.slug];
  const votes = tally[player.slug] ?? 0;

  const tierTone =
    player.tier === "semi-pro"
      ? "from-primary/30 via-primary/10"
      : player.tier === "amateur"
      ? "from-accent/30 via-accent/10"
      : "from-warning/30 via-warning/10";

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-12 space-y-6">
      <Link
        href="/scene"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to scene
      </Link>

      {/* Hero — HLTV-style portrait + meta sheet */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-60",
            tierTone
          )}
        />
        <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[260px_1fr]">
          <div className="relative h-60 w-full md:h-64 md:w-60 overflow-hidden rounded-xl bg-surface-light flex items-center justify-center">
            <div className="text-7xl font-black text-primary/30">
              {player.ign.slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-text">
              {TIER_LABEL[player.tier]}
            </span>
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl md:text-4xl font-black text-text leading-tight">
                  {player.ign}
                </h1>
                {player.real_name && (
                  <p className="text-text-muted mt-1">{player.real_name}</p>
                )}
              </div>
              {player.eligible_for_promotion && (
                <button
                  type="button"
                  onClick={() => toggle(player.slug)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-colors",
                    voted
                      ? "bg-primary text-background"
                      : "bg-surface-light text-text hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <Vote className="h-4 w-4" />
                  {voted ? "Voted · " : "Vote for pro · "}
                  {votes}
                </button>
              )}
            </div>

            <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <MetaRow label="Org" value={player.org} />
              <MetaRow
                label="Role"
                value={`${player.role.label}${player.role.detail ? ` · ${player.role.detail}` : ""}`}
              />
              {player.peak_rank && (
                <MetaRow
                  label="Peak rank"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5 text-warning" />
                      {player.peak_rank}
                    </span>
                  }
                />
              )}
              {player.hometown && (
                <MetaRow
                  label="From"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-text-muted" />
                      {player.hometown}
                    </span>
                  }
                />
              )}
              {player.age != null && (
                <MetaRow
                  label="Age"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Cake className="h-3.5 w-3.5 text-text-muted" />
                      {player.age}
                    </span>
                  }
                />
              )}
            </dl>

            <p className="mt-5 text-text-secondary leading-relaxed">
              {player.bio || player.blurb}
            </p>

            <SocialsRow socials={player.socials} />
          </div>
        </div>
      </section>

      {/* Trackers */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-text-muted">
          Trackers & profiles
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {player.trackers.map((t) => (
            <a
              key={t.url}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Crosshair className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-text">{t.label}</div>
                <div className="text-xs text-text-muted truncate">{t.url}</div>
              </div>
              <ExternalLink className="h-4 w-4 text-text-dim group-hover:text-primary" />
            </a>
          ))}
          {player.trackers.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-surface/40 p-4 text-sm text-text-muted">
              No public trackers linked yet.
            </div>
          )}
        </div>
      </section>

      {/* Highlights */}
      {player.highlights && player.highlights.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-text-muted">
            Highlights
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {player.highlights.map((h) => (
              <li
                key={h}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary"
              >
                <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* CTA back to ladder */}
      <section className="rounded-2xl border border-dashed border-border bg-surface/40 p-5 text-sm text-text-muted">
        Looking for the rest of the up-and-comers? Head back to{" "}
        <Link href="/scene" className="text-primary hover:underline">
          the India scene ladder
        </Link>
        , or jump up a tier and see{" "}
        <Link href="/pros" className="text-primary hover:underline">
          India&apos;s Tier-1 pros
        </Link>
        .
      </section>
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <dt className="text-text-muted shrink-0">{label}</dt>
      <dd className="font-medium text-text truncate">{value}</dd>
    </div>
  );
}

function SocialsRow({
  socials,
}: {
  socials: ScenePlayer["socials"];
}) {
  const items: { key: string; href: string; label: string; icon: React.ReactNode }[] = [];
  if (socials.twitter)
    items.push({
      key: "twitter",
      href: `https://x.com/${socials.twitter}`,
      label: `@${socials.twitter}`,
      icon: <ExternalLink className="h-3.5 w-3.5" />,
    });
  if (socials.instagram)
    items.push({
      key: "instagram",
      href: `https://instagram.com/${socials.instagram}`,
      label: `@${socials.instagram}`,
      icon: <Instagram className="h-3.5 w-3.5" />,
    });
  if (socials.youtube)
    items.push({
      key: "youtube",
      href: `https://youtube.com/@${socials.youtube}`,
      label: socials.youtube,
      icon: <Youtube className="h-3.5 w-3.5" />,
    });
  if (socials.twitch)
    items.push({
      key: "twitch",
      href: `https://twitch.tv/${socials.twitch}`,
      label: socials.twitch,
      icon: <Twitch className="h-3.5 w-3.5" />,
    });
  if (items.length === 0) return null;
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {items.map((s) => (
        <a
          key={s.key}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-light hover:bg-primary/10 hover:text-primary px-3 py-1 text-xs text-text-secondary transition-colors"
        >
          {s.icon}
          {s.label}
        </a>
      ))}
    </div>
  );
}
