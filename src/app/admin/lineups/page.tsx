"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, UploadCloud, Plus, Loader2, Youtube } from "lucide-react";
import { MAPS } from "@/lib/data/valorant-maps";
import { AGENTS } from "@/lib/data/valorant-agents";
import { uploadVideoViaPresign } from "@/lib/services/video-upload";
import {
  type Lineup,
  type LineupSide,
  SIDES,
} from "@/lib/data/lineup-types";

const EMPTY = {
  map: "ascent",
  agent: "viper",
  ability: "",
  side: "Attack" as LineupSide,
  site: "A",
  fromCallout: "",
  toCallout: "",
  title: "",
  description: "",
  difficulty: 2 as 1 | 2 | 3,
  videoUrl: "",
  youtubeId: "",
};

function parseYouTube(input: string): string {
  if (!input) return "";
  const m = input.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/
  );
  return m ? m[1] : input.trim();
}

export default function AdminLineupsPage() {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedAgent = AGENTS.find((a) => a.slug === form.agent);
  const selectedMap = MAPS.find((m) => m.slug === form.map);

  function load() {
    fetch("/api/lineups")
      .then((r) => r.json())
      .then((d) => setLineups(d.lineups ?? []))
      .catch(() => setLineups([]));
  }
  useEffect(load, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setMsg(null);
    try {
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const path = `lineups/${form.map}/${Date.now()}.${ext}`;

      // On R2/serverless, push the clip straight to R2 via a presigned URL.
      // Returns null on the local driver — fall back to the server POST.
      const direct = await uploadVideoViaPresign(file, path, () => {});
      let publicUrl: string;
      if (direct) {
        publicUrl = direct.publicUrl;
      } else {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("path", path);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        publicUrl = data.publicUrl;
      }

      setForm((f) => ({ ...f, videoUrl: publicUrl, youtubeId: "" }));
      setMsg({ ok: true, text: "Video uploaded." });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form.title || !form.ability || !form.fromCallout || !form.toCallout) {
      setMsg({ ok: false, text: "Fill title, ability, from and to." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        ...form,
        youtubeId: form.youtubeId ? parseYouTube(form.youtubeId) : "",
      };
      const res = await fetch("/api/lineups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg({ ok: true, text: "Lineup added." });
      setForm({ ...EMPTY, map: form.map, agent: form.agent });
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this lineup?")) return;
    const res = await fetch(`/api/lineups?id=${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const field =
    "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-violet-400 focus:outline-none";
  const lbl = "block text-xs font-medium text-white/50 mb-1";

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-white">Lineups</h1>
      <p className="mt-1 text-sm text-white/40">
        Add Valorant lineups. Upload a short clip (mp4/webm, ≤10&nbsp;MB) or
        paste a YouTube link — fill them in over time.
      </p>

      {msg && (
        <div
          className={`mt-4 rounded-lg border px-4 py-2 text-sm ${
            msg.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Form */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-[#0e0e1a] p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={lbl}>Map</label>
            <select
              className={field}
              value={form.map}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  map: e.target.value,
                  site: MAPS.find((m) => m.slug === e.target.value)?.sites[0] || "A",
                }))
              }
            >
              {MAPS.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Agent</label>
            <select
              className={field}
              value={form.agent}
              onChange={(e) =>
                setForm((f) => ({ ...f, agent: e.target.value, ability: "" }))
              }
            >
              {AGENTS.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Ability</label>
            <select
              className={field}
              value={form.ability}
              onChange={(e) =>
                setForm((f) => ({ ...f, ability: e.target.value }))
              }
            >
              <option value="">Select ability…</option>
              {selectedAgent?.abilities.map((ab) => (
                <option key={ab.key} value={ab.name}>
                  {ab.key} · {ab.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Side</label>
            <select
              className={field}
              value={form.side}
              onChange={(e) =>
                setForm((f) => ({ ...f, side: e.target.value as LineupSide }))
              }
            >
              {SIDES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Site</label>
            <select
              className={field}
              value={form.site}
              onChange={(e) =>
                setForm((f) => ({ ...f, site: e.target.value }))
              }
            >
              {(selectedMap?.sites ?? ["A", "B"]).map((s) => (
                <option key={s} value={s}>
                  {s} Site
                </option>
              ))}
              <option value="Mid">Mid</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Difficulty</label>
            <select
              className={field}
              value={form.difficulty}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  difficulty: Number(e.target.value) as 1 | 2 | 3,
                }))
              }
            >
              <option value={1}>Easy</option>
              <option value={2}>Medium</option>
              <option value={3}>Hard</option>
            </select>
          </div>
          <div>
            <label className={lbl}>From callout</label>
            <input
              className={field}
              placeholder="e.g. A Main"
              value={form.fromCallout}
              onChange={(e) =>
                setForm((f) => ({ ...f, fromCallout: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={lbl}>To / target</label>
            <input
              className={field}
              placeholder="e.g. A Site default plant"
              value={form.toCallout}
              onChange={(e) =>
                setForm((f) => ({ ...f, toCallout: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={lbl}>Title</label>
            <input
              className={field}
              placeholder="e.g. Viper one-way A Main"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={lbl}>Description</label>
          <textarea
            className={`${field} min-h-[70px]`}
            placeholder="Stand here, align crosshair to…, jump-throw."
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>

        {/* Video */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={lbl}>Upload clip (mp4/webm, ≤10MB)</label>
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white/60 hover:bg-white/10 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              {form.videoUrl ? "Replace clip" : "Choose video"}
            </button>
            {form.videoUrl && (
              <p className="mt-1 truncate text-xs text-emerald-400">
                {form.videoUrl}
              </p>
            )}
          </div>
          <div>
            <label className={lbl}>…or YouTube link</label>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3">
              <Youtube className="h-4 w-4 shrink-0 text-white/40" />
              <input
                className="w-full bg-transparent py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
                placeholder="https://youtu.be/…"
                value={form.youtubeId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    youtubeId: e.target.value,
                    videoUrl: "",
                  }))
                }
              />
            </div>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add lineup
        </button>
      </div>

      {/* List */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-white/40">
        Existing lineups ({lineups.length})
      </h2>
      <div className="mt-3 space-y-2">
        {lineups.length === 0 && (
          <p className="text-sm text-white/30">No lineups yet.</p>
        )}
        {lineups.map((l) => (
          <div
            key={l.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#0e0e1a] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {l.title}
              </p>
              <p className="truncate text-xs text-white/40">
                {MAPS.find((m) => m.slug === l.map)?.name} ·{" "}
                {AGENTS.find((a) => a.slug === l.agent)?.name} · {l.ability} ·{" "}
                {l.side} {l.site}
                {l.youtubeId
                  ? " · YouTube"
                  : l.videoUrl
                  ? " · Clip"
                  : " · No video"}
              </p>
            </div>
            <button
              onClick={() => remove(l.id)}
              className="shrink-0 rounded-lg p-2 text-white/40 hover:bg-red-500/10 hover:text-red-400"
              aria-label="Delete lineup"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
