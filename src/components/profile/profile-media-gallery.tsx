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
} from "lucide-react";
import { optimizedUpload } from "@/lib/upload";

// Raw clips are accepted as-is and compressed server-side (ffmpeg), so this
// guard only blocks genuinely huge files. Keep in sync with MAX_FILE_SIZE in
// /api/upload and Nginx's client_max_body_size.
const MAX_VIDEO_MB = 200;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

/**
 * Read an error message from a failed upload response. The body may not be
 * JSON — a 413 from Nginx (request larger than client_max_body_size) returns
 * an HTML error page, so blindly calling res.json() throws "Unexpected token
 * '<'". Handle that gracefully and surface a human-readable message instead.
 */
async function parseUploadError(res: Response): Promise<string> {
  if (res.status === 413) {
    return `That file is too large to upload (max ${MAX_VIDEO_MB}MB). Try trimming the clip or lowering its recording quality.`;
  }
  const text = await res.text().catch(() => "");
  try {
    const json = JSON.parse(text);
    return json.error || "Upload failed";
  } catch {
    return res.status >= 500
      ? "Server error during upload. Please try again."
      : "Upload failed. Please try a different file.";
  }
}

interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  is_public: boolean;
}

interface Props {
  userId: string;
  username: string;
  isOwner: boolean;
}

export function ProfileMediaGallery({ userId, isOwner }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/profile/media?userId=${userId}`);
      const d = await r.json();
      setItems(Array.isArray(d.media) ? d.media : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onPick(file: File) {
    setUploading(true);
    setErr(null);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const isVideo = ["mp4", "webm"].includes(ext);

      let publicUrl: string;
      let thumbnailUrl: string | null = null;
      if (isVideo) {
        // Sanity guard only — the clip is compressed server-side, so we accept
        // big raw uploads. This just blocks absurdly large files up front.
        if (file.size > MAX_VIDEO_BYTES) {
          throw new Error(
            `Clip is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). ` +
              `Max is ${MAX_VIDEO_MB}MB.`,
          );
        }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("path", `media/${userId}/${Date.now()}.${ext}`);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) throw new Error(await parseUploadError(up));
        const upData = await up.json();
        // Server transcodes to .mp4 and returns the compressed URL + a poster.
        publicUrl = upData.publicUrl;
        thumbnailUrl = upData.thumbnailUrl ?? null;
      } else {
        // Images: compress + convert to WebP before upload (large size win,
        // and keeps screenshots well under the proxy body limit).
        const result = await optimizedUpload(file, "media", userId);
        publicUrl = result.publicUrl;
      }

      const res = await fetch("/api/profile/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isVideo ? "video" : "image",
          url: publicUrl,
          thumbnail_url: thumbnailUrl,
          title: file.name.replace(/\.[^.]+$/, "").slice(0, 60),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setItems((prev) => [data.media, ...prev]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this from your showcase?")) return;
    const r = await fetch(`/api/profile/media?id=${id}`, { method: "DELETE" });
    if (r.ok) setItems((prev) => prev.filter((m) => m.id !== id));
  }

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
                if (f) onPick(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              Add screenshot / clip
            </button>
          </>
        )}
      </div>

      {err && (
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
              onClick={() => setLightbox(m)}
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
              {m.title && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="truncate text-xs font-medium text-white">
                    {m.title}
                  </p>
                </div>
              )}
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

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute right-5 top-5 text-white/70 hover:text-white"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              <X className="h-7 w-7" />
            </button>
            <div
              className="max-h-[88vh] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              {lightbox.type === "video" ? (
                <video
                  src={lightbox.url}
                  controls
                  autoPlay
                  className="max-h-[88vh] rounded-lg"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lightbox.url}
                  alt={lightbox.title || "media"}
                  className="max-h-[88vh] rounded-lg object-contain"
                />
              )}
              {lightbox.title && (
                <p className="mt-3 text-center text-sm text-white/80">
                  {lightbox.title}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
