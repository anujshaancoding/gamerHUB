"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Minus, X, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { PremiumBadge } from "@/components/premium";
import {
  useConversationMessages,
  createConversation,
} from "@/lib/hooks/useMessages";
import { useAuth } from "@/lib/hooks/useAuth";

interface MiniChatFriend {
  id: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  status: string;
  username?: string;
  isPremium?: boolean;
}

interface MiniChatBoxProps {
  friend: MiniChatFriend;
  minimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
}

export function MiniChatBox({
  friend,
  minimized,
  onToggleMinimize,
  onClose,
}: MiniChatBoxProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading, sendMessage } =
    useConversationMessages(conversationId);

  // Create or find conversation on mount
  useEffect(() => {
    if (!user || !friend.id) return;

    setCreating(true);
    createConversation(friend.id)
      .then((id) => setConversationId(id))
      .catch((err) => console.error("Failed to create conversation:", err))
      .finally(() => setCreating(false));
  }, [user, friend.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !conversationId) return;
    const content = inputValue.trim();
    setInputValue("");
    try {
      await sendMessage(content);
    } catch (err) {
      console.error("Failed to send:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className={`flex flex-col bg-surface border border-border shadow-xl overflow-hidden ${
        minimized
          ? "w-[200px] rounded-t-lg"
          : "fixed inset-0 z-[60] sm:static sm:inset-auto sm:z-auto sm:w-[280px] sm:max-h-[400px] sm:rounded-t-lg"
      }`}
    >
      {/* Chat Header */}
      <div
        className="flex items-center gap-2 p-3 bg-surface-light border-b border-border cursor-pointer"
        onClick={onToggleMinimize}
      >
        <div
          className="relative cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (friend.username) router.push(`/profile/${friend.username}`);
          }}
        >
          {friend.avatarUrl ? (
            <Avatar src={friend.avatarUrl} alt={friend.name} size="sm" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
              {friend.avatar}
            </div>
          )}
          <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-success fill-success" />
        </div>
        <div className="flex-1 min-w-0">
          <span
            className="text-sm font-medium text-text truncate flex items-center gap-1 cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              if (friend.username) router.push(`/profile/${friend.username}`);
            }}
          >
            {friend.name}
            {friend.isPremium && (
              <PremiumBadge size="sm" showLabel={false} animate={false} />
            )}
          </span>
          <p className="text-xs text-text-muted truncate">{friend.status}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize();
            }}
            className="p-1 hover:bg-surface rounded transition-colors"
          >
            <Minus className="h-4 w-4 text-text-muted" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-surface rounded transition-colors"
          >
            <X className="h-4 w-4 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Chat Body - Only show when not minimized */}
      {!minimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 min-h-0 h-64 sm:h-64 sm:flex-none p-3 overflow-y-auto bg-background">
            {creating || loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                Start a conversation with {friend.name}
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  const isImage =
                    msg.type === "image" ||
                    (msg.content.startsWith("http") &&
                      msg.content.includes("/media/"));
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-1.5 rounded-xl text-xs ${
                          isOwn
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-surface-light text-text rounded-bl-sm"
                        }`}
                      >
                        {isImage ? (
                          <img
                            src={msg.content}
                            alt="Shared image"
                            className="max-w-full max-h-28 object-cover rounded"
                          />
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-2 border-t border-border bg-surface">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 bg-surface-light border border-border rounded px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || !conversationId}
                className="p-2 bg-primary hover:bg-primary/80 rounded transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
