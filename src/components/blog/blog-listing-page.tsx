"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Eye,
  Heart,
  MessageCircle,
  Clock,
  BookOpen,
  LayoutGrid,
  Search,
  Gamepad2,
  Mail,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// ── Types ───────────────────────────────────────────────────────────────────

interface BlogPostAuthor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface BlogListingPost {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  featured_image_url: string | null;
  category: string;
  tags: string[];
  published_at: string | null;
  created_at: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  author: BlogPostAuthor | null;
}

interface BlogListingPageProps {
  posts: BlogListingPost[];
}

// ── Category config ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "all", label: "All", color: "primary" },
  { key: "valorant", label: "Valorant", color: "red" },
  { key: "bgmi", label: "BGMI", color: "yellow" },
  { key: "freefire", label: "Free Fire", color: "orange" },
  { key: "esports", label: "Esports", color: "cyan" },
  { key: "guide", label: "Guide", color: "green" },
] as const;

const CATEGORY_LABEL_MAP: Record<string, string> = {
  news: "News",
  interview: "Interview",
  analysis: "Analysis",
  match_report: "Match Report",
  opinion: "Opinion",
  transfer: "Transfer",
  guide: "Guide",
  announcement: "Announcement",
};

const CATEGORY_COLOR_MAP: Record<string, string> = {
  news: "text-blue-400 border-blue-400/30 bg-blue-500/10",
  interview: "text-purple-400 border-purple-400/30 bg-purple-500/10",
  analysis: "text-cyan-400 border-cyan-400/30 bg-cyan-500/10",
  match_report: "text-emerald-400 border-emerald-400/30 bg-emerald-500/10",
  opinion: "text-orange-400 border-orange-400/30 bg-orange-500/10",
  transfer: "text-red-400 border-red-400/30 bg-red-500/10",
  guide: "text-yellow-400 border-yellow-400/30 bg-yellow-500/10",
  announcement: "text-pink-400 border-pink-400/30 bg-pink-500/10",
};

