"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Trophy,
  ExternalLink,
  Loader2,
  Star,
  Eye,
  EyeOff,
  Calendar,
} from "lucide-react";
import { csrfHeaders } from "@/lib/hooks/useCsrfToken";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AdminTab = "players" | "teams" | "events";

interface PlayerRow {
  id: string;
  slug: string;
  game: string;
  ign: string;
  real_name: string | null;
  role: string | null;
  region: string | null;
  national_rank: number | null;
  is_active: boolean;
  is_featured: boolean;
  team: { id: string; name: string; short_name: string | null } | null;
  updated_at: string;
}

interface TeamRow {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  game: string;
  region: string;
  is_active: boolean;
  founded_year: number | null;
  updated_at: string;
}

interface EventRow {
  id: string;
  slug: string;
  game: string;
  name: string;
  short_name: string | null;
  status: "upcoming" | "live" | "completed" | "cancelled";
  starts_at: string;
  ends_at: string | null;
  region: string;
  is_featured: boolean;
}

const GAME_OPTIONS: { value: "all" | "valorant" | "bgmi" | "freefire"; label: string }[] = [
  { value: "all", label: "All games" },
  { value: "valorant", label: "Valorant" },
  { value: "bgmi", label: "BGMI" },
  { value: "freefire", label: "Free Fire" },
];

