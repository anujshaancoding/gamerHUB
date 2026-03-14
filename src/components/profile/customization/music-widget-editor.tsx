"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Trash2, AlertCircle, Link2, Youtube } from "lucide-react";

interface MusicWidgetEditorProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

/**
 * Extracts a YouTube video ID from various URL formats.
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
 */
function parseYouTubeId(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  );
  if (watchMatch) return watchMatch[1];

  // youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/
  );
  if (shortMatch) return shortMatch[1];

  // youtube.com/embed/VIDEO_ID
  const embedMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  );
  if (embedMatch) return embedMatch[1];

  return null;
}

export function MusicWidgetEditor({ value, onChange }: MusicWidgetEditorProps) {
  const [inputValue, setInputValue] = useState(value || "");
  const [error, setError] = useState<string | null>(null);

  const videoId = parseYouTubeId(inputValue);
  const hasInput = inputValue.trim().length > 0;

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setError(null);

    if (!newValue.trim()) {
      onChange(null);
      return;
    }

    const id = parseYouTubeId(newValue);
    if (id) {
      onChange(newValue.trim());
    }
  };

  const handleBlur = () => {
    if (hasInput && !videoId) {
      setError("Could not recognize this YouTube URL. Please use a valid youtube.com or youtu.be link.");
    }
  };

  const handleRemove = () => {
    setInputValue("");
    setError(null);
    onChange(null);
  };

  return (
    <div className="space-y-4">
      {/* Input area */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-text/60">
          <Link2 className="h-4 w-4" />
          <span>Paste a YouTube link for your profile theme song</span>
        </div>

        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Youtube className="h-4 w-4 text-red-400" />
          </div>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-light border text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 transition-all ${
              error
                ? "border-error/50 focus:ring-error/30"
                : videoId
                ? "border-success/50 focus:ring-success/30"
                : "border-border focus:ring-primary/30"
            }`}
          />
          {hasInput && (
            <button
              onClick={handleRemove}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-surface-lighter transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 text-text-muted hover:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-xs text-red-300">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YouTube preview */}
      <AnimatePresence>
        {videoId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-text/60">
                <Music className="h-4 w-4 text-primary" />
                <span>Preview</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-border bg-black">
                <iframe
                  width="300"
                  height="170"
                  src={`https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1`}
                  title="YouTube video preview"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full max-w-[300px]"
                  style={{ border: "none" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper text */}
      {!hasInput && (
        <p className="text-xs text-text/30">
          Visitors can click to play your theme song on your profile. Supports youtube.com and youtu.be links.
        </p>
      )}
    </div>
  );
}
