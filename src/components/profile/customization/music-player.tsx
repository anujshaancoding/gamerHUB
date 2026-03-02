"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Pause, Volume2, VolumeX, SkipBack } from "lucide-react";

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

/* ------------------------------------------------------------------ */
/*  YouTube IFrame API loader                                          */
/* ------------------------------------------------------------------ */

let ytApiReady = false;
let ytApiLoading = false;
const ytApiCallbacks: (() => void)[] = [];

function loadYouTubeApi(): Promise<void> {
  if (ytApiReady) return Promise.resolve();

  return new Promise((resolve) => {
    ytApiCallbacks.push(resolve);

    if (ytApiLoading) return;
    ytApiLoading = true;

    (window as unknown as Record<string, unknown>).onYouTubeIframeAPIReady = () => {
      ytApiReady = true;
      ytApiCallbacks.forEach((cb) => cb());
      ytApiCallbacks.length = 0;
    };

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MusicPlayer({ url }: MusicPlayerProps) {
  const videoId = useMemo(() => parseYouTubeId(url), [url]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [ready, setReady] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [title, setTitle] = useState("Theme Song");

  const playerRef = useRef<YT.Player | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Initialize YouTube player ── */
  useEffect(() => {
    if (!videoId) return;

    let destroyed = false;

    async function init() {
      await loadYouTubeApi();
      if (destroyed) return;

      const elementId = `yt-music-${videoId}`;

      playerRef.current = new YT.Player(elementId, {
        videoId,
        height: "40",
        width: "40",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          loop: 1,
          playlist: videoId,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        } as YT.PlayerVars & { origin: string },
        events: {
          onReady: (event: YT.PlayerEvent) => {
            if (destroyed) return;
            const p = event.target;
            p.setVolume(50);
            setReady(true);

            // Duration may not be available immediately
            const dur = p.getDuration();
            if (dur > 0) setDuration(dur);

            // Try to get video title
            try {
              const data = p.getVideoData?.();
              if (data?.title) setTitle(data.title);
            } catch {
              // getVideoData may not be available yet
            }

            // Attempt autoplay
            p.playVideo();
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (destroyed) return;
            const state = event.data;

            if (state === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setAutoplayBlocked(false);
              const dur = event.target.getDuration();
              if (dur > 0) setDuration(dur);

              // Try title again once playing
              try {
                const data = event.target.getVideoData?.();
                if (data?.title) setTitle(data.title);
              } catch {
                // ignore
              }
            } else if (state === YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (state === YT.PlayerState.ENDED) {
              event.target.seekTo(0, true);
              event.target.playVideo();
            } else if (state === YT.PlayerState.UNSTARTED) {
              // Autoplay was likely blocked by browser
              setAutoplayBlocked(true);
              setIsPlaying(false);
            }
          },
        },
      });
    }

    init();

    return () => {
      destroyed = true;
      if (progressInterval.current) clearInterval(progressInterval.current);
      try {
        playerRef.current?.destroy();
      } catch {
        // player may already be destroyed
      }
      playerRef.current = null;
    };
  }, [videoId]);

  /* ── Track progress ── */
  useEffect(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);

    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        try {
          if (playerRef.current?.getCurrentTime) {
            setCurrentTime(playerRef.current.getCurrentTime());
          }
        } catch {
          // player may be destroyed
        }
      }, 500);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying]);

  /* ── Controls ── */
  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (playerRef.current) {
      playerRef.current.setVolume(v);
      if (v === 0) {
        playerRef.current.mute();
        setIsMuted(true);
      } else if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  }, [isMuted]);

  const restart = useCallback(() => {
    playerRef.current?.seekTo(0, true);
    playerRef.current?.playVideo();
  }, []);

  /* ── Helpers ── */
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Don't render anything if no valid YouTube URL
  if (!videoId) return null;

  return (
    <div className="relative mt-3">
      {/* Off-screen YouTube player — audio only, needs real dimensions to load */}
      <div
        className="absolute -left-[9999px] -top-[9999px] w-10 h-10 overflow-hidden"
        aria-hidden="true"
      >
        <div id={`yt-music-${videoId}`} />
      </div>

      {/* Audio control bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
      >
        {/* Music icon with animated pulse when playing */}
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 shrink-0">
          <Music className="h-4 w-4 text-purple-400" />
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-lg bg-purple-500/30"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Title + progress */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80 truncate">{title}</p>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-white/40 tabular-nums w-8 shrink-0">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-purple-500/70 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-[10px] text-white/40 tabular-nums w-8 shrink-0 text-right">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Restart */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={restart}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            title="Restart"
          >
            <SkipBack className="h-3.5 w-3.5 text-white/50" />
          </motion.button>

          {/* Play / Pause */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/30 border border-purple-500/40 hover:bg-purple-500/50 transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5 text-purple-300" />
            ) : (
              <Play className="h-3.5 w-3.5 text-purple-300 ml-0.5" />
            )}
          </motion.button>

          {/* Volume */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-3.5 w-3.5 text-white/50" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-white/50" />
            )}
          </motion.button>

          {/* Volume slider */}
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 accent-purple-500 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            title={`Volume: ${volume}%`}
          />
        </div>
      </motion.div>

      {/* Autoplay blocked hint */}
      <AnimatePresence>
        {autoplayBlocked && !isPlaying && ready && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            onClick={togglePlay}
            className="mt-1.5 w-full text-center text-xs text-purple-400/70 hover:text-purple-400 transition-colors"
          >
            Click to start playing theme song
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
