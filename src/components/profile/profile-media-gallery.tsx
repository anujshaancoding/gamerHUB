"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImagePlus,
  Trash2,
  Play,
  X,
  Loader2,
  Images,
  Heart,
  MessageCircle,
} from "lucide-react";
import { optimizedUpload } from "@/lib/upload";
import { storagePathFromUrl } from "@/lib/storage";
import { MediaLightbox, type MediaItem } from "./media-lightbox";

// Raw clips are accepted as-is and compressed server-side (ffmpeg), so this
// guard only blocks genuinely huge files. Keep in sync with MAX_FILE_SIZE in
// /api/upload and Nginx's client_max_body_size.
const MAX_VIDEO_MB = 200;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

// Per-user showcase cap — must match MEDIA_LIMIT in /api/profile/media.
const MEDIA_LIMIT = 100;

/** Best-effort delete of an already-uploaded file when the DB save fails. */
async function cleanupOrphan(...urls: (string | null | undefined)[]) {
  for (const url of urls) {
    const path = url ? storagePathFromUrl(url) : null;
    if (!path) continue;
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  }
}

interface UploadResponse {
  publicUrl: string;
  thumbnailUrl?: string | null;
}

/**
 * Upload a file to /api/upload with real progress reporting. fetch() can't
 * report upload progress, so we use XMLHttpRequest. The promise resolves once
 * the server responds — for videos that's *after* server-side transcoding, so
 * the caller switches to a "processing" state when bytes hit 100%.
 */
function uploadWithProgress(
  file: File,
  path: string,
  onProgress: (pct: number) => void,
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("path", path);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Upload succeeded but the response was invalid."));
        }
        return;
      }
      // Non-2xx: try to extract a JSON error, else map common statuses.
      let message = "Upload failed. Please try a different file.";
      if (xhr.status === 413) {
        message = `That file is too large to upload (max ${MAX_VIDEO_MB}MB).`;
      } else {
        try {
          message = JSON.parse(xhr.responseText).error || message;
        } catch {
          if (xhr.status >= 500) message = "Server error during upload. Please try again.";
        }
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(fd);
  });
}

interface Props {
  userId: string;
  username: string;
  isOwner: boolean;
  /** The currently signed-in viewer (null if logged out) — enables like/comment. */
  viewerId: string | null;
}

interface Pending {
  file: File;
  previewUrl: string;
  isVideo: boolean;
  title: string;
}

