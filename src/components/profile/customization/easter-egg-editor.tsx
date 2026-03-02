"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Egg,
  Sparkles,
  Play,
  Trash2,
  Keyboard,
  MousePointerClick,
  Type,
} from "lucide-react";

interface EasterEggConfig {
  type: string;
  message: string;
  animation: string;
}

interface EasterEggEditorProps {
  value: EasterEggConfig | null;
  onChange: (config: EasterEggConfig | null) => void;
}

const TRIGGER_TYPES = [
  {
    value: "konami",
    label: "Konami Code",
    icon: Keyboard,
    description: "Up Up Down Down Left Right Left Right B A",
  },
  {
    value: "triple_click",
    label: "Triple-Click",
    icon: MousePointerClick,
    description: "Click anywhere 3 times fast",
  },
  {
    value: "secret_word",
    label: "Secret Word",
    icon: Type,
    description: 'Type "gglobby" anywhere on the page',
  },
] as const;

const ANIMATIONS = [
  { value: "confetti", label: "Confetti" },
  { value: "fireworks", label: "Fireworks" },
  { value: "glitch", label: "Glitch" },
  { value: "shake", label: "Shake" },
] as const;

function PreviewOverlay({
  message,
  animation,
  onDismiss,
}: {
  message: string;
  animation: string;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
    >
      {animation === "confetti" &&
        Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              backgroundColor: [
                "#f43f5e",
                "#8b5cf6",
                "#06b6d4",
                "#eab308",
                "#22c55e",
                "#f97316",
              ][i % 6],
              left: `${Math.random() * 100}%`,
            }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: "100vh",
              opacity: 0,
              rotate: Math.random() * 360,
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: Math.random() * 0.5,
              ease: "easeIn",
            }}
          />
        ))}

      {animation === "fireworks" &&
        Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 rounded-full"
            style={{
              backgroundColor: [
                "#f43f5e",
                "#8b5cf6",
                "#06b6d4",
                "#eab308",
              ][i % 4],
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{
              scale: 3,
              opacity: 0,
              x: Math.cos((i * Math.PI * 2) / 12) * 120,
              y: Math.sin((i * Math.PI * 2) / 12) * 120,
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        ))}

      {animation === "glitch" && (
        <motion.div
          className="absolute inset-0"
          animate={{
            x: [0, -5, 5, -3, 3, 0],
            filter: [
              "hue-rotate(0deg)",
              "hue-rotate(90deg)",
              "hue-rotate(-90deg)",
              "hue-rotate(45deg)",
              "hue-rotate(0deg)",
            ],
          }}
          transition={{ duration: 0.5, repeat: 2 }}
        />
      )}

      {animation === "shake" && (
        <motion.div
          className="absolute inset-0"
          animate={{ x: [0, -10, 10, -8, 8, -4, 4, 0] }}
          transition={{ duration: 0.6 }}
        />
      )}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className="relative z-10 rounded-xl border border-primary/50 bg-surface/95 px-8 py-6 shadow-2xl shadow-primary/20 backdrop-blur-md"
      >
        <div className="flex items-center gap-2 mb-2 justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Easter Egg Found!
          </span>
        </div>
        <p className="text-center text-lg font-medium text-text">
          {message || "You found a secret!"}
        </p>
      </motion.div>
    </motion.div>
  );
}

export function EasterEggEditor({ value, onChange }: EasterEggEditorProps) {
  const [previewing, setPreviewing] = useState(false);

  const current = value ?? { type: "konami", message: "", animation: "confetti" };

  const handleChange = (patch: Partial<EasterEggConfig>) => {
    onChange({ ...current, ...patch });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Trigger type */}
      <div>
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">
          Trigger Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TRIGGER_TYPES.map((trigger) => {
            const Icon = trigger.icon;
            const selected = current.type === trigger.value;
            return (
              <button
                key={trigger.value}
                type="button"
                onClick={() => handleChange({ type: trigger.value })}
                className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left transition-all ${
                  selected
                    ? "border-primary bg-primary/10 text-text"
                    : "border-border hover:border-primary/50 text-text-muted"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {trigger.label}
                  </div>
                  <div className="text-[10px] text-text-dim truncate">
                    {trigger.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
          Message
        </label>
        <div className="relative">
          <input
            type="text"
            value={current.message}
            onChange={(e) =>
              handleChange({ message: e.target.value.slice(0, 100) })
            }
            placeholder="You found a secret!"
            className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none transition-colors"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-dim">
            {current.message.length}/100
          </span>
        </div>
      </div>

      {/* Animation */}
      <div>
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
          Animation
        </label>
        <div className="flex flex-wrap gap-2">
          {ANIMATIONS.map((anim) => {
            const selected = current.animation === anim.value;
            return (
              <button
                key={anim.value}
                type="button"
                onClick={() => handleChange({ animation: anim.value })}
                className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                  selected
                    ? "border-primary bg-primary/10 text-text"
                    : "border-border hover:border-primary/50 text-text-muted"
                }`}
              >
                {anim.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setPreviewing(true);
            setTimeout(() => setPreviewing(false), 3000);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/30 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          Test It
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1.5 rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove Easter Egg
          </button>
        )}
      </div>

      {/* Preview overlay */}
      <AnimatePresence>
        {previewing && (
          <PreviewOverlay
            message={current.message}
            animation={current.animation}
            onDismiss={() => setPreviewing(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
