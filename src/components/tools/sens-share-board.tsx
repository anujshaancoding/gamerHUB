"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, ArrowUp, ArrowDown, Copy, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button, Modal } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { useActionGate } from "@/components/auth/auth-gate-provider";
import { trackCtaClick } from "@/lib/analytics/cta-click";
import { CTA_SOURCES } from "@/lib/analytics/sources";
import { SENS_GAMES, SENS_KEYS, type SensShare, type SensShareGame } from "@/lib/tools/sens-share-types";

type Sort = "top" | "recent";

export function SensShareBoard() {
  const [game, setGame] = useState<SensShareGame | "all">("all");
  const [sort, setSort] = useState<Sort>("top");
  const [shares, setShares] = useState<SensShare[] | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const { user } = useAuth();
  const { openAuthGate } = useActionGate();

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (game !== "all") q.set("game", game);
    q.set("sort", sort);
    const res = await fetch(`/api/sens-shares?${q}`);
    if (!res.ok) {
      setShares([]);
      return;
    }
    const json = await res.json();
    setShares(json.shares);
  }, [game, sort]);

  useEffect(() => {
    setShares(null);
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={game === "all"} onClick={() => setGame("all")}>All</FilterChip>
          {SENS_GAMES.map((g) => (
            <FilterChip key={g.id} active={game === g.id} onClick={() => setGame(g.id)}>
              {g.label}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm text-text focus:outline-none focus:border-primary/50"
          >
            <option value="top">Top</option>
            <option value="recent">Recent</option>
          </select>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (!user) {
                trackCtaClick(CTA_SOURCES.sens_setup_save);
                openAuthGate({
                  reason:
                    "Create a free profile to publish your sens setup and share it with teammates",
                  source: CTA_SOURCES.sens_setup_save,
                  redirectTo: "/tools/sens-share",
                });
                return;
              }
              setOpenCreate(true);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Publish your sens
          </Button>
        </div>
      </div>

      {shares === null && (
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl border border-border bg-surface animate-pulse" />
          ))}
        </div>
      )}

      {shares && shares.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-text-secondary text-sm">
          No configs published yet for this filter. Be the first.
        </div>
      )}

      {shares && shares.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {shares.map((s) => (
            <SensShareCard key={s.id} share={s} onChange={load} />
          ))}
        </div>
      )}

      <Modal isOpen={openCreate} onClose={() => setOpenCreate(false)} title="Publish your sensitivity" size="lg">
        <CreateForm
          onClose={() => setOpenCreate(false)}
          onCreated={() => {
            setOpenCreate(false);
            load();
          }}
        />
      </Modal>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
        active ? "bg-primary/15 border-primary/40 text-primary" : "bg-surface border-border text-text-secondary hover:border-primary/30"
      )}
    >
      {children}
    </button>
  );
}

