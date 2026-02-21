"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Copy, SmilePlus, X, Download } from "lucide-react";
import { Avatar } from "@/components/ui";
import { MessageReactions } from "./message-reactions";
import { ReactionPicker } from "./emoji-picker";
import { cn } from "@/lib/utils";
import type { MessageWithSender, MessageReaction } from "@/lib/hooks/useMessages";

// Message status: sent (server confirmed), read (other user opened chat)
type MessageStatus = "sent" | "read";

function getMessageStatus(
  message: MessageWithSender,
  isOwn: boolean,
  otherLastReadAt: string | null | undefined
): MessageStatus | null {
  if (!isOwn) return null; // Only show status on own messages

  // If the other user's last_read_at >= message created_at, it's read
  if (
    otherLastReadAt &&
    message.created_at &&
    new Date(otherLastReadAt) >= new Date(message.created_at)
  ) {
    return "read";
  }

  // Message exists in DB = sent
  return "sent";
}

function MessageStatusIcon({ status }: { status: MessageStatus }) {
  if (status === "read") {
    // Double check marks (blue) - like WhatsApp read
    return (
      <span className="inline-flex items-center ml-1" title="Read">
        <svg
          width="16"
          height="10"
          viewBox="0 0 16 10"
          fill="none"
          className="text-[#00bfff]"
        >
          <path
            d="M1.5 5.5L4 8L9 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.5 5.5L8 8L13 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  // Single check mark (grey) - sent
  return (
    <span className="inline-flex items-center ml-1" title="Sent">
      <svg
        width="12"
        height="10"
        viewBox="0 0 12 10"
        fill="none"
        className="text-text-muted/60"
      >
        <path
          d="M1.5 5.5L4 8L10 2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  currentUserId: string;
  showAvatar: boolean;
  showName: boolean;
  onReact: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  onDelete: () => void;
  isNew?: boolean;
  otherLastReadAt?: string | null;
}

export function MessageBubble({
  message,
  isOwn,
  currentUserId,
  showAvatar,
  showName,
  onReact,
  onRemoveReaction,
  onDelete,
  isNew = false,
  otherLastReadAt,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const isImage = message.type === "image";

  // Close lightbox on Escape
  useEffect(() => {
    if (!showLightbox) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLightbox(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showLightbox]);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (showLightbox) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showLightbox]);

  const handleDownload = useCallback(async () => {
    try {
      const res = await fetch(message.content);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${message.id}.webp`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(message.content, "_blank");
    }
  }, [message.content, message.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowActions(false);
  };

  const handleReact = (emoji: string) => {
    onReact(emoji);
    setShowReactionPicker(false);
    setShowActions(false);
  };

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 20, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn("flex gap-2 mb-1 group", isOwn ? "flex-row-reverse" : "")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactionPicker(false);
      }}
    >
      {/* Avatar */}
      <div className="w-8 flex-shrink-0">
        {!isOwn && showAvatar && (
          <Avatar
            src={message.sender?.avatar_url}
            alt={message.sender?.username || "User"}
            size="sm"
          />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "max-w-[70%] relative",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {/* Sender name for group chats */}
        {showName && !isOwn && (
          <p className="text-xs text-primary/70 mb-0.5 ml-1 font-medium">
            {message.sender?.display_name || message.sender?.username}
          </p>
        )}

        {/* Bubble */}
        <motion.div
          initial={
            isNew && isOwn
              ? { boxShadow: "0 0 25px rgba(0,255,136,0.3)" }
              : undefined
          }
          animate={{ boxShadow: "0 0 0px rgba(0,255,136,0)" }}
          transition={{ duration: 1 }}
          className={cn(
            "relative px-4 py-2 rounded-2xl transition-shadow",
            isOwn
              ? "bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 rounded-br-sm hover:shadow-[0_0_15px_rgba(0,255,136,0.1)]"
              : "bg-surface-light/80 backdrop-blur-sm border border-border/30 rounded-bl-sm hover:shadow-[0_0_10px_rgba(0,212,255,0.05)]"
          )}
        >
          {isImage ? (
            <button
              type="button"
              onClick={() => setShowLightbox(true)}
              className="rounded-xl overflow-hidden max-w-xs cursor-zoom-in"
            >
              <img
                src={message.content}
                alt="Shared image"
                className="w-full h-auto rounded-lg"
                loading="lazy"
              />
            </button>
          ) : (
            <p
              className={cn(
                "text-sm break-words whitespace-pre-wrap",
                isOwn ? "text-text" : "text-text"
              )}
            >
              {message.content}
            </p>
          )}

          {/* Timestamp + Read receipt */}
          <div
            className={cn(
              "flex items-center gap-0.5 mt-1",
              isOwn ? "justify-end" : "justify-start"
            )}
          >
            <span
              className={cn(
                "text-[10px] opacity-50",
                isOwn ? "text-primary/70" : "text-text-dim"
              )}
            >
              {message.created_at
                ? new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </span>
            {(() => {
              const status = getMessageStatus(message, isOwn, otherLastReadAt);
              return status ? <MessageStatusIcon status={status} /> : null;
            })()}
          </div>
        </motion.div>

        {/* Reactions */}
        <MessageReactions
          reactions={(message.reactions || []) as MessageReaction[]}
          currentUserId={currentUserId}
          onAdd={onReact}
          onRemove={onRemoveReaction}
          isOwn={isOwn}
        />

        {/* Action buttons (hover) */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "absolute -top-8 flex gap-0.5 p-0.5 bg-surface/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-lg z-20",
                isOwn ? "right-0" : "left-10"
              )}
            >
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className="p-1.5 rounded-md hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
                title="React"
              >
                <SmilePlus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-primary/10 text-text-muted hover:text-text transition-colors"
                title="Copy"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              {isOwn && (
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-md hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reaction picker popup */}
        <AnimatePresence>
          {showReactionPicker && (
            <div
              className={cn(
                "absolute -top-16 z-30",
                isOwn ? "right-0" : "left-10"
              )}
            >
              <ReactionPicker onSelect={handleReact} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen image lightbox */}
      {isImage &&
        showLightbox &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
              onClick={() => setShowLightbox(false)}
            >
              {/* Top-right controls */}
              <div
                className="absolute top-4 right-4 flex gap-2 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleDownload}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Download image"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowLightbox(false)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Image */}
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                src={message.content}
                alt="Full size image"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg select-none"
                onClick={(e) => e.stopPropagation()}
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </motion.div>
  );
}
