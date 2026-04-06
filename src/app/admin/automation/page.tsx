"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Bot,
  Play,
  Pause,
  UserPlus,
  FileText,
  ScrollText,
  Zap,
  Trash2,
  Pencil,
  Plus,
  Clock,
  ChevronDown,
  X,
  Search,
  Loader2,
  RefreshCw,
  User,
  Image,
  Shield,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Globe,
  Gamepad2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AutoSettings {
  automation_enabled: boolean;
  automation_posts_per_day: number;
  automation_comments_per_day: number;
  automation_active_hours_start: number;
  automation_active_hours_end: number;
  automation_min_gap_minutes: number;
  automation_weekend_boost: boolean;
}

interface Persona {
  id: string;
  profile_id: string;
  persona_style: string;
  preferred_games: string[];
  posting_style: string;
  bio_note: string | null;
  is_active: boolean;
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  gaming_style: string | null;
  region: string | null;
  is_verified: boolean;
  is_premium: boolean;
  status: string;
  email: string | null;
  total_actions: number;
  last_action_at: string | null;
}

interface Template {
  id: string;
  type: string;
  category: string;
  content: string;
  game_slug: string | null;
  mood: string;
  is_active: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
}

interface LogEntry {
  id: string;
  persona_id: string;
  template_id: string | null;
  action_type: string;
  target_id: string | null;
  target_table: string | null;
  content_used: string;
  persona_username: string;
  avatar_url: string | null;
  created_at: string;
}

interface TodayStats {
  total: number;
  posts: number;
  comments: number;
  likes: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview", icon: Bot },
  { id: "personas", label: "Personas", icon: UserPlus },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "logs", label: "Activity Log", icon: ScrollText },
] as const;

const PERSONA_STYLES = ["casual", "competitive", "meme", "chill", "tryhard"];
const POSTING_STYLES = ["mixed", "questions", "hot_takes", "lfg", "reactions"];
const TEMPLATE_TYPES = ["community_post", "comment", "lfg_post", "news_discussion"];
const TEMPLATE_CATEGORIES = ["hot_take", "question", "discussion", "daily", "reaction", "lfg", "hype", "tip", "general"];
const MOODS = ["neutral", "excited", "frustrated", "chill", "curious", "hyped"];
const GAMES = ["valorant", "bgmi", "freefire"];
const GAMING_STYLES = ["casual", "competitive", "semi-pro", "streamer", "content-creator"];
const REGIONS = ["India - North", "India - South", "India - East", "India - West", "Southeast Asia", "Middle East"];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

