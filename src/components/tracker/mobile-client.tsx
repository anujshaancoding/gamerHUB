"use client";

import { useState, useEffect, useCallback, FormEvent, useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CategorySection } from "./category-section";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Upload, Loader2, ImagePlus, X, Save, History, Sparkles, Lock } from "lucide-react";
import { optimizedUpload } from "@/lib/upload";
import type { MobileInsights } from "@/lib/tracker/mobile-types";
import type { StatCategory } from "@/lib/tracker/types";

const ORDER: StatCategory[] = ["aim", "gamesense", "role", "map", "utility", "economy"];

type Game = "bgmi" | "freefire";

interface SavedUpload {
  id: string;
  game: Game;
  screenshot_url: string | null;
  raw_stats: Record<string, unknown>;
  insights: MobileInsights;
  uploaded_at: string;
}

const BGMI_TIERS = [
  "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Crown", "Ace", "Conqueror",
];
const FF_RANKS = [
  "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Heroic", "Master", "Grandmaster",
];

const BGMI_WEAPONS = ["M416", "AKM", "M762", "SCAR-L", "Mini14", "SLR", "M249", "AWM", "Kar98", "UMP45", "Vector"];
const BGMI_MAPS = ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Nusa", "Karakin"];
const FF_WEAPONS = ["M4A1", "AK", "AWM", "Kar98", "MP40", "M1014", "Groza", "XM8", "M14", "Gatling"];
const FF_CHARACTERS = ["Alok", "K", "Chrono", "Skyler", "Dimitri", "Wukong", "Kelly", "Hayato"];
const FF_MAPS = ["Bermuda", "Purgatory", "Kalahari", "Alpine", "Nexterra"];

