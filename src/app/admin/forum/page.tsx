"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MessagesSquare,
  MessageSquare,
  FolderTree,
  Pin,
  PinOff,
  Lock,
  LockOpen,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  Search,
  Loader2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────

interface Author {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}
interface Post {
  id: string;
  title: string;
  slug: string;
  post_type: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_deleted: boolean;
  view_count: number;
  reply_count: number;
  vote_score: number;
  created_at: string;
  author: Author | null;
  category: { id: string; slug: string; name: string } | null;
}
interface Reply {
  id: string;
  post_id: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  author: Author | null;
  post: { id: string; title: string; slug: string } | null;
}
interface Category {
  id: string;
  slug: string;
  name: string;
  post_count: number;
  is_locked: boolean;
  is_hidden: boolean;
  display_order: number;
}

const TABS = [
  { id: "posts", label: "Threads", icon: MessagesSquare },
  { id: "replies", label: "Replies", icon: MessageSquare },
  { id: "categories", label: "Categories", icon: FolderTree },
] as const;

const POST_STATUSES = ["all", "active", "deleted", "locked", "pinned"] as const;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

async function patchForum(body: Record<string, unknown>): Promise<boolean> {
  const csrf = document.cookie.split("; ").find((c) => c.startsWith("csrf_token="))?.split("=")[1];
  const res = await fetch("/api/admin/forum", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(csrf ? { "x-csrf-token": csrf } : {}) },
    body: JSON.stringify(body),
  });
  return res.ok;
}

// ── Small UI helpers ────────────────────────────────────────────────────────

