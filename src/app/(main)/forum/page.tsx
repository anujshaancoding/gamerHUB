import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, PlusCircle, Pin } from "lucide-react";
import { Badge } from "@/components/ui";
import { listForumCategories, listLatestForumThreads } from "@/lib/pro/forum-queries";
import { ForumCategoryIcon } from "@/components/forum/forum-icon";
import { RelativeTime } from "@/components/ui/RelativeTime";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Forum — Indian gamer discussions · ggLobby",
  description:
    "HLTV-style discussion board for Indian gamers. Sections for Valorant, BGMI, Free Fire, hardware, LFG and more.",
  alternates: { canonical: "/forum" },
  openGraph: {
    title: "ggLobby Forum",
    description: "Talk Indian esports, hardware and ranked rants.",
    type: "website",
  },
};

export default async function ForumLandingPage() {
  const [cats, latest] = await Promise.all([
    listForumCategories(),
    listLatestForumThreads(10),
  ]);

  const announcements = cats.find((c) => c.slug === "announcements");
  const sections = cats.filter((c) => c.slug !== "announcements");

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
        <div>
          <Badge variant="primary" size="sm" className="mb-2">Beta</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-text">Forum</h1>
          <p className="text-text-muted mt-2 max-w-2xl">
            HLTV-style discussions for the Indian gaming scene. Pick a section, jump
            into threads, or start your own.
          </p>
        </div>
        <Link
          href="/forum/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4" /> New thread
        </Link>
      </header>

      {announcements && announcements.post_count > 0 && (
        <Link
          href={`/forum/${announcements.slug}`}
          className="block rounded-xl border border-pink-500/30 bg-pink-500/5 px-4 py-3 hover:bg-pink-500/10"
        >
          <div className="flex items-center gap-2 text-pink-300 text-sm font-medium">
            <Pin className="h-4 w-4" /> {announcements.name}
            <span className="text-text-muted">· {announcements.post_count} posts</span>
          </div>
          {announcements.description && (
            <p className="text-xs text-text-secondary mt-1">{announcements.description}</p>
          )}
        </Link>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <section className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_80px] px-4 py-2.5 bg-surface-light/30 border-b border-border text-xs uppercase tracking-wider text-text-muted font-medium">
            <span>Section</span>
            <span className="text-right">Threads</span>
            <span className="text-right">Last</span>
          </div>
          <ul className="divide-y divide-border/50">
            {sections.map((c) => (
              <li key={c.id}>
                <Link href={`/forum/${c.slug}`} className="grid grid-cols-[1fr_80px_80px] px-4 py-3 hover:bg-surface-light/30 transition-colors gap-3 items-center">
                  <div className="flex items-start gap-3 min-w-0">
                    <ForumCategoryIcon name={c.icon} color={c.color} />
                    <div className="min-w-0">
                      <p className="font-semibold text-text truncate">{c.name}</p>
                      {c.description && <p className="text-xs text-text-muted truncate">{c.description}</p>}
                    </div>
                  </div>
                  <span className="text-sm font-mono text-text-secondary text-right">{c.post_count}</span>
                  <span className="text-xs text-text-muted text-right">
                    {/* per-category latest thread time is omitted to keep this page cheap */}
                    —
                  </span>
                </Link>
              </li>
            ))}
            {sections.length === 0 && (
              <li className="p-6 text-sm text-text-muted text-center">No sections yet. An admin needs to seed them — apply <code>02_forum_seed.sql</code>.</li>
            )}
          </ul>
        </section>

        <aside className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 bg-surface-light/30 border-b border-border flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-text">Latest activity</h2>
          </div>
          {latest.length === 0 ? (
            <p className="p-4 text-sm text-text-muted">No threads yet. Be the first.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {latest.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/forum/${t.category?.slug}/${t.slug}`}
                    className="block px-4 py-2.5 hover:bg-surface-light/30 transition-colors"
                  >
                    <p className="text-sm font-medium text-text line-clamp-1">{t.title}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {t.category?.name} · {t.reply_count} replies · {" "}
                      <RelativeTime date={t.last_reply_at ?? t.created_at} />
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
