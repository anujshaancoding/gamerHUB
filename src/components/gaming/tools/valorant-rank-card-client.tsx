"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  ImagePlus,
  Loader2,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, useAuthProfile } from "@/lib/hooks/useAuth";
import { useActionGate } from "@/components/shared/auth/auth-gate-provider";
import { trackCtaClick } from "@/lib/analytics/cta-click";
import { CTA_SOURCES } from "@/lib/analytics/sources";
import { AGENTS, type AgentRole } from "@/lib/data/valorant-agents";
import { MAPS } from "@/lib/data/valorant-maps";
import { findWeapon, weaponNames } from "@/lib/tracker/valorant-assets";
import { VALORANT_TIERS } from "@/lib/features/tools/valorant-ranks";
import type { TrackerLookupResponse } from "@/lib/tracker/types";

type RankCardSource = "manual" | "career";
type RankCardTemplate = "ember" | "frost" | "aurum" | "clean";

const ROLE_OPTIONS: AgentRole[] = ["Duelist", "Controller", "Initiator", "Sentinel"];

/**
 * Each template is backed by a full-bleed art image at
 * public/images/cards/bg-<value>.jpg (1080x1350). Swap those files to restyle
 * every card — the layout code never changes.
 */
const TEMPLATE_OPTIONS: Array<{ value: RankCardTemplate; label: string; accent: string }> = [
  { value: "ember", label: "Ember", accent: "#ff4655" },
  { value: "frost", label: "Frost", accent: "#4db4ff" },
  { value: "aurum", label: "Aurum", accent: "#ffc658" },
  { value: "clean", label: "Clean", accent: "#9aa7b4" },
];

/** Accept current template names; map retired ones onto them. */
function parseTemplate(value?: string): RankCardTemplate {
  if (value === "ember" || value === "frost" || value === "aurum" || value === "clean") return value;
  if (value === "neon") return "frost";
  return "ember"; // aggressive / unknown
}

/**
 * Downscale the uploaded photo client-side (max 1000px) and return a PNG data
 * URL — PNG keeps the transparency of background-removed photos.
 */
async function photoToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / bitmap.width, 1000 / bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/png");
}

function agentRole(agentName: string): AgentRole {
  const agent = AGENTS.find((item) => item.name.toLowerCase() === agentName.toLowerCase());
  return agent?.role ?? "Duelist";
}

function agentNames() {
  return AGENTS.map((agent) => agent.name);
}

function sourceLabel(source: RankCardSource) {
  return source === "career" ? "Career record" : "Self reported";
}

