"use client";

import { cn } from "@/lib/utils";
import type { MessageReaction } from "@/lib/hooks/useMessages";

interface GroupedReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
  userIds: string[];
}

interface MessageReactionsProps {
  reactions: MessageReaction[];
  currentUserId: string;
  onAdd: (emoji: string) => void;
  onRemove: (emoji: string) => void;
  isOwn: boolean;
}

export function MessageReactions({
  reactions,
  currentUserId,
  onAdd,
  onRemove,
  isOwn,
}: MessageReactionsProps) {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by emoji
  const grouped: GroupedReaction[] = [];
  const emojiMap = new Map<string, GroupedReaction>();

  reactions.forEach((r) => {
    const existing = emojiMap.get(r.emoji);
    if (existing) {
      existing.count++;
      existing.userIds.push(r.user_id);
      if (r.user_id === currentUserId) existing.hasReacted = true;
    } else {
      const group: GroupedReaction = {
        emoji: r.emoji,
        count: 1,
        hasReacted: r.user_id === currentUserId,
        userIds: [r.user_id],
      };
      emojiMap.set(r.emoji, group);
      grouped.push(group);
    }
  });

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 mt-1",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {grouped.map(({ emoji, count, hasReacted }) => (
        <button
          key={emoji}
          onClick={() => (hasReacted ? onRemove(emoji) : onAdd(emoji))}
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-all hover:scale-105",
            hasReacted
              ? "bg-primary/20 border-primary/40 text-primary shadow-[0_0_8px_rgba(0,255,136,0.15)]"
              : "bg-surface-light/50 border-border/30 text-text-muted hover:border-primary/30"
          )}
        >
          <span className="text-sm">{emoji}</span>
          <span className="font-medium">{count}</span>
        </button>
      ))}
    </div>
  );
}
