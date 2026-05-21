"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Copy,
  Check,
  Trophy,
  Target,
  Crosshair,
  Monitor,
  Mouse,
  Keyboard,
  Headphones,
  Cpu,
  Gamepad2,
  Instagram,
  Youtube,
  Twitch,
  ExternalLink,
} from "lucide-react";
import { Badge, Card, CardContent } from "@/components/ui";
import { amazonInSearchUrl } from "@/lib/pro/affiliate";
import { FollowButton } from "./follow-button";
import type {
  ProPlayerDetail,
  ProSocials,
  ValorantGameStats,
} from "@/lib/pro/types";

const SHOPPABLE_LABELS = new Set([
  "Mouse",
  "Keyboard",
  "Headphones",
  "Mousepad",
  "Monitor",
  "Phone",
  "Triggers",
]);

function fmtPct(n: number | string | null | undefined) {
  const v = typeof n === "string" ? Number(n) : n;
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v.toFixed(1)}%`;
}
function fmtNum(n: number | string | null | undefined, digits = 2) {
  const v = typeof n === "string" ? Number(n) : n;
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}

interface PlayerDetailProps {
  detail: ProPlayerDetail;
}

export function PlayerDetail({ detail }: PlayerDetailProps) {
  const { player, current_stats, gear } = detail;
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  const agentPool = (current_stats?.game_stats as ValorantGameStats | undefined)?.agent_pool ?? [];
  const crosshairCode = gear?.ingame_settings?.crosshair_code as string | undefined;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      {/* Hero */}
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row gap-6">
          <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-xl bg-surface-light overflow-hidden flex-shrink-0 mx-auto md:mx-0">
            {player.photo_url ? (
              <Image
                src={player.photo_url}
                alt={player.ign}
                fill
                sizes="(min-width: 768px) 144px, 112px"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-4xl font-bold text-text-muted">
                {player.ign.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-text">{player.ign}</h1>
              {player.national_rank && (
                <Badge variant="primary" size="md">
                  #{player.national_rank} India
                </Badge>
              )}
              {player.is_featured && (
                <Badge variant="warning" size="md">Featured</Badge>
              )}
              <FollowButton playerId={player.id} playerName={player.ign} className="ml-auto" />
            </div>
            {player.real_name && (
              <p className="text-text-muted">{player.real_name}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-text-secondary mt-3">
              {player.team && (
                <span>
                  <span className="text-text-muted">Team:</span>{" "}
                  <span className="font-medium text-text">{player.team.name}</span>
                </span>
              )}
              {player.role && (
                <span>
                  <span className="text-text-muted">Role:</span>{" "}
                  <span className="font-medium text-text">{player.role}</span>
                </span>
              )}
              {player.region && (
                <span>
                  <span className="text-text-muted">Region:</span>{" "}
                  <span className="font-medium text-text">{player.region}</span>
                </span>
              )}
              {player.peak_rank && (
                <span className="inline-flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-warning" />
                  Peak {player.peak_rank}
                </span>
              )}
            </div>
            {player.bio && (
              <p className="text-text-secondary mt-4 leading-relaxed">{player.bio}</p>
            )}
            <SocialsRow socials={player.socials} />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Current Season Stats
          {current_stats?.season && (
            <Badge variant="outline" size="sm">{current_stats.season}</Badge>
          )}
        </h2>
        {current_stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Matches" value={current_stats.matches_played ?? "—"} />
            <StatCard label="K/D" value={fmtNum(current_stats.k_d_ratio)} />
            <StatCard label="ACS" value={fmtNum(current_stats.acs, 1)} />
            <StatCard
              label="ADR"
              value={fmtNum(current_stats.adr, 1)}
            />
            <StatCard label="HS %" value={fmtPct(current_stats.hs_pct)} />
            <StatCard
              label="Win %"
              value={(() => {
                const mp = Number(current_stats.matches_played);
                const w = Number(current_stats.wins);
                if (!Number.isFinite(mp) || mp <= 0 || !Number.isFinite(w)) return "—";
                return `${((w / mp) * 100).toFixed(1)}%`;
              })()}
            />
          </div>
        ) : (
          <EmptyBlock text="No current-season stats recorded yet." />
        )}

        {agentPool.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-text-muted mb-2">Agent pool</h3>
            <div className="flex flex-wrap gap-2">
              {agentPool.map((a) => (
                <div
                  key={a.agent}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  <span className="font-medium text-text">{a.agent}</span>
                  <span className="text-text-muted ml-2">
                    {a.pick_rate}% pick
                    {a.win_rate != null ? ` · ${a.win_rate}% win` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>

      {/* Gear + setup */}
      <section>
        <h2 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Gear &amp; Setup
        </h2>
        {gear ? (
          <div className="grid md:grid-cols-2 gap-4">
            {gear.platform === "pc" ? (
              <>
                <Card>
                  <CardContent className="p-5 space-y-2 text-sm">
                    <h3 className="font-semibold text-text mb-2 flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" /> Rig
                    </h3>
                    <GearRow label="Build" value={gear.device_model} />
                    <GearRow label="CPU" value={gear.cpu} />
                    <GearRow label="GPU" value={gear.gpu} />
                    <GearRow label="RAM" value={gear.ram} />
                    <GearRow
                      label="Monitor"
                      value={
                        gear.monitor
                          ? `${gear.monitor}${gear.monitor_hz ? ` (${gear.monitor_hz}Hz)` : ""}`
                          : null
                      }
                      icon={<Monitor className="h-4 w-4 text-text-muted" />}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 space-y-2 text-sm">
                    <h3 className="font-semibold text-text mb-2 flex items-center gap-2">
                      <Mouse className="h-4 w-4 text-primary" /> Peripherals
                    </h3>
                    <GearRow
                      label="Mouse"
                      value={gear.mouse}
                      icon={<Mouse className="h-4 w-4 text-text-muted" />}
                    />
                    <GearRow
                      label="Keyboard"
                      value={gear.keyboard}
                      icon={<Keyboard className="h-4 w-4 text-text-muted" />}
                    />
                    <GearRow
                      label="Headphones"
                      value={gear.headphones}
                      icon={<Headphones className="h-4 w-4 text-text-muted" />}
                    />
                    <GearRow label="Mousepad" value={gear.mousepad} />
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="p-5 space-y-2 text-sm">
                    <h3 className="font-semibold text-text mb-2 flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" /> Device
                    </h3>
                    <GearRow label="Phone" value={gear.device_model} />
                    <GearRow
                      label="Refresh rate"
                      value={gear.monitor_hz ? `${gear.monitor_hz}Hz` : null}
                    />
                    <GearRow label="Grip" value={gear.grip_style} />
                    <GearRow label="Triggers" value={gear.controllers} />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 space-y-2 text-sm">
                    <h3 className="font-semibold text-text mb-2 flex items-center gap-2">
                      <Headphones className="h-4 w-4 text-primary" /> Audio &amp; HUD
                    </h3>
                    <GearRow
                      label="Headphones"
                      value={gear.headphones}
                      icon={<Headphones className="h-4 w-4 text-text-muted" />}
                    />
                    {gear.layout_image_url && (
                      <a
                        href={gear.layout_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs mt-2"
                      >
                        <ExternalLink className="h-3 w-3" /> View HUD layout screenshot
                      </a>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="md:col-span-2">
              <CardContent className="p-5 space-y-3 text-sm">
                <h3 className="font-semibold text-text mb-1 flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-primary" /> In-game
                </h3>
                {gear.sensitivities && Object.keys(gear.sensitivities).length > 0 && (
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-text-secondary">
                    {gear.sensitivities.general != null && (
                      <span>
                        <span className="text-text-muted">Sens:</span>{" "}
                        <span className="font-medium text-text">{String(gear.sensitivities.general)}</span>
                      </span>
                    )}
                    {gear.sensitivities.edpi != null && (
                      <span>
                        <span className="text-text-muted">eDPI:</span>{" "}
                        <span className="font-medium text-text">{gear.sensitivities.edpi}</span>
                      </span>
                    )}
                    {gear.sensitivities.zoom != null && (
                      <span>
                        <span className="text-text-muted">Zoom sens:</span>{" "}
                        <span className="font-medium text-text">{String(gear.sensitivities.zoom)}</span>
                      </span>
                    )}
                  </div>
                )}
                {crosshairCode && (
                  <div className="rounded-lg bg-surface-light p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-text-muted mb-0.5">Crosshair code</div>
                      <code className="text-xs font-mono text-text break-all">{crosshairCode}</code>
                    </div>
                    <button
                      type="button"
                      onClick={() => copy("xhair", crosshairCode)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-medium flex-shrink-0"
                    >
                      {copied === "xhair" ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
                {gear.notes && (
                  <p className="text-text-muted text-xs">{gear.notes}</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <EmptyBlock text="Gear and sensitivity not yet recorded for this player." />
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs text-text-muted uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold text-text mt-1">{value}</div>
    </div>
  );
}

function GearRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
}) {
  const shoppable = !!value && SHOPPABLE_LABELS.has(label);
  return (
    <div className="flex items-start gap-2">
      <span className="text-text-muted w-24 flex-shrink-0 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="text-text font-medium flex-1 min-w-0 break-words">
        {value || "—"}
        {shoppable && (
          <a
            href={amazonInSearchUrl(value!)}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="ml-2 inline-flex items-center gap-1 rounded-full bg-warning/10 hover:bg-warning/20 text-warning px-2 py-0.5 text-[10px] font-medium align-middle"
            title="Find similar on Amazon India (affiliate)"
          >
            Buy on Amazon ↗
          </a>
        )}
      </span>
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 text-center text-text-muted text-sm">
      {text}
    </div>
  );
}

function SocialsRow({ socials }: { socials: ProSocials }) {
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
    <div className="flex flex-wrap gap-2 mt-4">
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
