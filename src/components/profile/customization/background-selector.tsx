"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Ban } from "lucide-react";
import { PROFILE_BACKGROUNDS } from "@/lib/constants/profile-backgrounds";

interface BackgroundSelectorProps {
  value: string | null;
  onChange: (bgId: string | null) => void;
}

/** Mini CSS animation previews for each background type */
const previewAnimations: Record<string, React.CSSProperties> = {
  "bg-anim-cyberpunk-grid": {
    background:
      "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,255,255,0.3) 4px, rgba(0,255,255,0.3) 5px), repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,255,255,0.15) 4px, rgba(0,255,255,0.15) 5px)",
    animation: "preview-grid 2s linear infinite",
  },
  "bg-anim-starfield": {
    background:
      "radial-gradient(1px 1px at 20% 30%, white 100%, transparent), radial-gradient(1px 1px at 60% 70%, white 100%, transparent), radial-gradient(1.5px 1.5px at 40% 50%, white 100%, transparent), radial-gradient(1px 1px at 80% 20%, white 100%, transparent)",
    backgroundColor: "#0a0a2a",
    animation: "preview-stars 3s ease-in-out infinite",
  },
  "bg-anim-retro-arcade": {
    background:
      "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,0,255,0.2) 3px, rgba(255,0,255,0.2) 6px)",
    backgroundColor: "#1a0033",
    animation: "preview-arcade 1.5s steps(4) infinite",
  },
  "bg-anim-aurora": {
    background: "linear-gradient(135deg, #0f766e, #7c3aed, #06b6d4, #a855f7)",
    backgroundSize: "300% 300%",
    animation: "preview-aurora 3s ease infinite",
  },
  "bg-anim-neon-waves": {
    background: "linear-gradient(90deg, #06b6d4, #a855f7, #f43f5e, #06b6d4)",
    backgroundSize: "200% 100%",
    animation: "preview-neon-waves 2s ease infinite",
  },
  "bg-anim-geometric": {
    background: "conic-gradient(from 0deg, rgba(99,102,241,0.4), rgba(236,72,153,0.4), rgba(99,102,241,0.4))",
    animation: "preview-geometric 3s linear infinite",
  },
  "bg-anim-smoke": {
    background:
      "radial-gradient(ellipse at 30% 50%, rgba(148,163,184,0.4) 0%, transparent 70%), radial-gradient(ellipse at 70% 50%, rgba(100,116,139,0.3) 0%, transparent 70%)",
    backgroundColor: "#1e293b",
    animation: "preview-smoke 3s ease-in-out infinite alternate",
  },
  "bg-anim-gradient-pulse": {
    background: "linear-gradient(135deg, #6366f1, #ec4899)",
    animation: "preview-pulse 2s ease-in-out infinite",
  },
};

export function BackgroundSelector({ value, onChange }: BackgroundSelectorProps) {
  return (
    <div className="space-y-3">
      {/* Preview animation keyframes */}
      <style>{`
        @keyframes preview-grid {
          0% { background-position: 0 0; }
          100% { background-position: 0 20px; }
        }
        @keyframes preview-stars {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes preview-arcade {
          0% { background-position: 0 0; }
          100% { background-position: 12px 12px; }
        }
        @keyframes preview-aurora {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes preview-neon-waves {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes preview-geometric {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes preview-smoke {
          0% { opacity: 0.4; transform: translateX(-2px); }
          100% { opacity: 0.7; transform: translateX(2px); }
        }
        @keyframes preview-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* None option */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange(null)}
          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
            value === null
              ? "border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
          }`}
        >
          {value === null && (
            <div className="absolute top-2 right-2">
              <Check className="h-4 w-4 text-purple-400" />
            </div>
          )}
          <div className="w-full h-12 rounded-lg bg-gray-800/50 flex items-center justify-center border border-white/5">
            <Ban className="h-5 w-5 text-white/30" />
          </div>
          <span className="text-sm font-semibold text-white/90">None</span>
          <span className="text-xs text-white/50">No background</span>
        </motion.button>

        {/* Background options */}
        {PROFILE_BACKGROUNDS.map((bg) => {
          const isSelected = value === bg.id;
          const preview = previewAnimations[bg.className];

          return (
            <motion.button
              key={bg.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(bg.id)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? "border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 text-purple-400" />
                </div>
              )}

              {bg.premium && (
                <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400">Premium</span>
                </div>
              )}

              {/* Animated preview */}
              <div className="w-full h-12 rounded-lg overflow-hidden relative border border-white/5">
                <div
                  className="absolute inset-0"
                  style={preview}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-base">{bg.icon}</span>
                <span className="text-sm font-semibold text-white/90 truncate">{bg.name}</span>
              </div>
              <span className="text-xs text-white/50 text-center line-clamp-2">{bg.description}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