export function ValorantRankCardClient({
  initialRank,
  initialPeak,
  initialAgent,
  initialRole,
  initialSource,
  initialTemplate,
  initialName,
  initialWeapon,
  initialMap,
}: {
  initialRank?: string;
  initialPeak?: string;
  initialAgent?: string;
  initialRole?: string;
  initialSource?: string;
  initialTemplate?: string;
  initialName?: string;
  initialWeapon?: string;
  initialMap?: string;
}) {
  const { user } = useAuth();
  const { profile } = useAuthProfile();
  const { openAuthGate } = useActionGate();

  const startRank =
    initialRank && VALORANT_TIERS.includes(initialRank as never) ? initialRank : "Gold 2";

  const [source, setSource] = useState<RankCardSource>(
    initialSource === "career" ? "career" : "manual",
  );
  const [template, setTemplate] = useState<RankCardTemplate>(parseTemplate(initialTemplate));
  const [tier, setTier] = useState<string>(startRank);
  const [peakRank, setPeakRank] = useState<string>(
    initialPeak && VALORANT_TIERS.includes(initialPeak as never) ? initialPeak : "Diamond 1",
  );
  const [agent, setAgent] = useState<string>(
    initialAgent && AGENTS.some((item) => item.name === initialAgent) ? initialAgent : "Jett",
  );
  const [role, setRole] = useState<AgentRole>(
    ROLE_OPTIONS.includes(initialRole as AgentRole)
      ? (initialRole as AgentRole)
      : agentRole(initialAgent || "Jett"),
  );
  const [weapon, setWeapon] = useState<string>(
    (initialWeapon && findWeapon(initialWeapon)?.name) || "Vandal",
  );
  const [favMap, setFavMap] = useState<string>(
    MAPS.find((m) => m.name.toLowerCase() === initialMap?.trim().toLowerCase())?.name ?? "Ascent",
  );
  const [name, setName] = useState<string>(initialName?.slice(0, 32) || "");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // Real performance metrics from a career lookup. Drives the ggLobby Rating,
  // which only appears on career cards — null on manual entry.
  const [careerStats, setCareerStats] = useState<{
    kd: number;
    acs: number;
    wr: number;
    hs: number;
    kast: number;
  } | null>(null);
  const [riotId, setRiotId] = useState<string>("");
  const [careerLoaded, setCareerLoaded] = useState(initialSource === "career");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const username = profile?.username;
  const displayName = name.trim() || profile?.display_name || username || "Your name";
  const agents = useMemo(agentNames, []);
  const weapons = useMemo(weaponNames, []);
  const mapNames = useMemo(() => MAPS.map((m) => m.name), []);

  const ogUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("rank", tier);
    params.set("peak", peakRank);
    params.set("agent", agent);
    params.set("weapon", weapon);
    params.set("role", role);
    params.set("source", source);
    params.set("template", template);
    params.set("map", favMap);
    if (displayName.trim()) params.set("name", displayName.trim());
    if (username) params.set("username", username);
    // Career stats power the ggLobby Rating; only sent for career cards.
    if (source === "career" && careerStats) {
      params.set("kd", String(careerStats.kd));
      params.set("acs", String(careerStats.acs));
      params.set("wr", String(careerStats.wr));
      params.set("hs", String(careerStats.hs));
      params.set("kast", String(careerStats.kast));
    }
    return `/api/og/rank-card?${params.toString()}`;
  }, [agent, careerStats, displayName, favMap, peakRank, role, source, template, tier, username, weapon]);

  // POST body used whenever a photo is uploaded (a photo can't fit in a URL).
  const cardBody = useMemo(
    () => ({
      rank: tier,
      peak: peakRank,
      agent,
      weapon,
      role,
      source,
      template,
      map: favMap,
      name: displayName.trim(),
      ...(source === "career" && careerStats ? careerStats : {}),
      ...(photo ? { photo } : {}),
    }),
    [agent, careerStats, displayName, favMap, peakRank, photo, role, source, template, tier, weapon],
  );

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoError(null);
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error("Image is too large (max 8 MB).");
      const dataUrl = await photoToDataUrl(file);
      if (dataUrl.length > 8_000_000) throw new Error("Image is too large after processing.");
      setPhoto(dataUrl);
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Could not read that image.");
    }
  }

  async function lookupCareerRecord() {
    const trimmed = riotId.trim();
    if (!trimmed || !trimmed.includes("#")) {
      setLookupError("Enter Riot ID as Name#TAG.");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    try {
      const response = await fetch(`/api/tracker/valorant?riotId=${encodeURIComponent(trimmed)}`);
      const data = (await response.json()) as TrackerLookupResponse;
      if (!response.ok || !data.ok || !data.insights) {
        throw new Error(data.error?.message || "Career lookup failed.");
      }

      setSource("career");
      setTier(data.insights.rank || "Unranked");
      setPeakRank(data.insights.peakRank || data.insights.rank || "Unranked");
      setAgent(data.insights.mainAgentName || "Jett");
      setRole(agentRole(data.insights.mainAgentName || "Jett"));
      setWeapon(data.insights.favoriteWeapons?.[0]?.weaponName || "Vandal");
      setName(data.insights.riotId.split("#")[0] || trimmed);
      setCareerStats({
        kd: data.insights.kd ?? 0,
        acs: data.insights.acs ?? 0,
        wr: data.insights.winRate ?? 0,
        hs: data.insights.headshotPct ?? 0,
        kast: data.insights.kast ?? 0,
      });
      setCareerLoaded(true);
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "Career lookup failed.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function downloadPng() {
    trackCtaClick(CTA_SOURCES.rank_card);
    setDownloading(true);
    try {
      const res = photo
        ? await fetch("/api/og/rank-card", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cardBody),
          })
        : await fetch(ogUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gglobby-${source}-valorant-rank-${tier
        .toLowerCase()
        .replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      /* download failed silently - preview still visible */
    } finally {
      setDownloading(false);
    }
  }

  function shareUrl(): string {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams();
    params.set("rank", tier);
    params.set("peak", peakRank);
    params.set("agent", agent);
    params.set("weapon", weapon);
    params.set("role", role);
    params.set("source", source);
    params.set("template", template);
    params.set("map", favMap);
    if (name.trim()) params.set("name", name.trim());
    return `${window.location.origin}/rank-card?${params.toString()}`;
  }

  async function share() {
    const url = shareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Valorant rank card - ${sourceLabel(source)}`,
          text: `I'm ${tier} in Valorant. Make your own rank card free on ggLobby.`,
          url,
        });
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* ignore */
      }
    }
  }

  function saveToProfile() {
    if (!user) {
      trackCtaClick(CTA_SOURCES.rank_card_save);
      openAuthGate({
        reason:
          "Create a free profile to save your Valorant rank card and share it with teammates",
        source: CTA_SOURCES.rank_card_save,
        redirectTo: "/rank-card",
      });
      return;
    }
    window.location.href = "/settings/games";
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <RankCardPreview ogUrl={ogUrl} photo={photo} body={cardBody} />

        <div className="space-y-5 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <div>
            <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-text-muted">
              Card source
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "manual" as const, label: "Manual", icon: Sparkles },
                { value: "career" as const, label: "Career", icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon;
                const active = source === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setSource(item.value);
                      setLookupError(null);
                    }}
                    className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface-light/50 text-text-secondary hover:border-border-light"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-text-muted">
              Template
            </span>
            <div className="grid grid-cols-4 gap-2">
              {TEMPLATE_OPTIONS.map((item) => {
                const active = template === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTemplate(item.value)}
                    className={`relative h-16 overflow-hidden rounded-lg border-2 bg-cover bg-center transition-all ${
                      active ? "scale-[1.02]" : "opacity-75 hover:opacity-100"
                    }`}
                    style={{
                      backgroundImage: `url(/images/cards/bg-${item.value}.jpg)`,
                      borderColor: active ? item.accent : "rgba(255,255,255,0.12)",
                    }}
                  >
                    <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[10px] font-black uppercase tracking-wide text-white">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-text-muted">
              Your photo (optional)
            </span>
            {photo ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt="Your uploaded player photo"
                  className="h-14 w-14 shrink-0 rounded-lg bg-black/25 object-contain"
                />
                <p className="min-w-0 flex-1 text-xs leading-relaxed text-text-muted">
                  Photo on the card — your main agent now sits behind it as the
                  backdrop.
                </p>
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="shrink-0 rounded-lg p-2 text-text-dim transition-colors hover:bg-white/[0.06] hover:text-text"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-background/40 p-3 transition-colors hover:border-primary/50">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={handlePhotoUpload}
                />
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ImagePlus className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-text">Upload your photo</span>
                  <span className="block text-xs text-text-muted">
                    PNG with background removed looks best
                  </span>
                </span>
              </label>
            )}
            {photoError && <p className="mt-2 text-xs text-error">{photoError}</p>}
          </div>

          <SelectField
            label="Favourite map"
            value={favMap}
            onChange={setFavMap}
            options={mapNames}
          />

          {source === "career" && (
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-text-muted">
                  Riot ID for career record
                </span>
                <div className="flex gap-2">
                  <input
                    value={riotId}
                    onChange={(event) => setRiotId(event.target.value)}
                    placeholder="Name#TAG"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-surface-light/60 px-3 py-2.5 text-sm text-text transition-colors hover:border-border-light focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={lookupCareerRecord}
                    isLoading={lookupLoading}
                    leftIcon={<Search className="h-4 w-4" />}
                  >
                    Fetch
                  </Button>
                </div>
              </label>
              {lookupError && (
                <p className="mt-2 text-xs text-error">{lookupError}</p>
              )}
              {careerLoaded ? (
                <div className="mt-3 grid gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primary">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Career result locked
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                    <span>Rank: <strong className="text-text">{tier}</strong></span>
                    <span>Peak: <strong className="text-text">{peakRank}</strong></span>
                    <span>Agent: <strong className="text-text">{agent}</strong></span>
                    <span>Role: <strong className="text-text">{role}</strong></span>
                  </div>
                  <p className="text-xs leading-relaxed text-text-muted">
                    Switch to Manual if the player wants to create a self-reported card.
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-text-muted">
                  Enter Riot ID and fetch. Career cards use lookup data and are marked as career record.
                </p>
              )}
            </div>
          )}

          {source === "manual" && (
            <>
              <SelectField label="Your Valorant rank" value={tier} onChange={setTier} options={VALORANT_TIERS} />
              <SelectField label="Peak rank" value={peakRank} onChange={setPeakRank} options={VALORANT_TIERS} />
              <SelectField label="Main agent" value={agent} onChange={(value) => {
                setAgent(value);
                setRole(agentRole(value));
              }} options={agents} />
              <SelectField label="Best weapon" value={weapon} onChange={setWeapon} options={weapons} />
              <SelectField label="Role" value={role} onChange={(value) => setRole(value as AgentRole)} options={ROLE_OPTIONS} />

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-text-muted">
                  Display name (optional)
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value.slice(0, 32))}
                  placeholder={username || "Your name"}
                  className="w-full rounded-lg border border-border bg-surface-light/60 px-3 py-2.5 text-sm text-text transition-colors hover:border-border-light focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </label>
            </>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full gap-2"
            isLoading={downloading}
            onClick={downloadPng}
            leftIcon={
              !downloading ? <Download className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />
            }
          >
            Download PNG
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="md"
              className="gap-2"
              onClick={share}
              leftIcon={
                copied ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )
              }
            >
              {copied ? "Copied" : "Share"}
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="gap-2"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl());
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              leftIcon={<Copy className="h-4 w-4" />}
            >
              Copy link
            </Button>
          </div>

          <button
            onClick={saveToProfile}
            className="w-full rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            {user ? "Set this rank on my profile" : "Save my rank card to my profile - free"}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-text-dim">
        Manual cards are self reported. Career cards are generated from lookup data.{" "}
        <Link href="/passport" className="text-primary hover:underline">
          Create your Valorant Passport next
        </Link>
      </p>
    </div>
  );
}