async function fetchWithCsrf(url: string, options: RequestInit = {}) {
  const csrfToken = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrf_token="))
    ?.split("=")[1];

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      ...((options.headers as Record<string, string>) || {}),
    },
  });
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminAutomationPage() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [settings, setSettings] = useState<AutoSettings | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats>({ total: 0, posts: 0, comments: 0, likes: 0 });
  const [logsTotal, setLogsTotal] = useState(0);
  const [lastActionAt, setLastActionAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  // ── Data Fetching ───────────────────────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const { settings: s } = await res.json();
      setSettings(s);
    }
  }, []);

  const fetchPersonas = useCallback(async () => {
    const res = await fetch("/api/admin/automation/personas");
    if (res.ok) {
      const { personas: p } = await res.json();
      setPersonas(p);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/admin/automation/templates");
    if (res.ok) {
      const { templates: t } = await res.json();
      setTemplates(t);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    const res = await fetch("/api/admin/automation/logs?limit=50");
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTodayStats(data.todayStats);
      setLogsTotal(data.total);
      setLastActionAt(data.lastActionAt || null);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchSettings(), fetchPersonas(), fetchTemplates(), fetchLogs()])
      .finally(() => setLoading(false));
  }, [fetchSettings, fetchPersonas, fetchTemplates, fetchLogs]);

  // ── Setting Update ──────────────────────────────────────────────────────────

  const updateSetting = async (key: keyof AutoSettings, value: unknown) => {
    const res = await fetchWithCsrf("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) {
      const { settings: s } = await res.json();
      setSettings(s);
      toast.success(`Updated ${key.replace("automation_", "").replace(/_/g, " ")}`);
    } else {
      toast.error("Failed to update setting");
    }
  };

  // ── Manual Trigger ──────────────────────────────────────────────────────────

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await fetchWithCsrf("/api/admin/automation/trigger", { method: "POST" });
      const result = await res.json();
      if (result.action === "skip") {
        toast.info(result.details);
      } else if (result.action === "error") {
        toast.error(result.details);
      } else {
        toast.success(result.details);
        fetchLogs();
      }
    } catch {
      toast.error("Trigger failed");
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-violet-400" />
            Community Automation
          </h2>
          <p className="text-sm text-white/40 mt-1">
            Auto-post content as configured personas with human-like timing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {triggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Trigger Now
          </button>
          {settings && (
            <button
              onClick={() => updateSetting("automation_enabled", !settings.automation_enabled)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                settings.automation_enabled
                  ? "bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30"
                  : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
              )}
            >
              {settings.automation_enabled ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {settings.automation_enabled ? "Enabled" : "Disabled"}
            </button>
          )}
        </div>
      </div>

      {/* Health Warning */}
      {settings?.automation_enabled && lastActionAt && (() => {
        const hoursSinceLast = (Date.now() - new Date(lastActionAt).getTime()) / 3600000;
        if (hoursSinceLast < 24) return null;
        return (
          <div className={cn(
            "rounded-xl border p-4 flex items-center gap-3",
            hoursSinceLast >= 48
              ? "bg-red-500/10 border-red-500/20"
              : "bg-yellow-500/10 border-yellow-500/20",
          )}>
            <span className={hoursSinceLast >= 48 ? "text-red-400" : "text-yellow-400"}>
              {hoursSinceLast >= 48 ? "!" : "?"}
            </span>
            <div>
              <p className={cn("text-sm font-medium", hoursSinceLast >= 48 ? "text-red-300" : "text-yellow-300")}>
                {hoursSinceLast >= 48 ? "Automation stalled" : "Low activity"}
              </p>
              <p className="text-xs text-white/40">
                Last automated action was {Math.floor(hoursSinceLast)}h ago.
                {hoursSinceLast >= 48 && " Check your cron job is running and CRON_SECRET is correct."}
              </p>
            </div>
          </div>
        );
      })()}

      {settings?.automation_enabled && !lastActionAt && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <p className="text-sm font-medium text-yellow-300">No actions recorded yet</p>
          <p className="text-xs text-white/40">
            Enable automation, set up a cron job, and use &quot;Trigger Now&quot; to test.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/[0.02] border border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center",
              activeTab === tab.id
                ? "bg-violet-500/20 text-violet-300 shadow-sm"
                : "text-white/40 hover:text-white/60 hover:bg-white/5",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && settings && (
        <OverviewTab
          settings={settings}
          updateSetting={updateSetting}
          todayStats={todayStats}
          personaCount={personas.filter((p) => p.is_active).length}
          templateCount={templates.filter((t) => t.is_active).length}
        />
      )}
      {activeTab === "personas" && (
        <PersonasTab personas={personas} onRefresh={fetchPersonas} />
      )}
      {activeTab === "templates" && (
        <TemplatesTab templates={templates} onRefresh={fetchTemplates} />
      )}
      {activeTab === "logs" && (
        <LogsTab logs={logs} total={logsTotal} todayStats={todayStats} onRefresh={fetchLogs} />
      )}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({
  settings,
  updateSetting,
  todayStats,
  personaCount,
  templateCount,
}: {
  settings: AutoSettings;
  updateSetting: (key: keyof AutoSettings, value: unknown) => void;
  todayStats: TodayStats;
  personaCount: number;
  templateCount: number;
}) {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Posts Today", value: todayStats.posts, target: settings.automation_posts_per_day, color: "violet" },
          { label: "Comments Today", value: todayStats.comments, target: settings.automation_comments_per_day, color: "blue" },
          { label: "Active Personas", value: personaCount, color: "green" },
          { label: "Active Templates", value: templateCount, color: "orange" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs text-white/40 mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-bold", `text-${stat.color}-400`)}>
              {stat.value}
              {"target" in stat && stat.target ? (
                <span className="text-sm text-white/30 font-normal">/{stat.target}</span>
              ) : null}
            </p>
          </div>
        ))}
      </div>

      {/* Configuration */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-5">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Posts per day */}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Posts per day</label>
            <input
              type="number"
              min={1}
              max={20}
              value={settings.automation_posts_per_day}
              onChange={(e) => updateSetting("automation_posts_per_day", parseInt(e.target.value) || 5)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Comments per day */}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Comments per day</label>
            <input
              type="number"
              min={0}
              max={20}
              value={settings.automation_comments_per_day}
              onChange={(e) => updateSetting("automation_comments_per_day", parseInt(e.target.value) || 4)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Active hours start */}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Active hours start (IST)</label>
            <input
              type="number"
              min={0}
              max={23}
              value={settings.automation_active_hours_start}
              onChange={(e) => updateSetting("automation_active_hours_start", parseInt(e.target.value) || 10)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-violet-500/50"
            />
            <p className="text-xs text-white/30 mt-1">24h format, e.g. 10 = 10 AM IST</p>
          </div>

          {/* Active hours end */}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Active hours end (IST)</label>
            <input
              type="number"
              min={0}
              max={23}
              value={settings.automation_active_hours_end}
              onChange={(e) => updateSetting("automation_active_hours_end", parseInt(e.target.value) || 23)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-violet-500/50"
            />
            <p className="text-xs text-white/30 mt-1">24h format, e.g. 23 = 11 PM IST</p>
          </div>

          {/* Min gap */}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Minimum gap between actions (minutes)</label>
            <input
              type="number"
              min={5}
              max={120}
              value={settings.automation_min_gap_minutes}
              onChange={(e) => updateSetting("automation_min_gap_minutes", parseInt(e.target.value) || 25)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Weekend boost */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div>
              <p className="text-sm text-white/70">Weekend boost</p>
              <p className="text-xs text-white/30">Post 40% more on weekends</p>
            </div>
            <button
              onClick={() => updateSetting("automation_weekend_boost", !settings.automation_weekend_boost)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative",
                settings.automation_weekend_boost ? "bg-violet-500" : "bg-white/10",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                  settings.automation_weekend_boost ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Setup guide */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
        <h3 className="text-sm font-semibold text-violet-300 mb-3">Setup Guide</h3>
        <ol className="space-y-2 text-sm text-white/50">
          <li className="flex gap-2">
            <span className="text-violet-400 font-mono">1.</span>
            Create user accounts that look like real gamers (Indian usernames, avatars, bios)
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-mono">2.</span>
            Go to <strong className="text-white/70">Personas</strong> tab and link those profiles
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-mono">3.</span>
            Go to <strong className="text-white/70">Templates</strong> tab and add post/comment content
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-mono">4.</span>
            Set <code className="text-violet-400 bg-violet-500/10 px-1 rounded">CRON_SECRET</code> in your env variables
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-mono">5.</span>
            Set up a cron job to hit <code className="text-violet-400 bg-violet-500/10 px-1 rounded">GET /api/cron/automation?secret=YOUR_SECRET</code> every 5 minutes
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 font-mono">6.</span>
            Enable automation above and monitor the <strong className="text-white/70">Activity Log</strong>
          </li>
        </ol>
      </div>
    </div>
  );
}

// ── Personas Tab ──────────────────────────────────────────────────────────────

function PersonasTab({ personas, onRefresh }: { personas: Persona[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState(false); // true = create new account, false = link existing
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    // Account fields (only for create mode)
    email: "",
    password: "",
    // Profile fields
    username: "",
    display_name: "",
    avatar_url: "",
    banner_url: "",
    bio: "",
    gaming_style: "",
    region: "",
    // Persona fields
    profile_id: "",
    persona_style: "casual",
    preferred_games: [] as string[],
    posting_style: "mixed",
    bio_note: "",
  });

  const resetForm = () => {
    setForm({
      email: "", password: "", username: "", display_name: "", avatar_url: "", banner_url: "",
      bio: "", gaming_style: "", region: "", profile_id: "", persona_style: "casual",
      preferred_games: [], posting_style: "mixed", bio_note: "",
    });
    setEditingId(null);
    setShowForm(false);
    setCreateMode(false);
    setShowPassword(false);
  };

  const handleSave = async () => {
    if (createMode && !editingId) {
      if (!form.username || !form.email || !form.password) {
        toast.error("Username, email, and password are required");
        return;
      }
      if (form.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
    } else if (!editingId && !form.profile_id) {
      toast.error("Enter a profile ID");
      return;
    }

    setSaving(true);
    try {
      const url = "/api/admin/automation/personas";

      if (editingId) {
        // Update existing persona + profile
        const res = await fetchWithCsrf(url, {
          method: "PATCH",
          body: JSON.stringify({
            id: editingId,
            username: form.username || undefined,
            display_name: form.display_name || undefined,
            avatar_url: form.avatar_url || undefined,
            banner_url: form.banner_url || undefined,
            bio: form.bio || undefined,
            gaming_style: form.gaming_style || undefined,
            region: form.region || undefined,
            persona_style: form.persona_style,
            preferred_games: form.preferred_games,
            posting_style: form.posting_style,
            bio_note: form.bio_note || undefined,
          }),
        });
        if (res.ok) {
          toast.success("Persona & profile updated");
          resetForm();
          onRefresh();
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to update");
        }
      } else if (createMode) {
        // Create new bot account
        const res = await fetchWithCsrf(url, {
          method: "POST",
          body: JSON.stringify({
            create_account: true,
            email: form.email,
            password: form.password,
            username: form.username,
            display_name: form.display_name || form.username,
            avatar_url: form.avatar_url || undefined,
            bio: form.bio || undefined,
            gaming_style: form.gaming_style || undefined,
            region: form.region || undefined,
            persona_style: form.persona_style,
            preferred_games: form.preferred_games,
            posting_style: form.posting_style,
            bio_note: form.bio_note || undefined,
          }),
        });
        if (res.ok) {
          toast.success("Bot account created & linked as persona");
          resetForm();
          onRefresh();
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to create account");
        }
      } else {
        // Link existing profile
        const res = await fetchWithCsrf(url, {
          method: "POST",
          body: JSON.stringify({
            profile_id: form.profile_id,
            persona_style: form.persona_style,
            preferred_games: form.preferred_games,
            posting_style: form.posting_style,
            bio_note: form.bio_note || undefined,
          }),
        });
        if (res.ok) {
          toast.success("Persona added");
          resetForm();
          onRefresh();
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to save");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetchWithCsrf("/api/admin/automation/personas", {
      method: "PATCH",
      body: JSON.stringify({ id, is_active: !isActive }),
    });
    onRefresh();
  };

  const handleDelete = async (id: string, deleteAccount: boolean) => {
    const msg = deleteAccount
      ? "DELETE FULL ACCOUNT? This will permanently remove the user account, profile, and all associated data. This cannot be undone!"
      : "Remove this persona link? The user account will remain.";
    if (!confirm(msg)) return;

    setDeletingId(id);
    try {
      const url = deleteAccount
        ? `/api/admin/automation/personas?id=${id}&delete_account=true`
        : `/api/admin/automation/personas?id=${id}`;
      const res = await fetchWithCsrf(url, { method: "DELETE" });
      if (res.ok) {
        toast.success(deleteAccount ? "Account fully deleted" : "Persona removed");
        setExpandedId(null);
        onRefresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (p: Persona) => {
    setForm({
      email: p.email || "",
      password: "",
      username: p.username || "",
      display_name: p.display_name || "",
      avatar_url: p.avatar_url || "",
      banner_url: p.banner_url || "",
      bio: p.bio || "",
      gaming_style: p.gaming_style || "",
      region: p.region || "",
      profile_id: p.profile_id,
      persona_style: p.persona_style,
      preferred_games: p.preferred_games || [],
      posting_style: p.posting_style,
      bio_note: p.bio_note || "",
    });
    setEditingId(p.id);
    setCreateMode(false);
    setShowForm(true);
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-violet-500/50 placeholder:text-white/20";
  const labelClass = "block text-sm text-white/50 mb-1.5";
  const selectClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-white/40">{personas.length} persona(s) configured</p>
        <div className="flex items-center gap-2">
          {!showForm && (
            <>
              <button
                onClick={() => { resetForm(); setCreateMode(true); setShowForm(true); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Create Bot Account
              </button>
              <button
                onClick={() => { resetForm(); setCreateMode(false); setShowForm(true); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-sm hover:bg-violet-500/30 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Link Existing
              </button>
            </>
          )}
          {showForm && (
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-sm hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-5">
          <h3 className="text-sm font-semibold text-violet-300 flex items-center gap-2">
            {editingId ? (
              <><Pencil className="h-4 w-4" /> Edit Persona & Profile</>
            ) : createMode ? (
              <><UserPlus className="h-4 w-4" /> Create New Bot Account</>
            ) : (
              <><Plus className="h-4 w-4" /> Link Existing Profile</>
            )}
          </h3>

          {/* Account Credentials (create mode only) */}
          {createMode && !editingId && (
            <div className="space-y-3 pb-4 border-b border-white/5">
              <p className="text-xs text-white/30 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Account Credentials
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="bot@example.com"
                      type="email"
                      className={cn(inputClass, "pl-9")}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min 6 characters"
                      type={showPassword ? "text" : "password"}
                      className={cn(inputClass, "pl-9 pr-9")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Link existing profile (non-create, non-edit mode) */}
          {!createMode && !editingId && (
            <div>
              <label className={labelClass}>Profile ID (UUID)</label>
              <input
                value={form.profile_id}
                onChange={(e) => setForm({ ...form, profile_id: e.target.value })}
                placeholder="Paste the user's profile UUID"
                className={inputClass}
              />
              <p className="text-xs text-white/30 mt-1">Find this in Admin &gt; Users, copy the user ID</p>
            </div>
          )}

          {/* Profile Fields (create mode + edit mode) */}
          {(createMode || editingId) && (
            <div className="space-y-3 pb-4 border-b border-white/5">
              <p className="text-xs text-white/30 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Profile Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Username</label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="e.g. clutch_king_69"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Display Name</label>
                  <input
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    placeholder="e.g. Clutch King"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Avatar URL</label>
                <div className="flex gap-3 items-start">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                    {form.avatar_url ? (
                      <img src={form.avatar_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <Image className="h-5 w-5 text-white/20" />
                    )}
                  </div>
                  <input
                    value={form.avatar_url}
                    onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    className={cn(inputClass, "flex-1")}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Banner URL (optional)</label>
                <input
                  value={form.banner_url}
                  onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="e.g. Valorant addict | Jett main | Always headshots, sometimes teammates"
                  rows={2}
                  className={cn(inputClass, "resize-none")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Gaming Style</label>
                  <select
                    value={form.gaming_style}
                    onChange={(e) => setForm({ ...form, gaming_style: e.target.value })}
                    className={selectClass}
                  >
                    <option value="" className="bg-[#0a0a12]">Not set</option>
                    {GAMING_STYLES.map((s) => (
                      <option key={s} value={s} className="bg-[#0a0a12]">{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Region</label>
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className={selectClass}
                  >
                    <option value="" className="bg-[#0a0a12]">Not set</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r} className="bg-[#0a0a12]">{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Persona / Automation Settings */}
          <div className="space-y-3">
            <p className="text-xs text-white/30 flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" /> Automation Settings
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Personality Style</label>
                <select
                  value={form.persona_style}
                  onChange={(e) => setForm({ ...form, persona_style: e.target.value })}
                  className={selectClass}
                >
                  {PERSONA_STYLES.map((s) => (
                    <option key={s} value={s} className="bg-[#0a0a12]">{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Posting Style</label>
                <select
                  value={form.posting_style}
                  onChange={(e) => setForm({ ...form, posting_style: e.target.value })}
                  className={selectClass}
                >
                  {POSTING_STYLES.map((s) => (
                    <option key={s} value={s} className="bg-[#0a0a12]">{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Preferred Games</label>
              <div className="flex flex-wrap gap-2">
                {GAMES.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      const games = form.preferred_games.includes(g)
                        ? form.preferred_games.filter((x) => x !== g)
                        : [...form.preferred_games, g];
                      setForm({ ...form, preferred_games: games });
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                      form.preferred_games.includes(g)
                        ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white/60",
                    )}
                  >
                    {g === "bgmi" ? "BGMI" : g === "freefire" ? "Free Fire" : "Valorant"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Internal Note (optional)</label>
              <input
                value={form.bio_note}
                onChange={(e) => setForm({ ...form, bio_note: e.target.value })}
                placeholder="e.g. 'My alt account - Valorant main'"
                className={inputClass}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingId ? "Update Persona & Profile" : createMode ? "Create Bot Account" : "Add Persona"}
          </button>
        </div>
      )}

      {/* Persona List */}
      <div className="space-y-3">
        {personas.map((p) => (
          <div key={p.id} className={cn("rounded-xl border bg-white/[0.02] overflow-hidden transition-all", p.is_active ? "border-white/5" : "border-white/5 opacity-60")}>
            {/* Main Row */}
            <div className="p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white/50 text-sm font-bold">{(p.username || "?")[0].toUpperCase()}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">@{p.username}</span>
                  {p.display_name && p.display_name !== p.username && (
                    <span className="text-xs text-white/30">({p.display_name})</span>
                  )}
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    {p.persona_style}
                  </span>
                  {p.is_verified && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">verified</span>
                  )}
                  {!p.is_active && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">paused</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-white/30">{p.preferred_games?.join(", ") || "all games"}</span>
                  <span className="text-xs text-white/20">|</span>
                  <span className="text-xs text-white/30">{p.total_actions} actions</span>
                  {p.last_action_at && (
                    <>
                      <span className="text-xs text-white/20">|</span>
                      <span className="text-xs text-white/30">last: {timeAgo(p.last_action_at)}</span>
                    </>
                  )}
                </div>
                {p.bio_note && <p className="text-xs text-white/20 mt-0.5 italic">{p.bio_note}</p>}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggle(p.id, p.is_active)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    p.is_active ? "text-green-400 hover:bg-green-500/10" : "text-white/30 hover:bg-white/5",
                  )}
                  title={p.is_active ? "Pause" : "Activate"}
                >
                  {p.is_active ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleEdit(p)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                  title="Edit profile & persona"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    expandedId === p.id ? "text-violet-400 bg-violet-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5",
                  )}
                  title="View details"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", expandedId === p.id && "rotate-180")} />
                </button>
              </div>
            </div>

            {/* Expanded Profile Details */}
            {expandedId === p.id && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-white/30 uppercase tracking-wider">Email</span>
                    <p className="text-sm text-white/60">{p.email || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-white/30 uppercase tracking-wider">Profile ID</span>
                    <p className="text-sm text-white/40 font-mono text-[11px] break-all">{p.profile_id}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-white/30 uppercase tracking-wider">Gaming Style</span>
                    <p className="text-sm text-white/60">{p.gaming_style || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-white/30 uppercase tracking-wider">Region</span>
                    <p className="text-sm text-white/60">{p.region || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-white/30 uppercase tracking-wider">Status</span>
                    <p className="text-sm text-white/60">{p.status || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-white/30 uppercase tracking-wider">Posting Style</span>
                    <p className="text-sm text-white/60">{p.posting_style}</p>
                  </div>
                </div>

                {p.bio && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-white/30 uppercase tracking-wider">Bio</span>
                    <p className="text-sm text-white/50">{p.bio}</p>
                  </div>
                )}

                {/* Avatar & Banner preview */}
                <div className="flex gap-3 flex-wrap">
                  {p.avatar_url && (
                    <div className="space-y-1">
                      <span className="text-[11px] text-white/30 uppercase tracking-wider">Avatar</span>
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                        <img src={p.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  {p.banner_url && (
                    <div className="space-y-1">
                      <span className="text-[11px] text-white/30 uppercase tracking-wider">Banner</span>
                      <div className="w-32 h-16 rounded-lg overflow-hidden border border-white/10">
                        <img src={p.banner_url} alt="banner" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleEdit(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-300 text-xs hover:bg-violet-500/20 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit Profile & Persona
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, false)}
                    disabled={deletingId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 hover:text-white/60 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Unlink Persona
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, true)}
                    disabled={deletingId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors ml-auto"
                  >
                    {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                    Delete Full Account
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {personas.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm">
            No personas configured yet. Create a bot account or link an existing profile to get started.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Templates Tab ─────────────────────────────────────────────────────────────

function TemplatesTab({ templates, onRefresh }: { templates: Template[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    type: "community_post",
    category: "general",
    content: "",
    game_slug: "",
    mood: "neutral",
  });

  const resetForm = () => {
    setForm({ type: "community_post", category: "general", content: "", game_slug: "", mood: "neutral" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.content.trim()) {
      toast.error("Content is required");
      return;
    }

    const url = "/api/admin/automation/templates";
    const method = editingId ? "PATCH" : "POST";
    const body = editingId
      ? { id: editingId, ...form, game_slug: form.game_slug || null }
      : { ...form, game_slug: form.game_slug || null };

    const res = await fetchWithCsrf(url, { method, body: JSON.stringify(body) });
    if (res.ok) {
      toast.success(editingId ? "Template updated" : "Template created");
      resetForm();
      onRefresh();
    } else {
      toast.error("Failed to save template");
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetchWithCsrf("/api/admin/automation/templates", {
      method: "PATCH",
      body: JSON.stringify({ id, is_active: !isActive }),
    });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await fetchWithCsrf(`/api/admin/automation/templates?id=${id}`, { method: "DELETE" });
    toast.success("Template deleted");
    onRefresh();
  };

  const handleEdit = (t: Template) => {
    setForm({
      type: t.type,
      category: t.category,
      content: t.content,
      game_slug: t.game_slug || "",
      mood: t.mood,
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const filtered = templates.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (searchQuery && !t.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
          >
            <option value="all" className="bg-[#0a0a12]">All types</option>
            {TEMPLATE_TYPES.map((t) => (
              <option key={t} value={t} className="bg-[#0a0a12]">{t.replace(/_/g, " ")}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-white text-sm outline-none w-48 focus:border-violet-500/50"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/30">{filtered.length} templates</span>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-sm hover:bg-violet-500/30 transition-colors"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add Template"}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-violet-300">
            {editingId ? "Edit Template" : "New Template"}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
              >
                {TEMPLATE_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#0a0a12]">{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
              >
                {TEMPLATE_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#0a0a12]">{c.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Game (optional)</label>
              <select
                value={form.game_slug}
                onChange={(e) => setForm({ ...form, game_slug: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
              >
                <option value="" className="bg-[#0a0a12]">Any game</option>
                {GAMES.map((g) => (
                  <option key={g} value={g} className="bg-[#0a0a12]">{g === "bgmi" ? "BGMI" : g === "freefire" ? "Free Fire" : "Valorant"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Mood</label>
              <select
                value={form.mood}
                onChange={(e) => setForm({ ...form, mood: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
              >
                {MOODS.map((m) => (
                  <option key={m} value={m} className="bg-[#0a0a12]">{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1">
              Content <span className="text-white/20">(supports {"{game}"}, {"{agent}"}, {"{rank}"}, {"{map}"} placeholders)</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="e.g. anyone else feel like {agent} is lowkey broken on {map}? 😭"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors"
          >
            {editingId ? "Update" : "Create"} Template
          </button>
        </div>
      )}

      {/* Template List */}
      <div className="space-y-2">
        {filtered.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-xl border bg-white/[0.02] p-4",
              t.is_active ? "border-white/5" : "border-white/5 opacity-50",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {t.type.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {t.category}
                  </span>
                  {t.game_slug && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                      {t.game_slug}
                    </span>
                  )}
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/10">
                    {t.mood}
                  </span>
                </div>
                <p className="text-sm text-white/70 whitespace-pre-wrap">{t.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-white/20">
                  <span>Used {t.use_count}x</span>
                  {t.last_used_at && <span>Last: {timeAgo(t.last_used_at)}</span>}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggle(t.id, t.is_active)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    t.is_active ? "text-green-400 hover:bg-green-500/10" : "text-white/30 hover:bg-white/5",
                  )}
                >
                  {t.is_active ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleEdit(t)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm">
            {templates.length === 0
              ? "No templates yet. Add post and comment templates to get started."
              : "No templates match your filter."}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Logs Tab ──────────────────────────────────────────────────────────────────

function LogsTab({
  logs,
  total,
  todayStats,
  onRefresh,
}: {
  logs: LogEntry[];
  total: number;
  todayStats: TodayStats;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-white/40">{total} total actions</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-violet-400">Today: {todayStats.posts} posts</span>
            <span className="text-white/20">|</span>
            <span className="text-blue-400">{todayStats.comments} comments</span>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-sm hover:text-white/60 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              {log.avatar_url ? (
                <img src={log.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Bot className="h-4 w-4 text-white/30" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-white">@{log.persona_username}</span>
                <span className={cn(
                  "text-[11px] px-1.5 py-0.5 rounded border",
                  log.action_type === "post"
                    ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                    : log.action_type === "comment"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-green-500/10 text-green-400 border-green-500/20",
                )}>
                  {log.action_type}
                </span>
                <span className="text-xs text-white/20 ml-auto flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(log.created_at)}
                </span>
              </div>
              <p className="text-sm text-white/50 break-words">{log.content_used}</p>
              {log.target_table && (
                <p className="text-xs text-white/20 mt-1">
                  → {log.target_table} ({log.target_id?.slice(0, 8)}...)
                </p>
              )}
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm">
            No automation activity yet. Enable automation and trigger it to see logs here.
          </div>
        )}
      </div>
    </div>
  );
}
