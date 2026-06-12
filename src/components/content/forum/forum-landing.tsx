"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, PlusCircle, Pin, MessagesSquare, ArrowRight } from "lucide-react";
import { ForumCategoryIcon } from "@/components/content/forum/forum-icon";
import { RelativeTime } from "@/components/ui/RelativeTime";
import type { ForumCategoryRow, ForumThreadRow } from "@/lib/pro/forum-queries";

export function ForumLanding({
  announcements,
  sections,
  latest,
}: {
  announcements: ForumCategoryRow | null;
  sections: ForumCategoryRow[];
  latest: ForumThreadRow[];
}) {
  return (
    <div className="relative -m-4 lg:-m-6 overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-14 pb-12 sm:px-6 sm:pt-20 sm:pb-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(0,255,136,0.16) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(45% 60% at 85% 15%, rgba(0,212,255,0.14) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary"
            >
              <MessagesSquare className="h-3.5 w-3.5" />
              Community
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="mt-4 text-4xl font-black uppercase leading-[0.95] tracking-tight text-text sm:text-6xl lg:text-7xl"
            >
              The{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Forum
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="mt-4 max-w-xl text-base text-text-secondary sm:text-lg"
            >
              Discussions for the Indian Valorant scene. Pick a section, jump
              into threads, or start your own.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
          >
            <Link
              href="/forum/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold uppercase tracking-wide text-background shadow-lg shadow-primary/20 ring-1 ring-primary/50 transition-transform hover:-translate-y-0.5"
            >
              <PlusCircle className="h-4 w-4" /> New thread
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl space-y-6 px-4 pb-20 sm:px-6">
        {announcements && announcements.post_count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href={`/forum/${announcements.slug}`}
              className="group relative block overflow-hidden rounded-2xl border border-pink-500/30 bg-pink-500/[0.06] px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-pink-500/50"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(60% 80% at 20% 50%, rgba(236,72,153,0.18) 0%, transparent 70%)",
                }}
              />
              <div className="relative flex items-center gap-2 text-sm font-semibold text-pink-300">
                <Pin className="h-4 w-4" /> {announcements.name}
                <span className="text-text-muted">
                  · {announcements.post_count} posts
                </span>
              </div>
              {announcements.description && (
                <p className="relative mt-1 text-xs text-text-secondary">
                  {announcements.description}
                </p>
              )}
            </Link>
          </motion.div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          {/* Sections */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-2xl border border-border bg-surface"
          >
            <div className="flex items-center gap-3 border-b border-border bg-surface-light/30 px-5 py-4">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-text">
                Sections
              </h2>
            </div>

            {sections.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-light/40">
                  <MessagesSquare className="h-7 w-7 text-text-dim" />
                </div>
                <p className="text-sm font-semibold text-text">
                  No sections yet
                </p>
                <p className="max-w-sm text-xs text-text-muted">
                  An admin needs to seed them — apply{" "}
                  <code className="rounded bg-surface-light px-1.5 py-0.5 text-text-secondary">
                    02_forum_seed.sql
                  </code>
                  .
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/50">
                {sections.map((c, i) => (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
                  >
                    <Link
                      href={`/forum/${c.slug}`}
                      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-light/40"
                    >
                      <ForumCategoryIcon name={c.icon} color={c.color} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-text transition-colors group-hover:text-primary">
                          {c.name}
                        </p>
                        {c.description && (
                          <p className="truncate text-xs text-text-muted">
                            {c.description}
                          </p>
                        )}
                      </div>
                      <div className="hidden shrink-0 text-right sm:block">
                        <p className="font-mono text-sm font-semibold text-text-secondary">
                          {c.post_count}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-text-dim">
                          threads
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-text-dim transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.section>

          {/* Latest activity */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="overflow-hidden rounded-2xl border border-border bg-surface"
          >
            <div className="flex items-center gap-2 border-b border-border bg-surface-light/30 px-5 py-4">
              <MessageSquare className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-text">
                Latest activity
              </h2>
            </div>
            {latest.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-light/40">
                  <MessageSquare className="h-6 w-6 text-text-dim" />
                </div>
                <p className="text-sm font-semibold text-text">
                  No threads yet
                </p>
                <p className="text-xs text-text-muted">Be the first to post.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/50">
                {latest.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/forum/${t.category?.slug}/${t.slug}`}
                      className="group block px-5 py-3.5 transition-colors hover:bg-surface-light/40"
                    >
                      <p className="line-clamp-1 text-sm font-semibold text-text transition-colors group-hover:text-accent">
                        {t.title}
                      </p>
                      <p className="mt-1 text-[11px] text-text-muted">
                        {t.category?.name} · {t.reply_count} replies ·{" "}
                        <RelativeTime
                          date={t.last_reply_at ?? t.created_at}
                        />
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
