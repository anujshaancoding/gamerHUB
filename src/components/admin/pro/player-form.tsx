"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { csrfHeaders } from "@/lib/hooks/useCsrfToken";

type Game = "valorant";
type Platform = "pc" | "mobile";

interface PlayerData {
  id?: string;
  slug: string;
  game: Game;
  ign: string;
  real_name: string;
  team_id: string | null;
  role: string;
  region: string;
  photo_url: string;
  bio: string;
  age: string;
  total_earnings: string;
  earnings_currency: string;
  peak_rank: string;
  current_rank: string;
  national_rank: string;
  is_active: boolean;
  is_featured: boolean;
  socials: Record<string, string>;
}

interface StatsData {
  season: string;
  is_current: boolean;
  matches_played: string;
  wins: string;
  losses: string;
  k_d_ratio: string;
  adr: string;
  hs_pct: string;
  acs: string;
  game_stats_json: string;
  source_url: string;
}

interface GearData {
  platform: Platform;
  device_model: string;
  cpu: string;
  gpu: string;
  ram: string;
  monitor: string;
  monitor_hz: string;
  mouse: string;
  keyboard: string;
  headphones: string;
  mousepad: string;
  grip_style: string;
  controllers: string;
  sensitivities_json: string;
  ingame_settings_json: string;
  layout_image_url: string;
  notes: string;
  source_url: string;
}

interface TeamOption {
  id: string;
  name: string;
  game: string;
  short_name: string | null;
}

const empty: PlayerData = {
  slug: "",
  game: "valorant",
  ign: "",
  real_name: "",
  team_id: null,
  role: "",
  region: "",
  photo_url: "",
  bio: "",
  age: "",
  total_earnings: "",
  earnings_currency: "INR",
  peak_rank: "",
  current_rank: "",
  national_rank: "",
  is_active: true,
  is_featured: false,
  socials: {},
};

const emptyStats: StatsData = {
  season: "2026-S1",
  is_current: true,
  matches_played: "",
  wins: "",
  losses: "",
  k_d_ratio: "",
  adr: "",
  hs_pct: "",
  acs: "",
  game_stats_json: "{}",
  source_url: "",
};

const emptyGear: GearData = {
  platform: "pc",
  device_model: "",
  cpu: "",
  gpu: "",
  ram: "",
  monitor: "",
  monitor_hz: "",
  mouse: "",
  keyboard: "",
  headphones: "",
  mousepad: "",
  grip_style: "",
  controllers: "",
  sensitivities_json: "{}",
  ingame_settings_json: "{}",
  layout_image_url: "",
  notes: "",
  source_url: "",
};