function SensShareCard({ share, onChange }: { share: SensShare; onChange: () => void }) {
  const [vote, setVote] = useState(share.user_vote ?? null);
  const [score, setScore] = useState(share.vote_score);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const doVote = async (v: 1 | -1) => {
    if (!user) { window.location.href = "/login"; return; }
    const res = await fetch(`/api/sens-shares/${share.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voteType: v }),
    });
    if (!res.ok) return;
    const json = await res.json();
    setScore(json.score);
    setVote((prev) => (prev === v ? null : v));
    onChange();
  };

  const copyAll = async () => {
    const text = Object.entries(share.sensitivities)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      fetch(`/api/sens-shares/${share.id}/copy`, { method: "POST" }).catch(() => null);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-0.5 -ml-1">
          <button
            onClick={() => doVote(1)}
            className={cn("p-1 rounded hover:bg-primary/10", vote === 1 && "text-primary")}
            aria-label="upvote"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono font-semibold text-text">{score}</span>
          <button
            onClick={() => doVote(-1)}
            className={cn("p-1 rounded hover:bg-error/10", vote === -1 && "text-error")}
            aria-label="downvote"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text truncate">{share.title}</span>
            <Badge variant="secondary" size="sm">{share.game.toUpperCase()}</Badge>
            {share.is_featured && <Badge variant="primary" size="sm">Featured</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
            <Avatar src={share.author?.avatar_url ?? undefined} size="xs" alt={share.author?.username || ""} fallback={(share.author?.display_name || share.author?.username || "?")[0]} />
            <span>{share.author?.display_name || share.author?.username || "anon"}</span>
            {share.rank && <><span>·</span><span>{share.rank}</span></>}
            {share.device_model && <><span>·</span><span>{share.device_model}</span></>}
            {share.grip_style && <><span>·</span><span>{share.grip_style}</span></>}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-surface-light/40 border border-border p-3 text-xs font-mono space-y-0.5">
        {Object.entries(share.sensitivities).slice(0, 8).map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-text-muted">{k.replace(/_/g, " ")}</span>
            <span className="text-text">{String(v)}</span>
          </div>
        ))}
      </div>

      {share.notes && (
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{share.notes}</p>
      )}

      <button
        onClick={copyAll}
        className={cn(
          "rounded-lg border px-3 py-2 text-xs font-medium flex items-center justify-center gap-2 transition-colors",
          copied ? "border-success/40 bg-success/10 text-success" : "border-border bg-surface-light/40 hover:border-primary/40 text-text"
        )}
      >
        {copied ? <><Check className="h-3.5 w-3.5" /> Copied {share.copy_count + 1}</> : <><Copy className="h-3.5 w-3.5" /> Copy sens · {share.copy_count}</>}
      </button>
    </div>
  );
}

function CreateForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [game, setGame] = useState<SensShareGame>("valorant");
  const [title, setTitle] = useState("");
  const [device, setDevice] = useState("");
  const [grip, setGrip] = useState("");
  const [rank, setRank] = useState("");
  const [notes, setNotes] = useState("");
  const [sens, setSens] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const gameMeta = useMemo(() => SENS_GAMES.find((g) => g.id === game)!, [game]);
  const keys = SENS_KEYS[game];

  const submit = async () => {
    setSubmitting(true);
    try {
      const cleanSens: Record<string, number | string> = {};
      for (const k of keys) {
        const raw = sens[k];
        if (raw === undefined || raw === "") continue;
        const num = Number(raw);
        cleanSens[k] = Number.isFinite(num) ? num : raw;
      }
      const res = await fetch("/api/sens-shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game,
          platform: gameMeta.platform,
          title: title.trim(),
          sensitivities: cleanSens,
          device_model: device.trim() || null,
          grip_style: grip || null,
          rank: rank.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || "Failed to publish");
        return;
      }
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-text-muted block mb-1">Game</span>
          <select value={game} onChange={(e) => { setGame(e.target.value as SensShareGame); setSens({}); }} className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm">
            {SENS_GAMES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-text-muted block mb-1">Rank (optional)</span>
          <input value={rank} onChange={(e) => setRank(e.target.value)} placeholder="Conqueror / Immortal …" className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm" />
        </label>
      </div>

      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-text-muted block mb-1">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Low-sens Valorant config, 800 DPI" className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm" />
      </label>

      {gameMeta.platform === "mobile" ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-text-muted block mb-1">Device</span>
            <input value={device} onChange={(e) => setDevice(e.target.value)} placeholder="iQOO Neo 9 Pro" className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-text-muted block mb-1">Grip style</span>
            <select value={grip} onChange={(e) => setGrip(e.target.value)} className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm">
              <option value="">—</option>
              <option value="thumb">Thumb</option>
              <option value="claw">Claw</option>
              <option value="4-finger">4-finger</option>
              <option value="6-finger">6-finger</option>
            </select>
          </label>
        </div>
      ) : (
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-text-muted block mb-1">DPI / mouse (optional)</span>
          <input value={device} onChange={(e) => setDevice(e.target.value)} placeholder="800 DPI · Razer Viper 8K" className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm" />
        </label>
      )}

      <div>
        <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2">Sensitivities</p>
        <div className="grid grid-cols-2 gap-2">
          {keys.map((k) => (
            <label key={k} className="block">
              <span className="text-xs text-text-secondary block mb-1">{k.replace(/_/g, " ")}</span>
              <input
                type="text"
                inputMode="decimal"
                value={sens[k] ?? ""}
                onChange={(e) => setSens((p) => ({ ...p, [k]: e.target.value }))}
                className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-1.5 text-sm font-mono"
              />
            </label>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-text-muted block mb-1">Notes (optional)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Best for close fights, drop gyro on long-range." className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm" />
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onClose}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
        <Button variant="primary" size="sm" onClick={submit} disabled={submitting || title.trim().length < 4}>
          {submitting ? "Publishing…" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