function ActionBtn({
  onClick, icon: Icon, label, tone = "default",
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: "default" | "danger" | "good";
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
        tone === "danger"
          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
          : tone === "good"
          ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className={cn("text-[11px] px-1.5 py-0.5 rounded border", tone)}>{children}</span>;
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function AdminForumPage() {
  const [tab, setTab] = useState<string>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "categories") {
        const res = await fetch("/api/admin/forum?view=categories");
        if (res.ok) setCategories((await res.json()).categories ?? []);
      } else {
        const params = new URLSearchParams({ view: tab, status });
        if (query) params.set("search", query);
        const res = await fetch(`/api/admin/forum?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (tab === "posts") setPosts(data.posts ?? []);
          else setReplies(data.replies ?? []);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [tab, status, query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const act = async (body: Record<string, unknown>, id: string, okMsg: string) => {
    setBusyId(id);
    try {
      if (await patchForum(body)) {
        toast.success(okMsg);
        fetchData();
      } else {
        toast.error("Action failed");
      }
    } finally {
      setBusyId(null);
    }
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search.trim());
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MessagesSquare className="h-5 w-5 text-violet-400" />
          Forum Moderation
        </h2>
        <p className="text-sm text-white/40 mt-1">
          Pin, lock, delete and restore any thread or reply, and manage categories.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/[0.02] border border-white/5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center",
              tab === t.id ? "bg-violet-500/20 text-violet-300" : "text-white/40 hover:text-white/60 hover:bg-white/5",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters (posts/replies only) */}
      {tab !== "categories" && (
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={onSearch} className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "posts" ? "Search thread titles…" : "Search reply text…"}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm outline-none focus:border-violet-500/50 placeholder:text-white/20"
            />
          </form>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.02] border border-white/5">
            {(tab === "posts" ? POST_STATUSES : (["all", "active", "deleted"] as const)).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors",
                  status === s ? "bg-violet-500/20 text-violet-300" : "text-white/40 hover:text-white/70",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
        </div>
      ) : tab === "posts" ? (
        <PostList posts={posts} busyId={busyId} act={act} />
      ) : tab === "replies" ? (
        <ReplyList replies={replies} busyId={busyId} act={act} />
      ) : (
        <CategoryList categories={categories} busyId={busyId} act={act} />
      )}
    </div>
  );
}

// ── Threads ─────────────────────────────────────────────────────────────────

function PostList({
  posts, busyId, act,
}: {
  posts: Post[];
  busyId: string | null;
  act: (body: Record<string, unknown>, id: string, okMsg: string) => void;
}) {
  if (posts.length === 0) return <Empty label="No threads match this filter." />;
  return (
    <div className="space-y-2">
      {posts.map((p) => (
        <div
          key={p.id}
          className={cn("rounded-xl border bg-white/[0.02] p-4", p.is_deleted ? "border-red-500/20 opacity-70" : "border-white/5")}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {p.is_pinned && <Badge tone="bg-green-500/10 text-green-400 border-green-500/20">pinned</Badge>}
                {p.is_locked && <Badge tone="bg-orange-500/10 text-orange-400 border-orange-500/20">locked</Badge>}
                {p.is_deleted && <Badge tone="bg-red-500/10 text-red-400 border-red-500/20">deleted</Badge>}
                {p.category && <Badge tone="bg-violet-500/10 text-violet-400 border-violet-500/20">{p.category.name}</Badge>}
              </div>
              <a
                href={p.category ? `/forum/${p.category.slug}/${p.slug}` : "#"}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-violet-300 transition-colors"
              >
                {p.title}
                <ExternalLink className="h-3 w-3 text-white/30" />
              </a>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-white/30">
                <span>@{p.author?.username || "unknown"}</span>
                <span>{p.reply_count} replies</span>
                <span>{p.vote_score} votes</span>
                <span>{timeAgo(p.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              {busyId === p.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-white/40" />
              ) : p.is_deleted ? (
                <ActionBtn onClick={() => act({ entity: "post", id: p.id, action: "restore" }, p.id, "Thread restored")} icon={RotateCcw} label="Restore" tone="good" />
              ) : (
                <>
                  <ActionBtn
                    onClick={() => act({ entity: "post", id: p.id, action: p.is_pinned ? "unpin" : "pin" }, p.id, p.is_pinned ? "Unpinned" : "Pinned")}
                    icon={p.is_pinned ? PinOff : Pin}
                    label={p.is_pinned ? "Unpin" : "Pin"}
                  />
                  <ActionBtn
                    onClick={() => act({ entity: "post", id: p.id, action: p.is_locked ? "unlock" : "lock" }, p.id, p.is_locked ? "Unlocked" : "Locked")}
                    icon={p.is_locked ? LockOpen : Lock}
                    label={p.is_locked ? "Unlock" : "Lock"}
                  />
                  <ActionBtn
                    onClick={() => { if (confirm("Delete this thread? It will be hidden from the forum (recoverable).")) act({ entity: "post", id: p.id, action: "delete" }, p.id, "Thread deleted"); }}
                    icon={Trash2}
                    label="Delete"
                    tone="danger"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Replies ─────────────────────────────────────────────────────────────────

function ReplyList({
  replies, busyId, act,
}: {
  replies: Reply[];
  busyId: string | null;
  act: (body: Record<string, unknown>, id: string, okMsg: string) => void;
}) {
  if (replies.length === 0) return <Empty label="No replies match this filter." />;
  return (
    <div className="space-y-2">
      {replies.map((r) => (
        <div
          key={r.id}
          className={cn("rounded-xl border bg-white/[0.02] p-4", r.is_deleted ? "border-red-500/20 opacity-70" : "border-white/5")}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-xs text-white/30">
                <span className="text-white/60 font-medium">@{r.author?.username || "unknown"}</span>
                {r.is_deleted && <Badge tone="bg-red-500/10 text-red-400 border-red-500/20">deleted</Badge>}
                <span>{timeAgo(r.created_at)}</span>
                {r.post && (
                  <span className="text-white/40">
                    on “{r.post.title.slice(0, 40)}{r.post.title.length > 40 ? "…" : ""}”
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-white/70 whitespace-pre-wrap break-words line-clamp-4">{r.content}</p>
            </div>
            <div className="shrink-0">
              {busyId === r.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-white/40" />
              ) : r.is_deleted ? (
                <ActionBtn onClick={() => act({ entity: "reply", id: r.id, action: "restore" }, r.id, "Reply restored")} icon={RotateCcw} label="Restore" tone="good" />
              ) : (
                <ActionBtn
                  onClick={() => { if (confirm("Delete this reply?")) act({ entity: "reply", id: r.id, action: "delete" }, r.id, "Reply deleted"); }}
                  icon={Trash2}
                  label="Delete"
                  tone="danger"
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Categories ──────────────────────────────────────────────────────────────

function CategoryList({
  categories, busyId, act,
}: {
  categories: Category[];
  busyId: string | null;
  act: (body: Record<string, unknown>, id: string, okMsg: string) => void;
}) {
  if (categories.length === 0) return <Empty label="No categories found." />;
  return (
    <div className="space-y-2">
      {categories.map((c, i) => (
        <div key={c.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center gap-3">
          <div className="flex flex-col">
            <button
              disabled={i === 0 || busyId === c.id}
              onClick={() => act({ entity: "category", id: c.id, action: "reorder", value: c.display_order - 1 }, c.id, "Reordered")}
              className="p-0.5 text-white/30 hover:text-white/70 disabled:opacity-20"
              title="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              disabled={i === categories.length - 1 || busyId === c.id}
              onClick={() => act({ entity: "category", id: c.id, action: "reorder", value: c.display_order + 1 }, c.id, "Reordered")}
              className="p-0.5 text-white/30 hover:text-white/70 disabled:opacity-20"
              title="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-white">{c.name}</span>
              <span className="text-xs text-white/30">/{c.slug}</span>
              {c.is_locked && <Badge tone="bg-orange-500/10 text-orange-400 border-orange-500/20">locked</Badge>}
              {c.is_hidden && <Badge tone="bg-red-500/10 text-red-400 border-red-500/20">hidden</Badge>}
            </div>
            <p className="text-xs text-white/30 mt-0.5">{c.post_count} posts</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {busyId === c.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-white/40" />
            ) : (
              <>
                <ActionBtn
                  onClick={() => act({ entity: "category", id: c.id, action: c.is_locked ? "unlock" : "lock" }, c.id, c.is_locked ? "Unlocked" : "Locked")}
                  icon={c.is_locked ? LockOpen : Lock}
                  label={c.is_locked ? "Unlock" : "Lock"}
                />
                <ActionBtn
                  onClick={() => act({ entity: "category", id: c.id, action: c.is_hidden ? "unhide" : "hide" }, c.id, c.is_hidden ? "Shown" : "Hidden")}
                  icon={c.is_hidden ? Eye : EyeOff}
                  label={c.is_hidden ? "Show" : "Hide"}
                />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="text-center py-16 text-white/30 text-sm">{label}</div>;
}