export function PlayerForm({ playerId }: { playerId?: string }) {
  const router = useRouter();
  const isEdit = !!playerId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [player, setPlayer] = useState<PlayerData>(empty);
  const [stats, setStats] = useState<StatsData>(emptyStats);
  const [gear, setGear] = useState<GearData>(emptyGear);
  const [teams, setTeams] = useState<TeamOption[]>([]);

  useEffect(() => {
    fetch("/api/admin/pro/teams")
      .then((r) => r.json())
      .then((d) => setTeams(d.teams || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/pro/players?id=${playerId}`).then((r) => r.json()),
      fetch(`/api/admin/pro/players/${playerId}/stats`).then((r) => r.json()),
      fetch(`/api/admin/pro/players/${playerId}/gear`).then((r) => r.json()),
    ])
      .then(([pRes, sRes, gRes]) => {
        if (pRes.player) {
          const p = pRes.player;
          setPlayer({
            id: p.id,
            slug: p.slug || "",
            game: p.game,
            ign: p.ign || "",
            real_name: p.real_name || "",
            team_id: p.team_id || null,
            role: p.role || "",
            region: p.region || "",
            photo_url: p.photo_url || "",
            bio: p.bio || "",
            age: p.age != null ? String(p.age) : "",
            total_earnings: p.total_earnings != null ? String(p.total_earnings) : "",
            earnings_currency: p.earnings_currency || "INR",
            peak_rank: p.peak_rank || "",
            current_rank: p.current_rank || "",
            national_rank: p.national_rank != null ? String(p.national_rank) : "",
            is_active: p.is_active !== false,
            is_featured: !!p.is_featured,
            socials: p.socials || {},
          });
        }
        const current = (sRes.stats || []).find((s: { is_current: boolean }) => s.is_current) || (sRes.stats || [])[0];
        if (current) {
          setStats({
            season: current.season,
            is_current: !!current.is_current,
            matches_played: current.matches_played != null ? String(current.matches_played) : "",
            wins: current.wins != null ? String(current.wins) : "",
            losses: current.losses != null ? String(current.losses) : "",
            k_d_ratio: current.k_d_ratio != null ? String(current.k_d_ratio) : "",
            adr: current.adr != null ? String(current.adr) : "",
            hs_pct: current.hs_pct != null ? String(current.hs_pct) : "",
            acs: current.acs != null ? String(current.acs) : "",
            game_stats_json: JSON.stringify(current.game_stats || {}, null, 2),
            source_url: current.source_url || "",
          });
        }
        if (gRes.gear) {
          const g = gRes.gear;
          setGear({
            platform: g.platform,
            device_model: g.device_model || "",
            cpu: g.cpu || "",
            gpu: g.gpu || "",
            ram: g.ram || "",
            monitor: g.monitor || "",
            monitor_hz: g.monitor_hz != null ? String(g.monitor_hz) : "",
            mouse: g.mouse || "",
            keyboard: g.keyboard || "",
            headphones: g.headphones || "",
            mousepad: g.mousepad || "",
            grip_style: g.grip_style || "",
            controllers: g.controllers || "",
            sensitivities_json: JSON.stringify(g.sensitivities || {}, null, 2),
            ingame_settings_json: JSON.stringify(g.ingame_settings || {}, null, 2),
            layout_image_url: g.layout_image_url || "",
            notes: g.notes || "",
            source_url: g.source_url || "",
          });
        }
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [playerId]);

  const teamsForGame = teams.filter((t) => t.game === player.game);

  const handleSubmit = async () => {
    if (!player.ign.trim()) {
      toast.error("IGN is required");
      return;
    }
    setSaving(true);
    try {
      let savedId = playerId;
      const payload: Record<string, unknown> = {
        slug: player.slug || undefined,
        game: player.game,
        ign: player.ign.trim(),
        real_name: player.real_name.trim() || null,
        team_id: player.team_id || null,
        role: player.role.trim() || null,
        region: player.region.trim() || null,
        photo_url: player.photo_url.trim() || null,
        bio: player.bio.trim() || null,
        age: player.age ? Number(player.age) : null,
        total_earnings: player.total_earnings ? Number(player.total_earnings) : null,
        earnings_currency: player.earnings_currency || "INR",
        peak_rank: player.peak_rank.trim() || null,
        current_rank: player.current_rank.trim() || null,
        national_rank: player.national_rank ? Number(player.national_rank) : null,
        is_active: player.is_active,
        is_featured: player.is_featured,
        socials: player.socials,
      };

      if (isEdit) {
        const res = await fetch("/api/admin/pro/players", {
          method: "PATCH",
          headers: csrfHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ id: playerId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        const res = await fetch("/api/admin/pro/players", {
          method: "POST",
          headers: csrfHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        savedId = data.player.id;
      }

      // Stats (only save if season + some value)
      if (savedId && stats.season.trim()) {
        let gameStats: Record<string, unknown> = {};
        try {
          gameStats = stats.game_stats_json.trim() ? JSON.parse(stats.game_stats_json) : {};
        } catch {
          throw new Error("game_stats_json is not valid JSON");
        }
        const statsRes = await fetch(`/api/admin/pro/players/${savedId}/stats`, {
          method: "PUT",
          headers: csrfHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            season: stats.season.trim(),
            is_current: stats.is_current,
            matches_played: stats.matches_played ? Number(stats.matches_played) : null,
            wins: stats.wins ? Number(stats.wins) : null,
            losses: stats.losses ? Number(stats.losses) : null,
            k_d_ratio: stats.k_d_ratio ? Number(stats.k_d_ratio) : null,
            adr: stats.adr ? Number(stats.adr) : null,
            hs_pct: stats.hs_pct ? Number(stats.hs_pct) : null,
            acs: stats.acs ? Number(stats.acs) : null,
            game_stats: gameStats,
            source_url: stats.source_url.trim() || null,
          }),
        });
        const statsData = await statsRes.json();
        if (!statsRes.ok) throw new Error(statsData.error || "Failed to save stats");
      }

      // Gear (save if any meaningful field filled)
      const gearHasContent =
        gear.device_model || gear.mouse || gear.cpu || gear.grip_style ||
        gear.controllers || gear.monitor || gear.keyboard ||
        gear.sensitivities_json.trim() !== "{}" ||
        gear.ingame_settings_json.trim() !== "{}";
      if (savedId && gearHasContent) {
        let sens: Record<string, unknown> = {};
        let settings: Record<string, unknown> = {};
        try {
          sens = gear.sensitivities_json.trim() ? JSON.parse(gear.sensitivities_json) : {};
        } catch {
          throw new Error("sensitivities_json is not valid JSON");
        }
        try {
          settings = gear.ingame_settings_json.trim() ? JSON.parse(gear.ingame_settings_json) : {};
        } catch {
          throw new Error("ingame_settings_json is not valid JSON");
        }
        const gearRes = await fetch(`/api/admin/pro/players/${savedId}/gear`, {
          method: "PUT",
          headers: csrfHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            platform: gear.platform,
            device_model: gear.device_model.trim() || null,
            cpu: gear.cpu.trim() || null,
            gpu: gear.gpu.trim() || null,
            ram: gear.ram.trim() || null,
            monitor: gear.monitor.trim() || null,
            monitor_hz: gear.monitor_hz ? Number(gear.monitor_hz) : null,
            mouse: gear.mouse.trim() || null,
            keyboard: gear.keyboard.trim() || null,
            headphones: gear.headphones.trim() || null,
            mousepad: gear.mousepad.trim() || null,
            grip_style: gear.grip_style.trim() || null,
            controllers: gear.controllers.trim() || null,
            sensitivities: sens,
            ingame_settings: settings,
            layout_image_url: gear.layout_image_url.trim() || null,
            notes: gear.notes.trim() || null,
            source_url: gear.source_url.trim() || null,
          }),
        });
        const gearData = await gearRes.json();
        if (!gearRes.ok) throw new Error(gearData.error || "Failed to save gear");
      }

      toast.success(isEdit ? "Saved" : "Player created");
      router.push("/admin/pro");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-16 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href="/admin/pro"
          className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Pro Hub
        </Link>
        <h2 className="text-lg font-semibold text-white mt-1">
          {isEdit ? `Edit ${player.ign || "Player"}` : "New Player"}
        </h2>
      </div>

      <Section title="Identity">
        <Grid>
          <Field label="Game">
            <Select
              value={player.game}
              onValueChange={(v) => setPlayer({ ...player, game: v as Game })}
              disabled={isEdit}
            >
              <SelectTrigger className="admin-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="valorant">Valorant</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="IGN" required>
            <Input value={player.ign} onChange={(v) => setPlayer({ ...player, ign: v })} placeholder="SkRossi" />
          </Field>
          <Field label="Real name">
            <Input value={player.real_name} onChange={(v) => setPlayer({ ...player, real_name: v })} placeholder="Ganesh Gangadhar" />
          </Field>
          <Field label="Slug (auto if empty)">
            <Input value={player.slug} onChange={(v) => setPlayer({ ...player, slug: v })} placeholder="ge-skrossi" />
          </Field>
          <Field label="Team">
            <Select
              value={player.team_id || "none"}
              onValueChange={(v) => setPlayer({ ...player, team_id: v === "none" ? null : v })}
            >
              <SelectTrigger className="admin-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Free agent</SelectItem>
                {teamsForGame.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}{t.short_name ? ` [${t.short_name}]` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Role">
            <Input value={player.role} onChange={(v) => setPlayer({ ...player, role: v })} placeholder="Duelist / IGL / Assaulter" />
          </Field>
          <Field label="Region">
            <Input value={player.region} onChange={(v) => setPlayer({ ...player, region: v })} placeholder="Mumbai" />
          </Field>
          <Field label="Age">
            <Input value={player.age} onChange={(v) => setPlayer({ ...player, age: v })} placeholder="22" type="number" />
          </Field>
          <Field label="Photo URL">
            <Input value={player.photo_url} onChange={(v) => setPlayer({ ...player, photo_url: v })} placeholder="https://..." />
          </Field>
        </Grid>
        <Field label="Bio">
          <Textarea value={player.bio} onChange={(v) => setPlayer({ ...player, bio: v })} placeholder="Short paragraph used on the player profile" rows={3} />
        </Field>
      </Section>

      <Section title="Ranking">
        <Grid>
          <Field label="National rank (India)">
            <Input value={player.national_rank} onChange={(v) => setPlayer({ ...player, national_rank: v })} placeholder="1" type="number" />
          </Field>
          <Field label="Peak rank">
            <Input value={player.peak_rank} onChange={(v) => setPlayer({ ...player, peak_rank: v })} placeholder="Radiant / Conqueror" />
          </Field>
          <Field label="Current rank">
            <Input value={player.current_rank} onChange={(v) => setPlayer({ ...player, current_rank: v })} placeholder="Radiant" />
          </Field>
          <Field label="Total earnings">
            <Input value={player.total_earnings} onChange={(v) => setPlayer({ ...player, total_earnings: v })} placeholder="125000" type="number" />
          </Field>
          <Field label="Currency">
            <Input value={player.earnings_currency} onChange={(v) => setPlayer({ ...player, earnings_currency: v })} placeholder="INR" />
          </Field>
        </Grid>
        <div className="flex flex-wrap gap-4 pt-2">
          <Toggle label="Active (visible on /pro)" checked={player.is_active} onChange={(v) => setPlayer({ ...player, is_active: v })} />
          <Toggle label="Featured" checked={player.is_featured} onChange={(v) => setPlayer({ ...player, is_featured: v })} />
        </div>
      </Section>

      <Section title="Socials">
        <Grid>
          {(["twitter", "instagram", "youtube", "twitch", "discord", "website"] as const).map((k) => (
            <Field key={k} label={k}>
              <Input
                value={player.socials[k] || ""}
                onChange={(v) => setPlayer({ ...player, socials: { ...player.socials, [k]: v } })}
                placeholder={k === "twitter" || k === "instagram" ? "handle (no @)" : k === "website" ? "https://..." : "username / channel"}
              />
            </Field>
          ))}
        </Grid>
      </Section>

      <Section title="Current-season stats">
        <Grid>
          <Field label="Season">
            <Input value={stats.season} onChange={(v) => setStats({ ...stats, season: v })} placeholder="2026-S1" />
          </Field>
          <Field label="Matches">
            <Input value={stats.matches_played} onChange={(v) => setStats({ ...stats, matches_played: v })} type="number" />
          </Field>
          <Field label="Wins">
            <Input value={stats.wins} onChange={(v) => setStats({ ...stats, wins: v })} type="number" />
          </Field>
          <Field label="Losses">
            <Input value={stats.losses} onChange={(v) => setStats({ ...stats, losses: v })} type="number" />
          </Field>
          <Field label="K/D">
            <Input value={stats.k_d_ratio} onChange={(v) => setStats({ ...stats, k_d_ratio: v })} type="number" />
          </Field>
          <Field label="ACS">
            <Input value={stats.acs} onChange={(v) => setStats({ ...stats, acs: v })} type="number" />
          </Field>
          <Field label="ADR">
            <Input value={stats.adr} onChange={(v) => setStats({ ...stats, adr: v })} type="number" />
          </Field>
          <Field label="HS %">
            <Input value={stats.hs_pct} onChange={(v) => setStats({ ...stats, hs_pct: v })} type="number" />
          </Field>
        </Grid>
        <Field label="Source URL">
          <Input value={stats.source_url} onChange={(v) => setStats({ ...stats, source_url: v })} placeholder="https://vlr.gg/player/..." />
        </Field>
        <Field label="Game-specific stats (JSON)" hint="agent_pool / preferred_mode / character_usage. Use {} for empty.">
          <Textarea value={stats.game_stats_json} onChange={(v) => setStats({ ...stats, game_stats_json: v })} rows={5} mono />
        </Field>
        <Toggle label="Mark as current season" checked={stats.is_current} onChange={(v) => setStats({ ...stats, is_current: v })} />
      </Section>

      <Section title={`Gear (${gear.platform === "pc" ? "PC" : "Mobile"})`}>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setGear({ ...gear, platform: "pc" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              gear.platform === "pc"
                ? "bg-violet-500/15 text-violet-400 border-violet-500/30"
                : "bg-white/[0.03] text-white/40 border-white/10"
            }`}
          >
            PC
          </button>
          <button
            type="button"
            onClick={() => setGear({ ...gear, platform: "mobile" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              gear.platform === "mobile"
                ? "bg-violet-500/15 text-violet-400 border-violet-500/30"
                : "bg-white/[0.03] text-white/40 border-white/10"
            }`}
          >
            Mobile
          </button>
        </div>
        <Grid>
          <Field label="Device / build">
            <Input value={gear.device_model} onChange={(v) => setGear({ ...gear, device_model: v })} placeholder={gear.platform === "pc" ? "Custom build" : "iQOO 12"} />
          </Field>
          {gear.platform === "pc" && (
            <>
              <Field label="CPU"><Input value={gear.cpu} onChange={(v) => setGear({ ...gear, cpu: v })} /></Field>
              <Field label="GPU"><Input value={gear.gpu} onChange={(v) => setGear({ ...gear, gpu: v })} /></Field>
              <Field label="RAM"><Input value={gear.ram} onChange={(v) => setGear({ ...gear, ram: v })} /></Field>
              <Field label="Monitor"><Input value={gear.monitor} onChange={(v) => setGear({ ...gear, monitor: v })} /></Field>
              <Field label="Monitor Hz"><Input value={gear.monitor_hz} onChange={(v) => setGear({ ...gear, monitor_hz: v })} type="number" /></Field>
              <Field label="Mouse"><Input value={gear.mouse} onChange={(v) => setGear({ ...gear, mouse: v })} /></Field>
              <Field label="Keyboard"><Input value={gear.keyboard} onChange={(v) => setGear({ ...gear, keyboard: v })} /></Field>
              <Field label="Headphones"><Input value={gear.headphones} onChange={(v) => setGear({ ...gear, headphones: v })} /></Field>
              <Field label="Mousepad"><Input value={gear.mousepad} onChange={(v) => setGear({ ...gear, mousepad: v })} /></Field>
            </>
          )}
          {gear.platform === "mobile" && (
            <>
              <Field label="Grip style"><Input value={gear.grip_style} onChange={(v) => setGear({ ...gear, grip_style: v })} placeholder="claw / thumb / 4-finger" /></Field>
              <Field label="Controllers / triggers"><Input value={gear.controllers} onChange={(v) => setGear({ ...gear, controllers: v })} placeholder="GameSir F4 Falcon" /></Field>
              <Field label="Headphones"><Input value={gear.headphones} onChange={(v) => setGear({ ...gear, headphones: v })} /></Field>
              <Field label="Layout screenshot URL"><Input value={gear.layout_image_url} onChange={(v) => setGear({ ...gear, layout_image_url: v })} /></Field>
            </>
          )}
        </Grid>
        <Field label="Sensitivities (JSON)" hint='{"general":0.35,"ads":{"scoped":0.9},"edpi":280}'>
          <Textarea value={gear.sensitivities_json} onChange={(v) => setGear({ ...gear, sensitivities_json: v })} rows={4} mono />
        </Field>
        <Field label="In-game settings (JSON)" hint='{"crosshair_code":"0;P;...","graphics_preset":"low","fps_cap":300}'>
          <Textarea value={gear.ingame_settings_json} onChange={(v) => setGear({ ...gear, ingame_settings_json: v })} rows={4} mono />
        </Field>
        <Field label="Notes">
          <Textarea value={gear.notes} onChange={(v) => setGear({ ...gear, notes: v })} rows={2} />
        </Field>
        <Field label="Source URL">
          <Input value={gear.source_url} onChange={(v) => setGear({ ...gear, source_url: v })} placeholder="https://prosettings.net/..." />
        </Field>
      </Section>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/5">
        <Link
          href="/admin/pro"
          className="px-4 py-2.5 text-sm text-white/50 hover:text-white/80"
        >
          Cancel
        </Link>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create player"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <h3 className="text-sm font-semibold text-white/80">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>;
}

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <p className="text-[10px] text-white/30 mt-0.5">{hint}</p>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type || "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows || 3}
      className={`w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 ${
        mono ? "font-mono text-xs" : ""
      }`}
    />
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-white/20 bg-white/[0.03] text-violet-500 focus:ring-violet-500/50"
      />
      <span className="text-sm text-white/70">{label}</span>
    </label>
  );
}
