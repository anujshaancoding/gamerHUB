import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, PlusCircle, Pin, Lock, CheckCircle2 } from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { ForumCategoryIcon } from "@/components/forum/forum-icon";
import {
  getForumCategoryBySlug,
  listForumThreadsByCategory,
} from "@/lib/pro/forum-queries";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = await getForumCategoryBySlug(category);
  if (!cat) return { title: "Forum" };
  return {
    title: `${cat.name} — Forum · ggLobby`,
    description: cat.description ?? `Discussion threads in the ${cat.name} section.`,
    alternates: { canonical: `/forum/${cat.slug}` },
  };
}

export default async function ForumCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { category } = await params;
  const { sort } = await searchParams;
  const cat = await getForumCategoryBySlug(category);
  if (!cat) notFound();

  const sortMode: "latest" | "popular" = sort === "popular" ? "popular" : "latest";
  const threads = await listForumThreadsByCategory(cat.id, sortMode, 50);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 space-y-5">
      <Link href="/forum" className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text">
        <ChevronLeft className="h-3 w-3" /> All sections
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <ForumCategoryIcon name={cat.icon} color={cat.color} />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-text">{cat.name}</h1>
            {cat.description && <p className="text-sm text-text-muted">{cat.description}</p>}
          </div>
        </div>
        <Link
          href={`/forum/new?category=${cat.slug}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90 self-start"
        >
          <PlusCircle className="h-4 w-4" /> New thread
        </Link>
      </div>

      <div className="flex gap-1 rounded-lg bg-surface-light p-1 self-start w-fit">
        <SortTab href={`/forum/${cat.slug}`} active={sortMode === "latest"}>Latest</SortTab>
        <SortTab href={`/forum/${cat.slug}?sort=popular`} active={sortMode === "popular"}>Top</SortTab>
      </div>

      {threads.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center text-text-muted">
          No threads yet. Start the first conversation.
        </div>
      ) : (
        <ul className="rounded-xl border border-border bg-surface overflow-hidden divide-y divide-border/50">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`/forum/${cat.slug}/${t.slug}`}
                className="grid grid-cols-[1fr_60px_60px] gap-3 px-4 py-3 hover:bg-surface-light/30 transition-colors items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.is_pinned && <Pin className="h-3.5 w-3.5 text-warning" />}
                    {t.is_locked && <Lock className="h-3.5 w-3.5 text-text-muted" />}
                    {t.is_solved && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                    {t.post_type !== "discussion" && (
                      <Badge variant="secondary" size="sm">{t.post_type}</Badge>
                    )}
                    <span className="font-semibold text-text line-clamp-1">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted">
                    <Avatar src={t.author?.avatar_url ?? undefined} size="xs" alt={t.author?.username || ""} fallback={(t.author?.display_name || t.author?.username || "?")[0]} />
                    <span>{t.author?.display_name || t.author?.username || "anon"}</span>
                    <span>·</span>
                    <RelativeTime date={t.created_at} />
                    {t.last_reply_at && (
                      <>
                        <span>·</span>
                        <span>last reply <RelativeTime date={t.last_reply_at} /></span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-semibold text-text">{t.reply_count}</div>
                  <div className="text-[10px] text-text-muted uppercase">replies</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-semibold text-text">{t.vote_score}</div>
                  <div className="text-[10px] text-text-muted uppercase">score</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SortTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${active ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text-secondary"}`}
    >
      {children}
    </Link>
  );
}
