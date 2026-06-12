"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/ui";
import type { Profile } from "@/types/database";

interface TypingIndicatorProps {
  users: Profile[];
  currentUserId: string;
}

export function TypingIndicator({ users, currentUserId }: TypingIndicatorProps) {
  const typingOthers = users.filter((u) => u.id !== currentUserId);
  if (typingOthers.length === 0) return null;

  const typingUser = typingOthers[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-1"
    >
      <Avatar
        src={typingUser.avatar_url}
        alt={typingUser.username || "User"}
        size="xs"
      />
      <div className="flex gap-1 px-3 py-2 bg-surface-light/60 backdrop-blur-sm rounded-full border border-border/20">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{
              y: [0, -5, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span className="text-xs text-text-muted">
        {typingOthers.length === 1
          ? `${typingUser.display_name || typingUser.username} is typing`
          : `${typingOthers.length} people are typing`}
      </span>
    </motion.div>
  );
}
