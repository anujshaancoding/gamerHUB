"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Copy, Check, Info, Share2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PC_GAMES,
  MOBILE_GAMES,
  cmPer360,
  eDPI,
  convertPcSens,
  convertMobileSens,
  type PcGame,
  type MobileGame,
} from "@/lib/pro/sens-conversion";
import { useAuth } from "@/lib/hooks/useAuth";
import { useActionGate } from "@/components/auth/auth-gate-provider";
import { trackCtaClick } from "@/lib/analytics/cta-click";
import { CTA_SOURCES } from "@/lib/analytics/sources";

type Family = "pc" | "mobile";

export function SensConverter() {
  const [family, setFamily] = useState<Family>("pc");

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-lg bg-surface-light p-1 self-start w-fit">
        {(["pc", "mobile"] as Family[]).map((f) => (
          <button
            key={f}
            onClick={() => setFamily(f)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              family === f
                ? "bg-surface text-text shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {f === "pc" ? "PC (Valorant / CS2 / Apex …)" : "Mobile (CODM / PUBG: New State)"}
          </button>
        ))}
      </div>

      {family === "pc" ? <PcConverter /> : <MobileConverter />}
    </div>
  );
}

// ─── PC ─────────────────────────────────────────────────────────────────────
function PcConverter() {
  const [fromId, setFromId] = useState<PcGame["id"]>("valorant");
  const [toId, setToId] = useState<PcGame["id"]>("cs2");
  const [sens, setSens] = useState("0.40");
  const [dpi, setDpi] = useState("800");

  // Hydrate from a shared result URL (?from=valorant&to=cs2&sens=0.4&dpi=800).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const f = sp.get("from");
    const t = sp.get("to");
    const s = sp.get("sens");
    const d = sp.get("dpi");
    if (f && PC_GAMES.some((g) => g.id === f)) setFromId(f as PcGame["id"]);
    if (t && PC_GAMES.some((g) => g.id === t)) setToId(t as PcGame["id"]);
    if (s) setSens(s);
    if (d) setDpi(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const from = PC_GAMES.find((g) => g.id === fromId)!;
  const to = PC_GAMES.find((g) => g.id === toId)!;

  const sensNum = Number(sens) || 0;
  const dpiNum = Number(dpi) || 0;

  const convertedSens = useMemo(() => convertPcSens(sensNum, from.yaw, to.yaw), [sensNum, from.yaw, to.yaw]);
  const cm360 = useMemo(() => cmPer360(sensNum, from.yaw, dpiNum), [sensNum, from.yaw, dpiNum]);
  const edpi = useMemo(() => eDPI(sensNum, dpiNum), [sensNum, dpiNum]);

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
    setSens(convertedSens.toFixed(5).replace(/\.?0+$/, ""));
  };

  const shareParams = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("from", fromId);
    sp.set("to", toId);
    sp.set("sens", sens);
    if (dpiNum > 0) sp.set("dpi", dpi);
    return sp.toString();
  }, [fromId, toId, sens, dpi, dpiNum]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <GameField label="From" value={fromId} onChange={(v) => setFromId(v as PcGame["id"])} options={PC_GAMES} />
        <button
          onClick={swap}
          className="rounded-full bg-surface-light hover:bg-primary/10 hover:text-primary p-3 transition-colors mx-auto"
          title="Swap"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>
        <GameField label="To" value={toId} onChange={(v) => setToId(v as PcGame["id"])} options={PC_GAMES} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField label={`${from.label} in-game sens`} value={sens} onChange={setSens} type="number" step="0.001" />
        <TextField label="Mouse DPI (optional, for cm/360 & eDPI)" value={dpi} onChange={setDpi} type="number" />
      </div>

      <ResultCard
        title={`Equivalent ${to.label} sens`}
        value={convertedSens.toFixed(5).replace(/\.?0+$/, "")}
        subline={from.label === to.label ? "Same game" : `from ${from.label}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Stat label={`${from.label} cm/360°`} value={dpiNum > 0 ? `${cm360.toFixed(1)} cm` : "Set DPI"} />
        <Stat label="eDPI" value={dpiNum > 0 ? `${edpi.toFixed(0)}` : "Set DPI"} />
      </div>

      {(from.notes || to.notes) && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 text-xs text-text-secondary">
          <Info className="h-3.5 w-3.5 text-warning mt-0.5 flex-shrink-0" />
          <p>
            {from.notes && <>{from.label}: {from.notes}. </>}
            {to.notes && <>{to.label}: {to.notes}.</>}
          </p>
        </div>
      )}

      <SaveShareSetup shareParams={shareParams} />
    </div>
  );
}

// ─── Mobile ─────────────────────────────────────────────────────────────────
function MobileConverter() {
  const [fromId, setFromId] = useState<MobileGame["id"]>("codm");
  const [toId, setToId] = useState<MobileGame["id"]>("pubgnewstate");
  const [sens, setSens] = useState("100");

  const from = MOBILE_GAMES.find((g) => g.id === fromId)!;
  const to = MOBILE_GAMES.find((g) => g.id === toId)!;

  const sensNum = Number(sens) || 0;
  const converted = useMemo(() => convertMobileSens(sensNum, from, to), [sensNum, from, to]);

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
    setSens(converted.toFixed(2).replace(/\.?0+$/, ""));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <GameField label="From" value={fromId} onChange={(v) => setFromId(v as MobileGame["id"])} options={MOBILE_GAMES} />
        <button
          onClick={swap}
          className="rounded-full bg-surface-light hover:bg-primary/10 hover:text-primary p-3 transition-colors mx-auto"
          title="Swap"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>
        <GameField label="To" value={toId} onChange={(v) => setToId(v as MobileGame["id"])} options={MOBILE_GAMES} />
      </div>

      <TextField
        label={`${from.label} sens value (0–${from.scaleMax})`}
        value={sens}
        onChange={setSens}
        type="number"
        max={String(from.scaleMax)}
        min="0"
        hint="Use any single scope value (Red Dot is the most common reference)."
      />

      <ResultCard
        title={`Equivalent ${to.label} sens`}
        value={converted.toFixed(2).replace(/\.?0+$/, "")}
        subline={`on ${to.label}'s 0–${to.scaleMax} scale`}
      />

      <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 text-xs text-text-secondary">
        <Info className="h-3.5 w-3.5 text-warning mt-0.5 flex-shrink-0" />
        <p>
          Mobile sens does not have a single mathematical conversion the way PC does — different
          touchscreens, sample rates and grip styles all matter. Treat the output as a starting
          point, then adjust by feel. Apply the same percentage offset to every scope (Red Dot,
          2×, 3×, 4×, 6×, 8×) to keep your muscle memory.
          {(from.notes || to.notes) && (
            <> {from.notes && <>{from.label}: {from.notes}. </>}{to.notes && <>{to.label}: {to.notes}.</>}</>
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Save & share setup (account gate on save) ───────────────────────────────
function SaveShareSetup({ shareParams }: { shareParams: string }) {
  const { user } = useAuth();
  const { openAuthGate } = useActionGate();
  const [copied, setCopied] = useState(false);

  function shareUrl(): string {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/pro/sens-converter?${shareParams}`;
  }

  async function share() {
    const url = shareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Valorant sens setup — ggLobby", url });
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

  function saveSetup() {
    if (!user) {
      trackCtaClick(CTA_SOURCES.sens_setup_save);
      openAuthGate({
        reason: "Create a free profile to save your sens setup and publish it to the community board",
        source: CTA_SOURCES.sens_setup_save,
        redirectTo: "/tools/sens-share",
      });
      return;
    }
    window.location.href = "/tools/sens-share";
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold text-text">Save &amp; share your setup</p>
      <p className="mt-1 text-xs text-text-muted">
        Get a link to this exact conversion, or publish your full sens to the community board.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={share}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Share this setup"}
        </button>
        <button
          onClick={saveSetup}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-light/40 px-3 py-2 text-xs font-medium text-text transition-colors hover:border-primary/40"
        >
          {user ? "Publish to the board" : "Save & publish — free account"}
        </button>
      </div>
    </div>
  );
}

// ─── Atoms ──────────────────────────────────────────────────────────────────
function GameField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  type,
  step,
  min,
  max,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-1">{label}</span>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        min={min}
        max={max}
        className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
      />
      {hint && <p className="text-[11px] text-text-muted mt-1">{hint}</p>}
    </label>
  );
}

function ResultCard({ title, value, subline }: { title: string; value: string; subline?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-text mt-1 font-mono">{value}</p>
        {subline && <p className="text-xs text-text-muted mt-1">{subline}</p>}
      </div>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* ignore */
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary px-3 py-2 text-xs font-medium"
      >
        {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-lg font-semibold text-text mt-1 font-mono">{value}</p>
    </div>
  );
}