const TAB_STYLES: Record<string, { active: string; hover: string }> = {
  primary: {
    active:
      "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/50 shadow-lg shadow-primary/10",
    hover: "hover:bg-primary/10 hover:text-primary hover:border-primary/30",
  },
  red: {
    active:
      "bg-red-500/20 text-red-400 border-red-500/50 shadow-lg shadow-red-500/20",
    hover: "hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30",
  },
  yellow: {
    active:
      "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-lg shadow-yellow-500/20",
    hover:
      "hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30",
  },
  orange: {
    active:
      "bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-lg shadow-orange-500/20",
    hover:
      "hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/30",
  },
  cyan: {
    active:
      "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-lg shadow-cyan-500/20",
    hover: "hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30",
  },
  green: {
    active:
      "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/20",
    hover:
      "hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30",
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function matchesFilter(post: BlogListingPost, filter: string): boolean {
  if (filter === "all") return true;

  // For "guide" filter, match the category
  if (filter === "guide") return post.category === "guide";

  // For "esports" filter, match by category or tags
  if (filter === "esports") {
    if (
      post.category === "match_report" ||
      post.category === "transfer" ||
      post.category === "interview"
    )
      return true;
    return post.tags?.some((t) =>
      t.toLowerCase().includes("esport")
    );
  }

  // For game filters, match by tags
  const tagPrefix = filter.toLowerCase();
  return post.tags?.some((t) => t.toLowerCase().startsWith(tagPrefix));
}

// ── Fallback gradient based on post title ───────────────────────────────────

const GRADIENTS = [
  "from-purple-600/80 via-blue-600/60 to-cyan-500/80",
  "from-red-600/80 via-orange-500/60 to-yellow-500/80",
  "from-emerald-600/80 via-teal-500/60 to-cyan-500/80",
  "from-pink-600/80 via-purple-500/60 to-indigo-500/80",
  "from-blue-600/80 via-indigo-500/60 to-purple-500/80",
  "from-orange-600/80 via-red-500/60 to-pink-500/80",
];

function getFallbackGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

// ── Card animations ─────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
};

// ── Component ───────────────────────────────────────────────────────────────

export function BlogListingPage({ posts }: BlogListingPageProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    let result = posts;

    if (activeFilter !== "all") {
      result = result.filter((p) => matchesFilter(p, activeFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [posts, activeFilter, searchQuery]);

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              Gaming Blog
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-4 tracking-tight">
              Guides, News &{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Updates
              </span>
            </h1>
            <p className="text-text-secondary text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Stay ahead with the latest gaming guides, patch notes, esports
              coverage, and in-depth analysis for Valorant, BGMI, Free Fire and
              more.
            </p>
          </motion.div>

          {/* ── Search Bar ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 max-w-xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-primary/50 transition-colors">
                <div className="pl-4 text-text-dim">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, topics, games..."
                  className="flex-1 bg-transparent px-3 py-3 text-text placeholder:text-text-dim outline-none text-sm"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearchQuery("")}
                      className="px-3 text-text-dim hover:text-text transition-colors text-sm"
                    >
                      Clear
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Filter Tabs + Grid ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative mb-8"
        >
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const style = TAB_STYLES[cat.color] || TAB_STYLES.primary;
              const isActive = activeFilter === cat.key;

              return (
                <motion.button
                  key={cat.key}
                  onClick={() => setActiveFilter(cat.key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border shrink-0 ${
                    isActive
                      ? style.active
                      : `bg-surface-light text-text-muted border-border ${style.hover}`
                  }`}
                >
                  {cat.key === "all" && <LayoutGrid className="w-4 h-4" />}
                  {cat.key === "valorant" && <Gamepad2 className="w-4 h-4" />}
                  {cat.label}
                </motion.button>
              );
            })}
          </div>
          {/* Scroll fade on mobile */}
          <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
        </motion.div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-text-muted">
            {filteredPosts.length === 0
              ? "No articles found"
              : `${filteredPosts.length} article${filteredPosts.length !== 1 ? "s" : ""}`}
            {activeFilter !== "all" &&
              ` in ${CATEGORIES.find((c) => c.key === activeFilter)?.label}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* ── Post Grid / Empty State ───────────────────────────────── */}
        <AnimatePresence mode="wait">
          {filteredPosts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-20"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-surface border border-border mb-6">
                <BookOpen className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                No articles found
              </h3>
              <p className="text-text-muted max-w-md mx-auto mb-6">
                {searchQuery
                  ? "Try adjusting your search or clearing filters."
                  : "No articles match this filter yet. Check back soon!"}
              </p>
              {(searchQuery || activeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`grid-${activeFilter}-${searchQuery}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPosts.map((post, i) => (
                <BlogCard key={post.id} post={post} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Newsletter CTA ────────────────────────────────────────── */}
      <NewsletterCTA />
    </div>
  );
}

// ── Newsletter CTA Component ────────────────────────────────────────────────

function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to subscribe");
      }
      setSubscribed(true);
      setEmail("");
      toast.success("You're subscribed! Check your inbox for updates.");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-surface to-accent/10 border border-primary/20 p-8 sm:p-12 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 text-primary mb-5">
              <Mail className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
              Stay in the Loop
            </h2>
            <p className="text-text-muted max-w-lg mx-auto mb-8">
              Get weekly gaming news, patch updates, and community highlights
              delivered to your inbox. Never miss an update.
            </p>
            {subscribed ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/15 text-primary font-medium">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                You&apos;re subscribed!
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                  className="w-full sm:flex-1 px-4 py-3 rounded-xl bg-surface border border-border text-text placeholder:text-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                />
                <button
                  onClick={handleSubscribe}
                  disabled={!email.trim() || sending}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-background font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  Subscribe
                </button>
              </div>
            )}
            <p className="text-xs text-text-dim mt-4">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Blog Card Component ─────────────────────────────────────────────────────

function BlogCard({ post, index }: { post: BlogListingPost; index: number }) {
  const postUrl = post.slug ? `/blog/${post.slug}` : `/community/post/${post.id}`;
  const categoryLabel =
    CATEGORY_LABEL_MAP[post.category] || post.category;
  const categoryColor =
    CATEGORY_COLOR_MAP[post.category] || CATEGORY_COLOR_MAP.news;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      <Link href={postUrl} className="block h-full group">
        <article className="relative h-full rounded-xl overflow-hidden bg-surface border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
          {/* Hover glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
          </div>

          {/* Featured image */}
          <div className="relative h-44 overflow-hidden">
            {post.featured_image_url ? (
              <Image
                src={post.featured_image_url}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                unoptimized={post.featured_image_url.startsWith("/uploads/")}
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${getFallbackGradient(post.title)} flex items-center justify-center`}
              >
                <BookOpen className="w-10 h-10 text-white/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />

            {/* Category badge on image */}
            <div className="absolute top-3 left-3">
              <Badge variant="outline" className={`${categoryColor} text-xs backdrop-blur-sm`}>
                {categoryLabel}
              </Badge>
            </div>

            {/* Read arrow on hover */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-2 bg-black/60 backdrop-blur-sm rounded-full">
                <svg
                  className="w-4 h-4 text-text"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Date */}
            {post.published_at && (
              <span className="text-xs text-text-dim flex items-center gap-1 mb-2.5">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(post.published_at), {
                  addSuffix: true,
                })}
              </span>
            )}

            {/* Title */}
            <h2 className="font-bold text-text text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {post.title}
            </h2>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-text-secondary text-sm mb-4 line-clamp-2 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-text-muted bg-surface-light px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="text-xs text-text-dim">
                    +{post.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Footer: Author + Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {/* Author */}
              <div className="flex items-center gap-2 min-w-0">
                <Avatar
                  src={post.author?.avatar_url}
                  alt={
                    post.author?.display_name ||
                    post.author?.username ||
                    "Author"
                  }
                  size="sm"
                />
                <p className="text-sm font-medium text-text truncate">
                  {post.author?.display_name || post.author?.username || "Anonymous"}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-text-muted shrink-0">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {formatCount(post.views_count)}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  {formatCount(post.likes_count)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {formatCount(post.comments_count)}
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
