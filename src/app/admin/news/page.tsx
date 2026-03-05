"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Star,
  Pin,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Gamepad2,
  Pencil,
  Globe,
  ChevronDown,
  Rss,
  Save,
  Power,
  PowerOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  useAdminNewsArticles,
  useAdminNewsAction,
  useAdminNewsDelete,
  useAdminNewsFetch,
} from "@/lib/hooks/useAdminNews";
import type { GameSlug, NewsStatus, NewsCategory, NewsRegion } from "@/types/news";
import { NEWS_CATEGORIES, NEWS_REGIONS } from "@/types/news";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  approved: { label: "Approved", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  published: { label: "Published", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  rejected: { label: "Rejected", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const GAME_STYLES: Record<string, { label: string; className: string }> = {
  valorant: { label: "Valorant", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  bgmi: { label: "BGMI", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  freefire: { label: "Free Fire", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
};

type NewsTab = "manual" | "fetched" | "sources";

interface NewsSource {
  id: string;
  name: string;
  url: string;
  slug: string;
  region: string;
  is_active: boolean;
  last_fetched_at: string | null;
  created_at: string;
}

const MANUAL_NEWS_SOURCES = {
  bgmi: [
    { name: "Sportskeeda BGMI", url: "https://www.sportskeeda.com/bgmi/news" },
    { name: "TalkEsport", url: "https://www.talkesport.com/category/news/esports/" },
    { name: "AFK Gaming", url: "https://afkgaming.com/indian-esports" },
    { name: "InsideSport BGMI", url: "https://www.insidesport.in/bgmi/" },
    { name: "KRAFTON Esports (Official)", url: "https://esports.battlegroundsmobileindia.com/" },
    { name: "BGMI Esports", url: "https://bgmiesports.in/" },
    { name: "India Esports", url: "https://indiaesports.co.in/" },
  ],
  valorant: [
    { name: "Sportskeeda Valorant India", url: "https://www.sportskeeda.com/esports/valorant-india" },
    { name: "VLR.gg", url: "https://www.vlr.gg/news" },
    { name: "TalkEsport", url: "https://www.talkesport.com/category/news/esports/" },
    { name: "AFK Gaming", url: "https://afkgaming.com/indian-esports" },
    { name: "Valorant Esports (Official)", url: "https://valorantesports.com/" },
    { name: "Liquipedia Valorant", url: "https://liquipedia.net/valorant/" },
  ],
  freefire: [
    { name: "Sportskeeda Free Fire", url: "https://www.sportskeeda.com/free-fire" },
    { name: "TalkEsport", url: "https://www.talkesport.com/category/news/esports/" },
    { name: "India Today Gaming", url: "https://www.indiatodaygaming.com/" },
    { name: "Outlook Respawn", url: "https://respawn.outlookindia.com/esports/esports-news" },
    { name: "Liquipedia Free Fire", url: "https://liquipedia.net/freefire/" },
  ],
  general: [
    { name: "16score Esports", url: "https://www.16score.com/esports/" },
    { name: "EG Esports India", url: "https://www.egesports.in/" },
    { name: "The Bridge", url: "https://thebridge.in/" },
    { name: "Esports Insider", url: "https://esportsinsider.com/" },
  ],
} as const;

const GAME_TAG_COLORS: Record<string, string> = {
  bgmi: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  valorant: "bg-red-500/10 text-red-400 border-red-500/20",
  freefire: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  general: "bg-white/5 text-white/50 border-white/10",
};

export default function AdminNewsPage() {
  const [activeTab, setActiveTab] = useState<NewsTab>("manual");
  const [showManualSources, setShowManualSources] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<NewsStatus | "">("");
  const [gameFilter, setGameFilter] = useState<GameSlug | "">("");
  const [categoryFilter, setCategoryFilter] = useState<NewsCategory | "">("");
  const [regionFilter, setRegionFilter] = useState<NewsRegion | "">("");
  const [page, setPage] = useState(1);

  // RSS Sources state
  const [rssSources, setRssSources] = useState<NewsSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [editingSource, setEditingSource] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editName, setEditName] = useState("");
  const [savingSource, setSavingSource] = useState<string | null>(null);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceRegion, setNewSourceRegion] = useState("india");
  const [addingSource, setAddingSource] = useState(false);

  const { articles, total, totalPages, loading, refetch } = useAdminNewsArticles({
    search: debouncedSearch,
    status: statusFilter || undefined,
    game: gameFilter || undefined,
    category: categoryFilter || undefined,
    region: regionFilter || undefined,
    type: activeTab,
    page,
  });

  const router = useRouter();
  const { updateArticle } = useAdminNewsAction();
  const { deleteArticle } = useAdminNewsDelete();
  const { fetchNews, isFetching } = useAdminNewsFetch();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleTabChange = (tab: NewsTab) => {
    setActiveTab(tab);
    if (tab !== "sources") {
      setSearch("");
      setDebouncedSearch("");
      setStatusFilter("");
      setGameFilter("");
      setCategoryFilter("");
      setRegionFilter("");
      setPage(1);
    }
  };

  const handleAction = async (
    id: string,
    updates: Record<string, unknown>,
    successMsg: string
  ) => {
    try {
      await updateArticle({ id, updates });
      toast.success(successMsg);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteArticle(id);
      toast.success("Article deleted");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleFetchNews = async () => {
    try {
      const result = await fetchNews();
      const removedMsg = result.totalRemoved ? ` ${result.totalRemoved} old articles removed.` : "";
      toast.success(
        `Fetched from ${result.sourcesProcessed} sources. ${result.totalNew} new articles found.${removedMsg}`
      );
      if (result.errors?.length) {
        result.errors.forEach((e) => toast.error(e));
      }
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fetch failed");
    }
  };

  // Fetch RSS sources when sources tab is active
  useEffect(() => {
    if (activeTab === "sources") {
      loadSources();
    }
  }, [activeTab]);

  const loadSources = async () => {
    setSourcesLoading(true);
    try {
      const res = await fetch("/api/admin/news/sources");
      const data = await res.json();
      if (res.ok) setRssSources(data.sources || []);
      else toast.error(data.error || "Failed to load sources");
    } catch {
      toast.error("Failed to load sources");
    } finally {
      setSourcesLoading(false);
    }
  };

  const handleSaveSource = async (id: string) => {
    setSavingSource(id);
    try {
      const res = await fetch("/api/admin/news/sources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, url: editUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Source updated");
      setEditingSource(null);
      loadSources();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSavingSource(null);
    }
  };

  const handleToggleSource = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/admin/news/sources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isActive ? "Source disabled" : "Source enabled");
      loadSources();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/news/sources?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Source deleted");
      loadSources();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleAddSource = async () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) {
      toast.error("Name and URL are required");
      return;
    }
    setAddingSource(true);
    try {
      const res = await fetch("/api/admin/news/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSourceName, url: newSourceUrl, region: newSourceRegion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Source added");
      setShowAddSource(false);
      setNewSourceName("");
      setNewSourceUrl("");
      setNewSourceRegion("india");
      loadSources();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add source");
    } finally {
      setAddingSource(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top bar: Title + Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">News Articles</h2>
          <p className="text-xs text-white/40">Manage fetched & manually posted news</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "fetched" && (
            <button
              onClick={handleFetchNews}
              disabled={isFetching}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isFetching ? "Fetching..." : "Fetch Latest News"}
            </button>
          )}
          {activeTab === "manual" && (
            <Link
              href="/admin/news/post"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Post News
            </Link>
          )}
          {activeTab === "sources" && (
            <button
              onClick={() => setShowAddSource(!showAddSource)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Source
            </button>
          )}
        </div>
      </div>

      {/* Tabs: Our News / Fetched News */}
      <div className="flex gap-1 border-b border-white/10">
        <button
          onClick={() => handleTabChange("manual")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "manual"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-white/40 hover:text-white/60"
          }`}
        >
          Our News
        </button>
        <button
          onClick={() => handleTabChange("fetched")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "fetched"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-white/40 hover:text-white/60"
          }`}
        >
          Fetched News
        </button>
        <button
          onClick={() => handleTabChange("sources")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "sources"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-white/40 hover:text-white/60"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Rss className="h-3.5 w-3.5" />
            RSS Sources
          </span>
        </button>
      </div>

      {/* RSS Sources Tab */}
      {activeTab === "sources" && (
        <div className="space-y-4">
          {/* Add new source form */}
          {showAddSource && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
              <p className="text-sm font-medium text-amber-400">Add New RSS Source</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Source name (e.g. TalkEsport)"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  className="px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                />
                <input
                  type="url"
                  placeholder="RSS Feed URL"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  className="px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                />
                <div className="flex gap-2">
                  <Select value={newSourceRegion} onValueChange={setNewSourceRegion}>
                    <SelectTrigger className="flex-1 bg-white/[0.03] border-white/10 text-sm text-white focus:ring-amber-500/50 focus:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="india">India</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="asia">Asia</SelectItem>
                      <SelectItem value="sea">SEA</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    onClick={handleAddSource}
                    disabled={addingSource}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {addingSource ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sources list */}
          {sourcesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
            </div>
          ) : rssSources.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-white/30 text-sm">
                No RSS sources configured. Add one to start auto-fetching news.
              </p>
              <button
                onClick={async () => {
                  setSourcesLoading(true);
                  try {
                    const res = await fetch("/api/admin/news/sources/seed", { method: "POST" });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    toast.success(`Added ${data.added} default RSS sources!`);
                    loadSources();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to seed sources");
                    setSourcesLoading(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg transition-colors"
              >
                <Rss className="h-4 w-4" />
                Load Default Sources (Sportskeeda, Reddit, Google News, etc.)
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {rssSources.map((source) => (
                <div
                  key={source.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    source.is_active
                      ? "border-white/10 bg-white/[0.02]"
                      : "border-white/5 bg-white/[0.01] opacity-60"
                  }`}
                >
                  {editingSource === source.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Source name"
                          className="px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                        />
                        <input
                          type="url"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          placeholder="RSS Feed URL"
                          className="px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveSource(source.id)}
                          disabled={savingSource === source.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {savingSource === source.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSource(null)}
                          className="px-3 py-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Rss className={`h-3.5 w-3.5 flex-shrink-0 ${source.is_active ? "text-amber-400" : "text-white/20"}`} />
                          <p className="text-sm font-medium text-white truncate">{source.name}</p>
                          {!source.is_active && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                              Disabled
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/10 uppercase">
                            {source.region}
                          </span>
                        </div>
                        <p className="text-xs text-white/30 mt-1 truncate">{source.url}</p>
                        {source.last_fetched_at && (
                          <p className="text-[10px] text-white/20 mt-1">
                            Last fetched: {formatDate(source.last_fetched_at)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingSource(source.id);
                            setEditName(source.name);
                            setEditUrl(source.url);
                          }}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                          title="Edit source"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleSource(source.id, source.is_active)}
                          className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
                            source.is_active ? "text-green-400 hover:text-green-300" : "text-white/30 hover:text-white/50"
                          }`}
                          title={source.is_active ? "Disable source" : "Enable source"}
                        >
                          {source.is_active ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                              title="Delete source"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this source?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;{source.name}&quot; RSS source. Articles already fetched from this source will not be affected.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSource(source.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Manual News Sources - Browse Links */}
          <div className="rounded-xl border border-white/5 overflow-hidden mt-6">
            <button
              onClick={() => setShowManualSources(!showManualSources)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-medium text-white/70">Browse News Manually</span>
                <span className="text-[10px] text-white/30 ml-1">India Esports Sources</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-white/30 transition-transform ${showManualSources ? "rotate-180" : ""}`} />
            </button>
            {showManualSources && (
              <div className="px-4 py-4 space-y-4 border-t border-white/5">
                {Object.entries(MANUAL_NEWS_SOURCES).map(([game, sources]) => (
                  <div key={game}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border mb-2 ${GAME_TAG_COLORS[game]}`}>
                      {game === "general" ? "General Esports" : game === "bgmi" ? "BGMI" : game === "freefire" ? "Free Fire" : "Valorant"}
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {sources.map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-xs text-white/60 hover:text-white transition-colors"
                        >
                          {source.name}
                          <ExternalLink className="h-3 w-3 opacity-40" />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-white/20 pt-1">
                  Use these when RSS auto-fetch fails. Visit the site, copy the news, and post manually.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Articles content (manual/fetched tabs only) */}
      {activeTab !== "sources" && (
        <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <Select value={gameFilter || "all"} onValueChange={(v) => { setGameFilter(v === "all" ? "" : v as GameSlug); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-white/[0.03] border-white/10 text-sm text-white focus:ring-violet-500/50 focus:ring-offset-0">
            <SelectValue placeholder="All Games" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            <SelectItem value="valorant">Valorant</SelectItem>
            <SelectItem value="bgmi">BGMI</SelectItem>
            <SelectItem value="freefire">Free Fire</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v as NewsStatus); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-white/[0.03] border-white/10 text-sm text-white focus:ring-violet-500/50 focus:ring-offset-0">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter || "all"} onValueChange={(v) => { setCategoryFilter(v === "all" ? "" : v as NewsCategory); setPage(1); }}>
          <SelectTrigger className="w-[150px] bg-white/[0.03] border-white/10 text-sm text-white focus:ring-violet-500/50 focus:ring-offset-0">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(NEWS_CATEGORIES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={regionFilter || "all"} onValueChange={(v) => { setRegionFilter(v === "all" ? "" : v as NewsRegion); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-white/[0.03] border-white/10 text-sm text-white focus:ring-violet-500/50 focus:ring-offset-0">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {Object.entries(NEWS_REGIONS).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-xs text-white/30">
        {loading ? "Loading..." : `${total} article${total !== 1 ? "s" : ""} found`}
      </p>

      {/* Articles table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                Article
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">
                Game
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden lg:table-cell">
                Source
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden sm:table-cell">
                Date
              </th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-violet-400 mx-auto" />
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">
                  No news articles found. Click &quot;Fetch Latest News&quot; to pull from RSS sources.
                </td>
              </tr>
            ) : (
              articles.map((article) => {
                const status = STATUS_STYLES[article.status] || STATUS_STYLES.pending;
                const game = GAME_STYLES[article.game_slug];
                const catInfo = NEWS_CATEGORIES[article.category];
                return (
                  <tr
                    key={article.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {article.thumbnail_url && (
                          <img
                            src={article.thumbnail_url}
                            alt=""
                            className="h-10 w-14 rounded object-cover hidden sm:block flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-[300px]">
                            {article.title}
                            {article.is_featured && (
                              <Star className="inline h-3 w-3 text-yellow-400 ml-1.5 fill-yellow-400" />
                            )}
                            {article.is_pinned && (
                              <Pin className="inline h-3 w-3 text-blue-400 ml-1" />
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {catInfo && (
                              <span className="text-[10px] text-white/30 capitalize">
                                {catInfo.label}
                              </span>
                            )}
                            {article.region !== "global" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 uppercase">
                                {article.region}
                              </span>
                            )}
                            {article.views_count > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] text-white/20">
                                <Eye className="h-2.5 w-2.5" />
                                {article.views_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {game && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${game.className}`}>
                          <Gamepad2 className="h-3 w-3" />
                          {game.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-white/40">
                        {(article.source as { name?: string } | undefined)?.name || "Manual"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/30 hidden sm:table-cell">
                      {formatDate(article.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-white/10 transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-white/40" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {article.original_url && (
                            <DropdownMenuItem
                              onClick={() => window.open(article.original_url, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Source
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/news/edit/${article.id}`)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Article
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {article.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (activeTab === "fetched") {
                                    router.push(`/admin/news/edit/${article.id}`);
                                  } else {
                                    handleAction(article.id, { status: "published" }, "Article published");
                                  }
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                                <span className="text-green-400">
                                  {activeTab === "fetched" ? "Edit & Publish" : "Publish"}
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleAction(article.id, { status: "approved" }, "Article approved")
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-blue-400" />
                                <span className="text-blue-400">Approve</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleAction(article.id, { status: "rejected" }, "Article rejected")
                                }
                              >
                                <XCircle className="h-4 w-4 mr-2 text-red-400" />
                                <span className="text-red-400">Reject</span>
                              </DropdownMenuItem>
                            </>
                          )}
                          {article.status === "approved" && (
                            <DropdownMenuItem
                              onClick={() => {
                                if (activeTab === "fetched") {
                                  router.push(`/admin/news/edit/${article.id}`);
                                } else {
                                  handleAction(article.id, { status: "published" }, "Article published");
                                }
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                              <span className="text-green-400">
                                {activeTab === "fetched" ? "Edit & Publish" : "Publish"}
                              </span>
                            </DropdownMenuItem>
                          )}
                          {article.status === "published" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction(article.id, { status: "pending" }, "Article unpublished")
                              }
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Unpublish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(
                                article.id,
                                { is_featured: !article.is_featured },
                                article.is_featured ? "Unfeatured" : "Featured"
                              )
                            }
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {article.is_featured ? "Unfeature" : "Feature"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(
                                article.id,
                                { is_pinned: !article.is_pinned },
                                article.is_pinned ? "Unpinned" : "Pinned"
                              )
                            }
                          >
                            <Pin className="h-4 w-4 mr-2" />
                            {article.is_pinned ? "Unpin" : "Pin"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-400 focus:text-red-400"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete this article?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete &quot;{article.title}&quot;. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(article.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/10 text-white/50 hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/10 text-white/50 hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