/**
 * Live preview of the rendered card. Shows the exact PNG the server generates
 * (same endpoint as the download), so the preview can never drift from the
 * downloaded card. New renders are preloaded off-screen and swapped in, with
 * the previous card staying visible underneath a small spinner. With an
 * uploaded photo the render is POSTed (a photo can't fit in a URL) and shown
 * via an object URL.
 */
function RankCardPreview({
  ogUrl,
  photo,
  body,
}: {
  ogUrl: string;
  photo: string | null;
  body: Record<string, unknown>;
}) {
  const [displayed, setDisplayed] = useState(ogUrl);
  const [loading, setLoading] = useState(false);
  const requestKey = photo ? JSON.stringify(body) : ogUrl;
  const latest = useRef(requestKey);
  // Key of the render currently on screen. Guards the effect so a finished
  // render doesn't re-trigger it (that caused an endless "Updating…" loop).
  const renderedKey = useRef(ogUrl);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    latest.current = requestKey;
    if (renderedKey.current === requestKey) return;
    // Debounce so rapid form edits trigger one render, not one per keystroke.
    const timer = setTimeout(async () => {
      setLoading(true);
      if (photo) {
        try {
          const res = await fetch("/api/og/rank-card", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error("render failed");
          const blob = await res.blob();
          if (latest.current !== requestKey) return;
          const url = URL.createObjectURL(blob);
          if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = url;
          renderedKey.current = requestKey;
          setDisplayed(url);
        } catch {
          /* keep the previous card visible */
        } finally {
          if (latest.current === requestKey) setLoading(false);
        }
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        if (latest.current === requestKey) {
          renderedKey.current = requestKey;
          setDisplayed(ogUrl);
          setLoading(false);
        }
      };
      img.onerror = () => {
        if (latest.current === requestKey) setLoading(false);
      };
      img.src = ogUrl;
    }, 450);
    return () => clearTimeout(timer);
  }, [requestKey, ogUrl, photo, body]);

  // Release the last object URL on unmount.
  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayed}
          alt="Valorant rank card preview"
          className="h-full w-full object-cover"
        />
        {loading && (
          <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 backdrop-blur-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="text-[11px] font-bold text-white">Updating…</span>
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-text-dim">
        Preview is the exact PNG you download.
      </p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-lg border border-border bg-surface-light/60 py-2.5 pl-3 pr-10 text-sm text-text transition-colors hover:border-border-light focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      </div>
    </label>
  );
}