export function ProfileMediaGallery({ userId, isOwner, viewerId }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Upload composer state
  const [pending, setPending] = useState<Pending | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"uploading" | "processing" | "saving">("uploading");

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/profile/media?userId=${userId}`);
      const d = await r.json();
      const media = Array.isArray(d.media) ? d.media : [];
      setItems(media);
      setTotal(typeof d.total === "number" ? d.total : media.length);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  function pickFile(file: File) {
    setErr(null);
    if (total >= MEDIA_LIMIT) {
      setErr(
        `You've reached the ${MEDIA_LIMIT}-item showcase limit. Delete something to add more.`,
      );
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const isVideo = ["mp4", "webm"].includes(ext);
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      setErr(
        `Clip is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is ${MAX_VIDEO_MB}MB.`,
      );
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setPending({
      file,
      previewUrl: URL.createObjectURL(file),
      isVideo,
      title: file.name.replace(/\.[^.]+$/, "").slice(0, 60),
    });
  }

  function cancelUpload() {
    if (pending) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function confirmUpload() {
    if (!pending) return;
    const { file, isVideo, title } = pending;
    setUploading(true);
    setErr(null);
    setProgress(0);
    setPhase("uploading");
    try {
      let publicUrl: string;
      let thumbnailUrl: string | null = null;

      if (isVideo) {
        const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
        const res = await uploadWithProgress(
          file,
          `media/${userId}/${Date.now()}.${ext}`,
          (pct) => {
            setProgress(pct);
            // Bytes are up — the server is now transcoding before it responds.
            if (pct >= 100) setPhase("processing");
          },
        );
        publicUrl = res.publicUrl;
        thumbnailUrl = res.thumbnailUrl ?? null;
      } else {
        // Images compress to ~1MB and upload fast; show an indeterminate state.
        setPhase("processing");
        const result = await optimizedUpload(file, "media", userId);
        publicUrl = result.publicUrl;
      }

      setPhase("saving");
      const res = await fetch("/api/profile/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isVideo ? "video" : "image",
          url: publicUrl,
          thumbnail_url: thumbnailUrl,
          title: title.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // The file is already on disk but the DB record failed — remove it so
        // it doesn't orphan.
        await cleanupOrphan(publicUrl, thumbnailUrl);
        throw new Error(data.error || "Save failed");
      }

      // New items start with zero social counts.
      setItems((prev) => [
        { ...data.media, like_count: 0, comment_count: 0, liked_by_me: false },
        ...prev,
      ]);
      setTotal((t) => t + 1);
      cancelUpload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this from your showcase?")) return;
    const r = await fetch(`/api/profile/media?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      setItems((prev) => prev.filter((m) => m.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      if (lightboxId === id) setLightboxId(null);
    }
  }

  const updateItem = useCallback((id: string, patch: Partial<MediaItem>) => {
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const lightboxItem = items.find((m) => m.id === lightboxId) || null;

  const uploadLabel =
    phase === "uploading"
      ? `Uploading… ${progress}%`
      : phase === "processing"
        ? pending?.isVideo
          ? "Compressing video…"
          : "Processing…"
        : "Saving…";

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Images className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-text">Showcase</h2>
          <span className="text-sm text-text-dim">({items.length})</span>
        </div>
        {isOwner && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pickFile(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || !!pending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              <ImagePlus className="h-4 w-4" />
              Add screenshot / clip
            </button>
          </>
        )}
      </div>

      {err && !pending && (
        <p className="mb-4 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {err}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-video animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/50 py-12 text-center">
          <Images className="mx-auto h-10 w-10 text-text-dim" />
          <p className="mt-3 font-semibold text-text">
            {isOwner ? "Show off your best moments" : "Nothing here yet"}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {isOwner
              ? "Upload clutch clips, score screens, skin collections and GIFs."
              : "This player hasn't added showcase media yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl border border-border bg-surface"
              onClick={() => setLightboxId(m.id)}
            >
              {m.type === "video" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.thumbnail_url || ""}
                    alt={m.title || "clip"}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play className="h-9 w-9 text-white" />
                  </div>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.url}
                  alt={m.title || "screenshot"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              )}

              {/* Bottom gradient: title + like/comment counts */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                {m.title && (
                  <p className="truncate text-xs font-medium text-white">{m.title}</p>
                )}
                <div className="mt-0.5 flex items-center gap-3 text-[11px] font-medium text-white/90">
                  <span className="inline-flex items-center gap-1">
                    <Heart
                      className={`h-3.5 w-3.5 ${m.liked_by_me ? "fill-error text-error" : ""}`}
                    />
                    {m.like_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {m.comment_count}
                  </span>
                </div>
              </div>

              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(m.id);
                  }}
                  className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-error group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload composer */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
            onClick={() => !uploading && cancelUpload()}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-border bg-surface p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-text">Add to showcase</h3>
                {!uploading && (
                  <button
                    onClick={cancelUpload}
                    className="text-text-dim hover:text-text"
                    aria-label="Cancel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="mb-4 overflow-hidden rounded-xl border border-border bg-black">
                {pending.isVideo ? (
                  <video
                    src={pending.previewUrl}
                    controls
                    className="max-h-56 w-full object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pending.previewUrl}
                    alt="preview"
                    className="max-h-56 w-full object-contain"
                  />
                )}
              </div>

              <label className="mb-1.5 block text-sm font-medium text-text-muted">
                Title
              </label>
              <input
                value={pending.title}
                onChange={(e) =>
                  setPending((p) => (p ? { ...p, title: e.target.value } : p))
                }
                maxLength={120}
                disabled={uploading}
                placeholder="Give it a title…"
                className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none disabled:opacity-60"
              />

              {err && (
                <p className="mb-3 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                  {err}
                </p>
              )}

              {uploading ? (
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-text-muted">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {uploadLabel}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full bg-primary transition-all duration-200 ${
                        phase !== "uploading" ? "animate-pulse" : ""
                      }`}
                      style={{
                        width: phase === "uploading" ? `${progress}%` : "100%",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelUpload}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-muted hover:bg-surface"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmUpload}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-primary-dark"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Upload
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox with likes + comments */}
      <AnimatePresence>
        {lightboxItem && (
          <MediaLightbox
            item={lightboxItem}
            viewerId={viewerId}
            isOwner={isOwner}
            onClose={() => setLightboxId(null)}
            onLikeChange={(id, liked, likeCount) =>
              updateItem(id, { liked_by_me: liked, like_count: likeCount })
            }
            onCommentCountChange={(id, count) => updateItem(id, { comment_count: count })}
            onTitleChange={(id, title) => updateItem(id, { title })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
