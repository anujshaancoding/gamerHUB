"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { PROFILE_EFFECTS } from "@/lib/constants/profile-effects";

interface EffectSelectorProps {
  value: string | null;
  onChange: (effectId: string | null) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function EffectSelector({ value, onChange }: EffectSelectorProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
    >
      {/* None option */}
      <motion.button
        variants={item}
        type="button"
        onClick={() => onChange(null)}
        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
          value === null
            ? "border-primary ring-2 ring-primary/30 bg-primary/10"
            : "border-border hover:border-primary/50"
        }`}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-light">
          <Sparkles className="w-5 h-5 text-text-muted" />
        </div>
        <span className="text-xs font-medium text-text-muted">None</span>
        {value === null && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </motion.button>

      {/* Effect cards */}
      {PROFILE_EFFECTS.map((effect) => {
        const isSelected = value === effect.id;

        return (
          <motion.button
            key={effect.id}
            variants={item}
            type="button"
            onClick={() => onChange(effect.id)}
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
              isSelected
                ? "border-primary ring-2 ring-primary/30 bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="text-2xl leading-none">{effect.icon}</div>
            <span className="text-xs font-medium text-text truncate w-full text-center">
              {effect.name}
            </span>
            <span className="text-[10px] text-text-muted text-center line-clamp-2 leading-tight">
              {effect.description}
            </span>

            {isSelected && (
              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
