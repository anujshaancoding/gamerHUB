"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface EasterEggConfig {
  type: string;
  message: string;
  animation: string;
}

interface EasterEggListenerProps {
  config: unknown;
}

function parseConfig(raw: unknown): EasterEggConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (
    typeof obj.type !== "string" ||
    typeof obj.message !== "string" ||
    typeof obj.animation !== "string"
  ) {
    return null;
  }
  if (!["konami", "triple_click", "secret_word"].includes(obj.type)) return null;
  if (!["confetti", "fireworks", "glitch", "shake"].includes(obj.animation))
    return null;
  return {
    type: obj.type,
    message: obj.message,
    animation: obj.animation,
  };
}

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const SECRET_WORD = "gglobby";

function ConfettiAnimation() {
  return (
    <>
      {Array.from({ length: 40 }).map((_, i) => (
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
              "#ec4899",
              "#14b8a6",
            ][i % 8],
            left: `${Math.random() * 100}%`,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            y: "100vh",
            opacity: 0,
            rotate: Math.random() * 720 - 360,
            scale: Math.random() * 0.5 + 0.5,
          }}
          transition={{
            duration: 2.5 + Math.random() * 1.5,
            delay: Math.random() * 0.8,
            ease: "easeIn",
          }}
        />
      ))}
    </>
  );
}

function FireworksAnimation() {
  return (
    <>
      {[0, 1, 2].map((burst) => (
        <div key={burst} className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: [
                  "#f43f5e",
                  "#8b5cf6",
                  "#06b6d4",
                  "#eab308",
                ][i % 4],
              }}
              initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
              animate={{
                scale: [0, 2, 0],
                opacity: [1, 1, 0],
                x: Math.cos((i * Math.PI * 2) / 16) * (100 + burst * 40),
                y: Math.sin((i * Math.PI * 2) / 16) * (100 + burst * 40),
              }}
              transition={{
                duration: 1.5,
                delay: burst * 0.3,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      ))}
    </>
  );
}

function GlitchAnimation() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{
        x: [0, -8, 8, -5, 5, -2, 2, 0],
        y: [0, 3, -3, 2, -2, 0],
        filter: [
          "hue-rotate(0deg)",
          "hue-rotate(90deg)",
          "hue-rotate(-90deg)",
          "hue-rotate(180deg)",
          "hue-rotate(-45deg)",
          "hue-rotate(0deg)",
        ],
      }}
      transition={{ duration: 0.8, repeat: 2, ease: "easeInOut" }}
    />
  );
}

function ShakeAnimation() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{
        x: [0, -15, 15, -12, 12, -8, 8, -4, 4, 0],
        y: [0, 5, -5, 3, -3, 0],
      }}
      transition={{ duration: 0.7 }}
    />
  );
}

function TriggeredOverlay({
  config,
  onDismiss,
}: {
  config: EasterEggConfig;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onDismiss}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
    >
      {config.animation === "confetti" && <ConfettiAnimation />}
      {config.animation === "fireworks" && <FireworksAnimation />}
      {config.animation === "glitch" && <GlitchAnimation />}
      {config.animation === "shake" && <ShakeAnimation />}

      <motion.div
        initial={{ scale: 0.3, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.3, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 15, stiffness: 200 }}
        className="relative z-10 max-w-sm rounded-xl border border-primary/50 bg-surface/95 px-8 py-6 shadow-2xl shadow-primary/25 backdrop-blur-md"
      >
        <div className="flex items-center gap-2 mb-3 justify-center">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Easter Egg Found!
          </span>
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
        </div>
        <p className="text-center text-lg font-medium text-text">
          {config.message || "You found a secret!"}
        </p>
        <p className="text-center text-xs text-text-dim mt-2">
          Click or wait to dismiss
        </p>
      </motion.div>
    </motion.div>
  );
}

export function EasterEggListener({ config: rawConfig }: EasterEggListenerProps) {
  const config = parseConfig(rawConfig);
  const [triggered, setTriggered] = useState(false);

  // Konami code tracking
  const konamiIndex = useRef(0);

  // Triple click tracking
  const clickTimes = useRef<number[]>([]);

  // Secret word tracking
  const typedChars = useRef("");

  const handleTrigger = useCallback(() => {
    setTriggered(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setTriggered(false);
    // Reset all trackers
    konamiIndex.current = 0;
    clickTimes.current = [];
    typedChars.current = "";
  }, []);

  useEffect(() => {
    if (!config) return;

    if (config.type === "konami") {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (triggered) return;
        const expected = KONAMI_SEQUENCE[konamiIndex.current];
        if (e.key.toLowerCase() === expected.toLowerCase()) {
          konamiIndex.current++;
          if (konamiIndex.current === KONAMI_SEQUENCE.length) {
            konamiIndex.current = 0;
            handleTrigger();
          }
        } else {
          konamiIndex.current = 0;
          // Check if the first key matches to allow restart
          if (e.key.toLowerCase() === KONAMI_SEQUENCE[0].toLowerCase()) {
            konamiIndex.current = 1;
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }

    if (config.type === "triple_click") {
      const handleClick = () => {
        if (triggered) return;
        const now = Date.now();
        clickTimes.current.push(now);
        // Keep only clicks within last 600ms
        clickTimes.current = clickTimes.current.filter(
          (t) => now - t <= 600
        );
        if (clickTimes.current.length >= 3) {
          clickTimes.current = [];
          handleTrigger();
        }
      };

      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }

    if (config.type === "secret_word") {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (triggered) return;
        typedChars.current += e.key.toLowerCase();
        // Keep buffer trimmed to the length of the secret word
        if (typedChars.current.length > SECRET_WORD.length) {
          typedChars.current = typedChars.current.slice(
            typedChars.current.length - SECRET_WORD.length
          );
        }
        if (typedChars.current === SECRET_WORD) {
          typedChars.current = "";
          handleTrigger();
        }
      };

      window.addEventListener("keypress", handleKeyPress);
      return () => window.removeEventListener("keypress", handleKeyPress);
    }
  }, [config, triggered, handleTrigger]);

  if (!config) return null;

  return (
    <AnimatePresence>
      {triggered && (
        <TriggeredOverlay config={config} onDismiss={handleDismiss} />
      )}
    </AnimatePresence>
  );
}
