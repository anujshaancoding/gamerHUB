"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const EMOJI_CATEGORIES = {
  gaming: {
    label: "Gaming",
    emojis: ["🎮", "🕹️", "👾", "🏆", "⚔️", "🎯", "🔫", "💣", "🛡️", "🗡️", "🏅", "🎪", "🚀", "💥", "⚡"],
  },
  reactions: {
    label: "Reactions",
    emojis: ["🔥", "💯", "👏", "🙌", "💪", "🤝", "👊", "✌️", "🫡", "🤯", "😤", "💀", "☠️", "🥶", "🤡"],
  },
  faces: {
    label: "Faces",
    emojis: ["😂", "🤣", "😎", "🥳", "😏", "🤔", "😱", "😈", "👀", "❤️", "💚", "💙", "😭", "🥲", "😴"],
  },
  gg: {
    label: "GG",
    emojis: ["🏁", "🎉", "🎊", "✅", "❌", "⭐", "💎", "👑", "🐐", "🦅", "🐍", "🐉", "🔰", "♻️", "🆙"],
  },
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("gaming");

  const categories = Object.entries(EMOJI_CATEGORIES);

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-text-muted hover:text-primary transition-colors"
        title="Emoji"
      >
        <Smile className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-0 z-50 w-72 bg-surface/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl overflow-hidden"
            >
              {/* Category tabs */}
              <div className="flex border-b border-border/30">
                {categories.map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={cn(
                      "flex-1 px-2 py-2 text-xs font-medium transition-all",
                      activeCategory === key
                        ? "text-primary border-b-2 border-primary bg-primary/5"
                        : "text-text-muted hover:text-text hover:bg-surface-light/50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Emoji grid */}
              <div className="p-2 grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
                {EMOJI_CATEGORIES[
                  activeCategory as keyof typeof EMOJI_CATEGORIES
                ].emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onSelect(emoji);
                      setIsOpen(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-primary/10 hover:scale-110 transition-all"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact reaction picker (inline, for message reactions)
interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

const QUICK_REACTIONS = ["🔥", "💯", "😂", "👏", "💀", "❤️", "🎮", "⚔️"];

export function ReactionPicker({ onSelect }: ReactionPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex gap-0.5 p-1 bg-surface/95 backdrop-blur-xl border border-border/50 rounded-full shadow-lg"
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="w-7 h-7 flex items-center justify-center text-sm rounded-full hover:bg-primary/10 hover:scale-125 transition-all"
        >
          {emoji}
        </button>
      ))}
    </motion.div>
  );
}
