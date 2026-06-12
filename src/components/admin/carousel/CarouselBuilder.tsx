"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Loader2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Sparkles,
  FileText,
  PenSquare,
} from "lucide-react";
import { useAdminBlogPosts } from "@/lib/hooks/useAdminBlog";
import {
  extractSlides,
  type ExtractInput,
} from "@/lib/features/carousel/extract-tips";
import {
  renderDeck,
  renderSlide,
  SLIDE_H,
  SLIDE_W,
  type CarouselSlide,
  type SlideKind,
} from "@/lib/features/carousel/render-carousel";
import { RANK_THEMES, RANK_TIERS, type RankTier } from "@/lib/features/carousel/rank-themes";
import { downloadAll, downloadBlob } from "@/lib/features/carousel/download";

type SourceMode = "blog" | "scratch";

const SLIDE_KIND_LABEL: Record<SlideKind, string> = {
  cover: "Cover",
  tip: "Tip",
  cta: "CTA",
};

export function CarouselBuilder() {
  // ── Source state
  const [mode, setMode] = useState<SourceMode>("blog");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [scratchTitle, setScratchTitle] = useState("");
  const [scratchContent, setScratchContent] = useState("");
  const [rank, setRank] = useState<RankTier>("all");
  const [ctaUrl, setCtaUrl] = useState("gglobby.in");
  const [handle, setHandle] = useState("@gglobby.in");

  // ── Deck state
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);

  // ── Posts for the blog picker
  const { posts, loading: postsLoading } = useAdminBlogPosts({
    status: "published",
    limit: 30,
  });
  const selectedPost = useMemo(
    () => posts.find((p) => p.slug === selectedSlug) ?? null,
    [posts, selectedSlug],
  );

  // ── Re-apply rank to all slides when it changes
  useEffect(() => {
    setSlides((prev) => prev.map((s) => ({ ...s, rank })));
  }, [rank]);

  // ── Generate slides from the chosen source
  const handleGenerate = () => {
    let input: ExtractInput;
    if (mode === "blog") {
      if (!selectedPost) {
        toast.error("Pick a blog post first");
        return;
      }
      input = {
        title: selectedPost.title,
        excerpt: selectedPost.excerpt,
        content: selectedPost.content,
        rank,
      };
    } else {
      if (!scratchTitle.trim() || !scratchContent.trim()) {
        toast.error("Add a title and some content");
        return;
      }
      input = {
        title: scratchTitle,
        content: scratchContent,
        rank,
      };
    }
    const next = extractSlides(input);
    setSlides(next);
    setActiveIdx(0);
    toast.success(`${next.length} slides generated`);
  };

  // ── Slide list edits
  const updateSlide = (idx: number, patch: Partial<CarouselSlide>) => {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };
  const removeSlide = (idx: number) => {
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((cur) => Math.max(0, Math.min(cur, slides.length - 2)));
  };
  const moveSlide = (idx: number, dir: -1 | 1) => {
    setSlides((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setActiveIdx(idx + dir);
  };
  const addSlide = () => {
    setSlides((prev) => [
      ...prev,
      {
        kind: "tip",
        rank,
        title: "New tip",
        body: "Write the tip body here.",
      },
    ]);
    setActiveIdx(slides.length);
  };

  // ── Download
  const handleDownloadAll = async () => {
    if (!slides.length) return;
    setDownloading(true);
    try {
      const blobs = await renderDeck({
        slides,
        ctaUrl,
        handle,
      });
      const prefix =
        mode === "blog" && selectedPost
          ? `gglobby-${selectedPost.slug}`
          : `gglobby-carousel-${Date.now()}`;
      await downloadAll(blobs, prefix);
      toast.success(`Downloaded ${blobs.length} slides`);
    } catch (err) {
      console.error(err);
      toast.error("Render failed — check the console");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadOne = async (idx: number) => {
    const slide = slides[idx];
    if (!slide) return;
    const total = slides.length;
    try {
      const blob = await renderSlide(
        { ...slide, index: idx + 1, total },
        { ctaUrl, handle },
      );
      downloadBlob(
        blob,
        `gglobby-slide-${String(idx + 1).padStart(2, "0")}.png`,
      );
    } catch (err) {
      console.error(err);
      toast.error("Render failed");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      {/* ── LEFT: source + slide editor ──────────────────────────────── */}
      <div className="space-y-4">
        {/* Source mode tabs */}
        <div className="flex rounded-lg border border-white/10 bg-white/[0.02] p-1">
          <button
            onClick={() => setMode("blog")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
              mode === "blog"
                ? "bg-violet-500/15 text-violet-300"
                : "text-white/50 hover:text-white"
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> From blog post
          </button>
          <button
            onClick={() => setMode("scratch")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
              mode === "scratch"
                ? "bg-violet-500/15 text-violet-300"
                : "text-white/50 hover:text-white"
            }`}
          >
            <PenSquare className="h-3.5 w-3.5" /> From scratch
          </button>
        </div>

        {/* Source body */}
        {mode === "blog" ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Published post
            </label>
            <select
              value={selectedSlug ?? ""}
              onChange={(e) => setSelectedSlug(e.target.value || null)}
              disabled={postsLoading}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none disabled:opacity-50"
            >
              <option value="">
                {postsLoading ? "Loading…" : "— Select a post —"}
              </option>
              {posts.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.title}
                </option>
              ))}
            </select>
            {selectedPost?.excerpt && (
              <p className="text-xs text-white/40 line-clamp-3">
                {selectedPost.excerpt}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                Title
              </label>
              <input
                value={scratchTitle}
                onChange={(e) => setScratchTitle(e.target.value)}
                placeholder="5 Gold-to-Plat tips most players ignore"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                Content
                <span className="ml-1.5 font-normal normal-case tracking-normal text-white/30">
                  — use numbered lists, headings, or paragraphs; we&apos;ll split it
                </span>
              </label>
              <textarea
                value={scratchContent}
                onChange={(e) => setScratchContent(e.target.value)}
                rows={10}
                placeholder={
                  "1. Check minimap every 5 seconds — ...\n2. Pre-aim common angles — ...\n3. ..."
                }
                className="w-full resize-y rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-xs leading-relaxed text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Rank + CTA */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
              Rank theme
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {RANK_TIERS.map((tier) => {
                const theme = RANK_THEMES[tier];
                const active = rank === tier;
                return (
                  <button
                    key={tier}
                    onClick={() => setRank(tier)}
                    className={`group relative rounded-md border px-1.5 py-1.5 text-[10px] font-bold uppercase transition-all ${
                      active
                        ? "border-white/40 bg-white/[0.06] text-white"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white"
                    }`}
                    title={theme.label}
                  >
                    <span
                      className="mb-1 block h-2 w-full rounded-sm"
                      style={{ background: theme.accent }}
                    />
                    {theme.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                CTA URL
              </label>
              <input
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-violet-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                Handle
              </label>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white focus:border-violet-500/50 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Generate */}
        <button
          onClick={handleGenerate}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-600"
        >
          <Sparkles className="h-4 w-4" />
          {slides.length ? "Regenerate slides" : "Generate slides"}
        </button>

        {/* Slide list */}
        {slides.length > 0 && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                {slides.length} slides
              </p>
              <button
                onClick={addSlide}
                className="flex items-center gap-1 text-[11px] font-semibold text-violet-300 hover:text-violet-200"
              >
                <Plus className="h-3 w-3" /> Add tip
              </button>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {slides.map((s, i) => (
                <SlideRow
                  key={i}
                  slide={s}
                  index={i}
                  active={i === activeIdx}
                  total={slides.length}
                  onSelect={() => setActiveIdx(i)}
                  onChange={(patch) => updateSlide(i, patch)}
                  onRemove={() => removeSlide(i)}
                  onMove={(dir) => moveSlide(i, dir)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: preview + download ──────────────────────────────── */}
      <div className="space-y-4">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          {slides.length === 0 ? (
            <div className="flex h-[560px] flex-col items-center justify-center text-center text-white/40">
              <Sparkles className="h-10 w-10 text-white/20 mb-3" />
              <p className="text-sm font-semibold text-white/60">
                No slides yet
              </p>
              <p className="mt-1 max-w-xs text-xs text-white/30">
                Pick a published blog post (or write something from scratch),
                choose a rank theme, and hit Generate.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <SlideCanvas
                slide={{
                  ...slides[activeIdx],
                  index: activeIdx + 1,
                  total: slides.length,
                }}
                ctaUrl={ctaUrl}
                handle={handle}
              />

              {/* Per-slide download */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/40">
                  Slide {activeIdx + 1} of {slides.length} —{" "}
                  <span className="text-white/60">
                    {SLIDE_KIND_LABEL[slides[activeIdx].kind]}
                  </span>
                </p>
                <button
                  onClick={() => handleDownloadOne(activeIdx)}
                  className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" /> This slide
                </button>
              </div>

              {/* Strip */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {slides.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`shrink-0 rounded-md border px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-all ${
                      i === activeIdx
                        ? "border-violet-400/60 bg-violet-500/10 text-violet-200"
                        : "border-white/10 bg-white/[0.02] text-white/40 hover:text-white/70"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")} ·{" "}
                    {SLIDE_KIND_LABEL[s.kind]}
                  </button>
                ))}
              </div>

              {/* Download all */}
              <button
                onClick={handleDownloadAll}
                disabled={downloading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Rendering…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Download all{" "}
                    {slides.length} slides
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SlideRow ────────────────────────────────────────────────────────

function SlideRow({
  slide,
  index,
  total,
  active,
  onSelect,
  onChange,
  onRemove,
  onMove,
}: {
  slide: CarouselSlide;
  index: number;
  total: number;
  active: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<CarouselSlide>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border p-3 transition-all ${
        active
          ? "border-violet-400/50 bg-violet-500/[0.06]"
          : "border-white/10 bg-white/[0.02] hover:border-white/20"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/70">
            {String(index + 1).padStart(2, "0")}
          </span>
          <select
            value={slide.kind}
            onChange={(e) =>
              onChange({ kind: e.target.value as SlideKind })
            }
            onClick={(e) => e.stopPropagation()}
            className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white/70"
          >
            <option value="cover">Cover</option>
            <option value="tip">Tip</option>
            <option value="cta">CTA</option>
          </select>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove(-1);
            }}
            disabled={index === 0}
            className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-20"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove(1);
            }}
            disabled={index === total - 1}
            className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-20"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="rounded p-1 text-white/40 hover:bg-red-500/20 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <input
        value={slide.title}
        onChange={(e) => onChange({ title: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder="Title"
        className="w-full rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs font-semibold text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none mb-1.5"
      />
      <textarea
        value={slide.body}
        onChange={(e) => onChange({ body: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        rows={2}
        placeholder="Body"
        className="w-full resize-y rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] text-white/80 placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none"
      />
    </div>
  );
}

// ── Live canvas preview ─────────────────────────────────────────────
//
// We draw the slide into a regular Canvas (not OffscreenCanvas) so we can
// display it directly in the DOM. The render-carousel module uses
// OffscreenCanvas for export, but the drawing instructions are identical —
// so we just call renderSlide() and draw the resulting Blob into an <img>.

function SlideCanvas({
  slide,
  ctaUrl,
  handle,
}: {
  slide: CarouselSlide;
  ctaUrl: string;
  handle: string;
}) {
  // We keep the previous image visible while the next one renders — avoids the
  // flash-of-loading anti-pattern and sidesteps the "setState in effect"
  // cascading-render lint rule. The first render shows a loader because url is
  // still null.
  const [url, setUrl] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const reqId = ++reqIdRef.current;
    let revokeUrl: string | null = null;
    renderSlide(slide, { ctaUrl, handle })
      .then((blob) => {
        if (reqId !== reqIdRef.current) return;
        const objectUrl = URL.createObjectURL(blob);
        revokeUrl = objectUrl;
        setUrl(objectUrl);
      })
      .catch((err) => console.error("[carousel preview]", err));
    return () => {
      if (revokeUrl) setTimeout(() => URL.revokeObjectURL(revokeUrl!), 1000);
    };
  }, [slide, ctaUrl, handle]);

  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-lg border border-white/10 bg-black"
      style={{ aspectRatio: `${SLIDE_W} / ${SLIDE_H}`, maxWidth: 420 }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Slide preview" className="h-full w-full object-contain" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white/60" />
        </div>
      )}
    </div>
  );
}
