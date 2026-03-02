"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Square } from "lucide-react";

interface MusicPlayerProps {
  url: unknown;
}

/**
 * Extracts a YouTube video ID from various URL formats.
 */
function parseYouTubeId(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;

  const url = raw.trim();
  if (!url) return null;

  const watchMatch = url.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  );
  if (watchMatch) return watchMatch[1];

  const shortMatch = url.match(
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/
  );
  if (shortMatch) return shortMatch[1];

  const embedMatch = url.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  );
  if (embedMatch) return embedMatch[1];

  return null;
}

export function MusicPlayer({ url }: MusicPlayerProps) {
  const videoId = useMemo(() => parseYouTubeId(url), [url]);
  const [playing, setPlaying] = useState(false);

  if (!videoId) return null;

  // YouTube embed URL — autoplay + loop, no related videos
  const embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&rel=0&modestbranding=1&playsinline=1`;

  return (
    <div className="relative mt-3">
      <AnimatePresence mode="wait">
        {!playing ? (
          /* ── Idle: compact play bar ── */
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 shrink-0">
              <Music className="h-4 w-4 text-purple-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">
                Theme Song
              </p>
              <p className="text-xs text-white/40">Click play to listen</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setPlaying(true)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-500/30 border border-purple-500/40 hover:bg-purple-500/50 transition-colors"
            >
              <Play className="h-4 w-4 text-purple-300 ml-0.5" />
            </motion.button>
          </motion.div>
        ) : (
          /* ── Playing: compact YouTube player ── */
          <motion.div
            key="playing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
          >
            {/* Header with stop button */}
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 shrink-0">
                <Music className="h-3.5 w-3.5 text-purple-400" />
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-lg bg-purple-500/30"
                />
              </div>

              <p className="flex-1 text-sm font-medium text-white/80 truncate">
                Theme Song
              </p>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setPlaying(false)}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 hover:bg-red-500/40 transition-colors"
                title="Stop"
              >
                <Square className="h-2.5 w-2.5 text-red-400" />
              </motion.button>
            </div>

            {/* YouTube embed — compact player with full controls visible */}
            <div className="w-full aspect-video max-h-[200px]">
              <iframe
                width="100%"
                height="100%"
                src={embedSrc}
                title="Profile theme song"
                allow="autoplay; encrypted-media"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: "none" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
