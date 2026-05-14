import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Lock, Pin, CheckCircle2, Eye } from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { getForumCategoryBySlug, getForumThread, listForumReplies } from "@/lib/pro/forum-queries";
import { ForumThreadView } from "@/components/forum/forum-thread-view";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const cat = await getForumCategoryBySlug(category);
  if (!cat) return { title: "Thread" };
  const thread = await getForumThread(cat.id, slug);
  if (!thread) return { title: "Thread" };
  return {
    title: `${thread.title} — ${cat.name} · ggLobby`,
    description: thread.content.slice(0, 160),
    alternates: { canonical: `/forum/${cat.slug}/${thread.slug}` },
    openGraph: {
      title: thread.title,
      description: thread.content.slice(0, 160),
      type: "article",
    },
  };
}

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const cat = await getForumCategoryBySlug(category);
  if (!cat) notFound();
  const thread = await getForumThread(cat.id, slug);
  if (!thread) notFound();
  const replies = await listForumReplies(thread.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10 space-y-5">
      <nav className="text-xs text-text-muted flex items-center gap-1">
        <Link href="/forum" className="hover:text-text">Forum</Link>
        <ChevronLeft className="h-3 w-3 rotate-180" />
        <Link href={`/forum/${cat.slug}`} className="hover:text-text">{cat.name}</Link>
        <ChevronLeft className="h-3 w-3 rotate-180" />
        <span className="text-text-secondary">{thread.title.length > 40 ? thread.title.slice(0, 40) + "…" : thread.title}</span>
      </nav>

      <header className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-surface-light/30 flex items-center justify-between flex-wrap gap-2 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            {thread.is_pinned && <span className="inline-flex items-center gap-1 text-warning"><Pin className="h-3 w-3" /> Pinned</span>}
            {thread.is_locked && <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Locked</span>}
            {thread.is_solved && <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" /> Solved</span>}
            {thread.post_type !== "discussion" && <Badge variant="secondary" size="sm">{thread.post_type}</Badge>}
          </div>
          <div className="inline-flex items-center gap-1.5">
            <Eye className="h-3 w-3" /> {thread.view_count} views
          </div>
        </div>

        <div className="p-5">
          <h1 className="text-xl md:text-2xl font-bold text-text">{thread.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
            <Avatar src={thread.author?.avatar_url ?? undefined} size="xs" alt={thread.author?.username || ""} fallback={(thread.author?.display_name || thread.author?.username || "?")[0]} />
            <span className="font-medium text-text-secondary">{thread.author?.display_name || thread.author?.username || "anon"}</span>
            <span>·</span>
            <RelativeTime date={thread.created_at} />
          </div>
          <div className="mt-4 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
            {thread.content}
          </div>
          {thread.tags && thread.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {thread.tags.map((tag) => (
                <span key={tag} className="text-[11px] rounded-full bg-surface-light px-2 py-0.5 text-text-muted">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </header>

      <ForumThreadView postId={thread.id} initialReplies={replies} initialScore={thread.vote_score} isLocked={thread.is_locked} />
    </div>
  );
}