export function MobileClient({ game }: { game: Game }) {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<SavedUpload[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/tracker/mobile?game=${game}&limit=20`);
      const data = await res.json();
      if (data.ok) setHistory(data.uploads ?? []);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, [user, game]);

  useEffect(() => { void fetchHistory(); }, [fetchHistory]);

  if (authLoading) {
    return (
      <Card variant="elevated" className="p-6 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  if (!user) {
    return (
      <Card variant="elevated" className="space-y-4 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Lock className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-text">Sign in to use the {game === "bgmi" ? "BGMI" : "Free Fire"} tracker</h3>
          <p className="text-sm text-text-muted">
            We save your uploads to your account so you can track progress over time.
            No public APIs exist for {game === "bgmi" ? "BGMI" : "Free Fire"} — you upload a screenshot and enter your visible stats.
          </p>
        </div>
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <UploadAndAnalyze game={game} userId={user.id} onSaved={fetchHistory} />

      {history.length > 0 ? (
        <Card variant="outlined" className="p-4 sm:p-5">
          <button
            type="button"
            onClick={() => setShowHistory((s) => !s)}
            className="flex w-full items-center justify-between text-left"
          >
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-text">
              <History className="h-4 w-4 text-primary" /> My Stats History ({history.length})
            </h3>
            <span className="text-xs text-text-muted">{showHistory ? "Hide" : "Show"}</span>
          </button>
          {showHistory ? (
            <div className="mt-4 space-y-2">
              {historyLoading ? (
                <p className="text-sm text-text-muted">Loading…</p>
              ) : (
                history.map((up) => (
                  <HistoryRow key={up.id} upload={up} />
                ))
              )}
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

interface UploadProps {
  game: Game;
  userId: string;
  onSaved: () => void;
}

function UploadAndAnalyze({ game, userId, onSaved }: UploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [storedScreenshotUrl, setStoredScreenshotUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<MobileInsights | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state — game-specific
  const [bgmi, setBgmi] = useState({
    inGameName: "", tier: "Diamond", matchesPlayed: 0, wins: 0, kills: 0, deaths: 0,
    damageDealt: 0, headshotPct: 0, longestKill: 0, topWeapon: "M416", favoriteMap: "Erangel", survivalTimeMin: 0,
  });
  const [ff, setFf] = useState({
    inGameName: "", rank: "Diamond", matchesPlayed: 0, wins: 0, kills: 0, damageDealt: 0,
    headshotPct: 0, topWeapon: "M4A1", favoriteCharacter: "Alok", favoriteMap: "Bermuda", survivalTimeMin: 0,
  });

  const onFileChange = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setStoredScreenshotUrl(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const uploadScreenshot = async () => {
    if (!file) return null;
    setUploadingImage(true);
    setError(null);
    try {
      const result = await optimizedUpload(file, "media", userId);
      // Convert absolute URL to /uploads/... path for the API allowlist
      const path = result.publicUrl.replace(/^https?:\/\/[^/]+/, "");
      setStoredScreenshotUrl(path);
      return path;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInsights(null);
    setSubmitting(true);

    let screenshotUrl = storedScreenshotUrl;
    if (file && !screenshotUrl) {
      screenshotUrl = await uploadScreenshot();
      // Even if upload fails, continue with analysis — stat is the priority.
    }

    try {
      const rawStats = game === "bgmi" ? bgmi : ff;
      const res = await fetch("/api/tracker/mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, rawStats, screenshotUrl }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error?.message ?? "Could not analyze stats.");
      } else {
        setInsights(data.insights as MobileInsights);
        onSaved();
      }
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const grouped = insights
    ? (ORDER.reduce(
        (acc, cat) => {
          acc[cat] = insights.findings.filter((f) => f.category === cat);
          return acc;
        },
        {} as Record<StatCategory, MobileInsights["findings"]>
      ))
    : null;

  return (
    <>
      <Card variant="elevated" className="p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text sm:text-xl">
              Upload your {game === "bgmi" ? "BGMI" : "Free Fire"} stats
            </h2>
            <p className="text-xs text-text-muted sm:text-sm">
              Drop a screenshot of your career stats screen, then enter the visible numbers.
              We&apos;ll analyze your strengths and weaknesses, and save it to your profile.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          {/* Screenshot column */}
          <div>
            {previewUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Stats preview"
                  className="w-full rounded-lg border border-border object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    setStoredScreenshotUrl(null);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-text hover:bg-background"
                  aria-label="Remove screenshot"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-light/30 text-text-muted transition-colors hover:border-primary/50 hover:text-text"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-medium">Upload screenshot</span>
                <span className="text-xs">PNG / JPG, up to 10 MB</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
            {uploadingImage ? (
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-text-muted">
                <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
              </p>
            ) : null}
          </div>

          {/* Form column */}
          <form onSubmit={onSubmit} className="space-y-3">
            {game === "bgmi" ? (
              <BgmiForm bgmi={bgmi} setBgmi={setBgmi} />
            ) : (
              <FreeFireForm ff={ff} setFf={setFf} />
            )}

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-text-muted">
                Your stats save to your profile and stay <strong>private</strong> by default.
              </p>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />Analyze & Save</>
                )}
              </Button>
            </div>

            {error ? (
              <p className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
            ) : null}
          </form>
        </div>
      </Card>

      {insights && grouped ? (
        <div className="space-y-6">
          <Card variant="elevated" className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm text-text-muted">{game === "bgmi" ? "BGMI" : "Free Fire"} player</p>
                <h3 className="text-xl font-bold text-text">{insights.inGameName}</h3>
                <p className="mt-1 text-xs text-text-muted">
                  {insights.rank} · {insights.matchesPlayed} matches · {insights.winRate}% WR
                </p>
              </div>
              <Badge variant="success" size="sm">Saved to your account</Badge>
            </div>
            <p className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-text">
              {insights.summary.headline}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              <SumStat label="Strengths" value={insights.summary.strongCount} tone="success" />
              <SumStat label="Decent" value={insights.summary.decentCount} tone="warning" />
              <SumStat label="Weaknesses" value={insights.summary.weakCount} tone="error" />
            </div>
          </Card>
          {ORDER.map((cat) => (
            <CategorySection key={cat} category={cat} findings={grouped[cat]} />
          ))}
        </div>
      ) : null}
    </>
  );
}

function HistoryRow({ upload }: { upload: SavedUpload }) {
  const i = upload.insights;
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-surface-light/30 px-3 py-2">
      {upload.screenshot_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={upload.screenshot_url} alt="" className="h-10 w-10 rounded object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded bg-surface-light text-xs text-text-muted">N/A</div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">
          {i.inGameName} <span className="text-text-muted">· {i.rank}</span>
        </p>
        <p className="text-[11px] text-text-muted">
          {new Date(upload.uploaded_at).toLocaleString()} · {i.matchesPlayed} matches · {i.winRate}% WR
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">{i.summary.strongCount}</span>
        <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning">{i.summary.decentCount}</span>
        <span className="rounded bg-error/15 px-1.5 py-0.5 text-[10px] font-bold text-error">{i.summary.weakCount}</span>
      </div>
    </div>
  );
}

function SumStat({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "error" }) {
  const cls = {
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    error: "border-error/30 bg-error/10 text-error",
  }[tone];
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${cls}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}

// ── Forms ───────────────────────────────────────────────────────────────────

function NumberField({
  label, value, onChange, min = 0, step = 1,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; step?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <Input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="mt-1"
      />
    </label>
  );
}

function SelectField({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text focus:border-primary focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

interface BgmiFormProps {
  bgmi: {
    inGameName: string; tier: string; matchesPlayed: number; wins: number; kills: number; deaths: number;
    damageDealt: number; headshotPct: number; longestKill: number; topWeapon: string; favoriteMap: string;
    survivalTimeMin: number;
  };
  setBgmi: React.Dispatch<React.SetStateAction<BgmiFormProps["bgmi"]>>;
}

function BgmiForm({ bgmi, setBgmi }: BgmiFormProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <label className="col-span-2 sm:col-span-3 block">
        <span className="text-xs font-medium text-text-secondary">In-Game Name</span>
        <Input
          value={bgmi.inGameName}
          onChange={(e) => setBgmi({ ...bgmi, inGameName: e.target.value })}
          placeholder="Your BGMI character name"
          className="mt-1"
          maxLength={32}
          required
        />
      </label>
      <SelectField label="Tier" value={bgmi.tier} onChange={(v) => setBgmi({ ...bgmi, tier: v })} options={BGMI_TIERS} />
      <NumberField label="Matches Played" value={bgmi.matchesPlayed} onChange={(v) => setBgmi({ ...bgmi, matchesPlayed: v })} />
      <NumberField label="Wins (Chicken Dinners)" value={bgmi.wins} onChange={(v) => setBgmi({ ...bgmi, wins: v })} />
      <NumberField label="Total Kills" value={bgmi.kills} onChange={(v) => setBgmi({ ...bgmi, kills: v })} />
      <NumberField label="Total Deaths" value={bgmi.deaths} onChange={(v) => setBgmi({ ...bgmi, deaths: v })} />
      <NumberField label="Total Damage" value={bgmi.damageDealt} onChange={(v) => setBgmi({ ...bgmi, damageDealt: v })} />
      <NumberField label="Headshot %" value={bgmi.headshotPct} onChange={(v) => setBgmi({ ...bgmi, headshotPct: v })} step={0.1} />
      <NumberField label="Longest Kill (m)" value={bgmi.longestKill} onChange={(v) => setBgmi({ ...bgmi, longestKill: v })} />
      <NumberField label="Avg Survival (min)" value={bgmi.survivalTimeMin} onChange={(v) => setBgmi({ ...bgmi, survivalTimeMin: v })} step={0.1} />
      <SelectField label="Top Weapon" value={bgmi.topWeapon} onChange={(v) => setBgmi({ ...bgmi, topWeapon: v })} options={BGMI_WEAPONS} />
      <SelectField label="Favorite Map" value={bgmi.favoriteMap} onChange={(v) => setBgmi({ ...bgmi, favoriteMap: v })} options={BGMI_MAPS} />
    </div>
  );
}

interface FreeFireFormProps {
  ff: {
    inGameName: string; rank: string; matchesPlayed: number; wins: number; kills: number;
    damageDealt: number; headshotPct: number; topWeapon: string; favoriteCharacter: string;
    favoriteMap: string; survivalTimeMin: number;
  };
  setFf: React.Dispatch<React.SetStateAction<FreeFireFormProps["ff"]>>;
}

function FreeFireForm({ ff, setFf }: FreeFireFormProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <label className="col-span-2 sm:col-span-3 block">
        <span className="text-xs font-medium text-text-secondary">In-Game Name</span>
        <Input
          value={ff.inGameName}
          onChange={(e) => setFf({ ...ff, inGameName: e.target.value })}
          placeholder="Your Free Fire character name"
          className="mt-1"
          maxLength={32}
          required
        />
      </label>
      <SelectField label="Rank" value={ff.rank} onChange={(v) => setFf({ ...ff, rank: v })} options={FF_RANKS} />
      <NumberField label="Matches Played" value={ff.matchesPlayed} onChange={(v) => setFf({ ...ff, matchesPlayed: v })} />
      <NumberField label="Booyahs (Wins)" value={ff.wins} onChange={(v) => setFf({ ...ff, wins: v })} />
      <NumberField label="Total Kills" value={ff.kills} onChange={(v) => setFf({ ...ff, kills: v })} />
      <NumberField label="Total Damage" value={ff.damageDealt} onChange={(v) => setFf({ ...ff, damageDealt: v })} />
      <NumberField label="Headshot %" value={ff.headshotPct} onChange={(v) => setFf({ ...ff, headshotPct: v })} step={0.1} />
      <NumberField label="Avg Survival (min)" value={ff.survivalTimeMin} onChange={(v) => setFf({ ...ff, survivalTimeMin: v })} step={0.1} />
      <SelectField label="Top Weapon" value={ff.topWeapon} onChange={(v) => setFf({ ...ff, topWeapon: v })} options={FF_WEAPONS} />
      <SelectField label="Main Character" value={ff.favoriteCharacter} onChange={(v) => setFf({ ...ff, favoriteCharacter: v })} options={FF_CHARACTERS} />
      <SelectField label="Favorite Map" value={ff.favoriteMap} onChange={(v) => setFf({ ...ff, favoriteMap: v })} options={FF_MAPS} />
    </div>
  );
}