const GAME_TAG: Record<string, string> = {
  valorant: "bg-red-500/10 text-red-400 border-red-500/20",
  bgmi: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  freefire: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function AdminProHubPage() {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("players");
  const [game, setGame] = useState<"all" | "valorant" | "bgmi" | "freefire">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (game !== "all") params.set("game", game);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const res = await fetch(`/api/admin/pro/players?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPlayers(data.players || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load players");
    } finally {
      setLoading(false);
    }
  }, [game, debouncedSearch]);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (game !== "all") params.set("game", game);
      const res = await fetch(`/api/admin/pro/teams?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setTeams(data.teams || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, [game]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (game !== "all") params.set("game", game);
      const res = await fetch(`/api/admin/pro/events?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setEvents(data.events || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [game]);

  useEffect(() => {
    if (tab === "players") loadPlayers();
    else if (tab === "teams") loadTeams();
    else loadEvents();
  }, [tab, loadPlayers, loadTeams, loadEvents]);

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.short_name?.toLowerCase().includes(q) ?? false)
    );
  }, [teams, search]);

  const handleDeletePlayer = async (p: PlayerRow) => {
    try {
      const res = await fetch(`/api/admin/pro/players?id=${p.id}`, {
        method: "DELETE",
        headers: csrfHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${p.ign} deleted`);
      loadPlayers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const togglePlayerField = async (p: PlayerRow, field: "is_active" | "is_featured") => {
    try {
      const res = await fetch("/api/admin/pro/players", {
        method: "PATCH",
        headers: csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id: p.id, [field]: !p[field] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Updated");
      loadPlayers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleDeleteTeam = async (t: TeamRow) => {
    try {
      const res = await fetch(`/api/admin/pro/teams?id=${t.id}`, {
        method: "DELETE",
        headers: csrfHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${t.name} deleted`);
      loadTeams();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleDeleteEvent = async (ev: EventRow) => {
    try {
      const res = await fetch(`/api/admin/pro/events?id=${ev.id}`, {
        method: "DELETE",
        headers: csrfHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${ev.name} deleted`);
      loadEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Pro Hub</h2>
          <p className="text-xs text-white/40">
            Manage Indian pro players, teams, stats and gear for /pro
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "players" && (
            <Link
              href="/admin/pro/players/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Player
            </Link>
          )}
          {tab === "teams" && (
            <Link
              href="/admin/pro/teams/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Team
            </Link>
          )}
          {tab === "events" && (
            <Link
              href="/admin/pro/events/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Event
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-white/10">
        <button
          onClick={() => setTab("players")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            tab === "players"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-white/40 hover:text-white/60"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Players
          </span>
        </button>
        <button
          onClick={() => setTab("teams")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            tab === "teams"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-white/40 hover:text-white/60"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5" />
            Teams
          </span>
        </button>
        <button
          onClick={() => setTab("events")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            tab === "events"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-white/40 hover:text-white/60"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Events
          </span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder={tab === "players" ? "Search by IGN..." : "Search teams..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <Select value={game} onValueChange={(v) => setGame(v as typeof game)}>
          <SelectTrigger className="w-[160px] bg-white/[0.03] border-white/10 text-sm text-white focus:ring-violet-500/50 focus:ring-offset-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GAME_OPTIONS.map((g) => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="px-4 py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto" />
          </div>
        ) : tab === "players" ? (
          <PlayersTable
            players={players}
            onDelete={handleDeletePlayer}
            onToggle={togglePlayerField}
            onEdit={(p) => router.push(`/admin/pro/players/${p.id}`)}
          />
        ) : tab === "teams" ? (
          <TeamsTable
            teams={filteredTeams}
            onDelete={handleDeleteTeam}
            onEdit={(t) => router.push(`/admin/pro/teams/${t.id}`)}
          />
        ) : (
          <EventsTable
            events={events.filter((e) => {
              const q = search.trim().toLowerCase();
              return !q || e.name.toLowerCase().includes(q) || (e.short_name?.toLowerCase().includes(q) ?? false);
            })}
            onDelete={handleDeleteEvent}
            onEdit={(ev) => router.push(`/admin/pro/events/${ev.id}`)}
          />
        )}
      </div>
    </div>
  );
}

function PlayersTable({
  players,
  onDelete,
  onToggle,
  onEdit,
}: {
  players: PlayerRow[];
  onDelete: (p: PlayerRow) => void;
  onToggle: (p: PlayerRow, f: "is_active" | "is_featured") => void;
  onEdit: (p: PlayerRow) => void;
}) {
  if (players.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-white/30 text-sm">
        No players yet. Click &quot;New Player&quot; to add one.
      </div>
    );
  }
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/5 bg-white/[0.02]">
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider w-12">#</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Player</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Game</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">Team</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden lg:table-cell">Role</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody>
        {players.map((p) => (
          <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
            <td className="px-4 py-3 text-sm text-white/50">{p.national_rank ?? "—"}</td>
            <td className="px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white flex items-center gap-1.5">
                  {p.ign}
                  {p.is_featured && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
                  {!p.is_active && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      Hidden
                    </span>
                  )}
                </p>
                {p.real_name && <p className="text-xs text-white/40">{p.real_name}</p>}
              </div>
            </td>
            <td className="px-4 py-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${GAME_TAG[p.game] || ""}`}>
                {p.game}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-white/50 hidden md:table-cell">
              {p.team?.name || <span className="text-white/30">Free agent</span>}
            </td>
            <td className="px-4 py-3 text-sm text-white/50 hidden lg:table-cell">{p.role || "—"}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <Link
                  href={`/pro/${p.game}/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  title="View public page"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => onEdit(p)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onToggle(p, "is_featured")}
                  className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
                    p.is_featured ? "text-yellow-400" : "text-white/30 hover:text-white/50"
                  }`}
                  title={p.is_featured ? "Unfeature" : "Feature"}
                >
                  <Star className={`h-3.5 w-3.5 ${p.is_featured ? "fill-yellow-400" : ""}`} />
                </button>
                <button
                  onClick={() => onToggle(p, "is_active")}
                  className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
                    p.is_active ? "text-green-400" : "text-red-400"
                  }`}
                  title={p.is_active ? "Hide from public" : "Show on public site"}
                >
                  {p.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {p.ign}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the player profile, stats, and gear. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(p)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EventsTable({
  events,
  onDelete,
  onEdit,
}: {
  events: EventRow[];
  onDelete: (ev: EventRow) => void;
  onEdit: (ev: EventRow) => void;
}) {
  if (events.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-white/30 text-sm">
        No events yet. Click &quot;New Event&quot; to add one.
      </div>
    );
  }
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/5 bg-white/[0.02]">
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Event</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Game</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">Dates</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody>
        {events.map((ev) => (
          <tr key={ev.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
            <td className="px-4 py-3">
              <p className="text-sm font-medium text-white flex items-center gap-1.5">
                {ev.name}
                {ev.is_featured && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
              </p>
              <p className="text-xs text-white/40">/{ev.slug}</p>
            </td>
            <td className="px-4 py-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${GAME_TAG[ev.game] || ""}`}>
                {ev.game}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                ev.status === "live" ? "bg-red-500/10 text-red-400 border-red-500/30" :
                ev.status === "upcoming" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                ev.status === "completed" ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" :
                "bg-zinc-700/20 text-zinc-500 border-zinc-700/30"
              }`}>
                {ev.status}
              </span>
            </td>
            <td className="px-4 py-3 text-xs text-white/50 hidden md:table-cell">
              {fmt(ev.starts_at)}{ev.ends_at ? ` → ${fmt(ev.ends_at)}` : ""}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(ev)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {ev.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove the event from /pro/events.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(ev)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TeamsTable({
  teams,
  onDelete,
  onEdit,
}: {
  teams: TeamRow[];
  onDelete: (t: TeamRow) => void;
  onEdit: (t: TeamRow) => void;
}) {
  if (teams.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-white/30 text-sm">
        No teams yet. Click &quot;New Team&quot; to add one.
      </div>
    );
  }
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/5 bg-white/[0.02]">
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Team</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Game</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">Region</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody>
        {teams.map((t) => (
          <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
            <td className="px-4 py-3">
              <p className="text-sm font-medium text-white flex items-center gap-1.5">
                {t.name}
                {t.short_name && <span className="text-white/40 text-xs">[{t.short_name}]</span>}
                {!t.is_active && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    Hidden
                  </span>
                )}
              </p>
              <p className="text-xs text-white/40">/{t.slug}</p>
            </td>
            <td className="px-4 py-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${GAME_TAG[t.game] || ""}`}>
                {t.game}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-white/50 hidden md:table-cell">{t.region}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(t)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {t.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Players still assigned to this team will be left team-less (their team_id will be cleared).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(t)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
