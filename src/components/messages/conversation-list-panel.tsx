"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Edit2, MessageCircle, Gamepad2, Ghost } from "lucide-react";
import { Input, Avatar } from "@/components/ui";
import { usePresence } from "@/lib/presence/PresenceProvider";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ConversationWithDetails } from "@/lib/hooks/useMessages";

interface ConversationListPanelProps {
  conversations: ConversationWithDetails[];
  voidConversations?: ConversationWithDetails[];
  selectedId?: string;
  currentUserId: string;
  loading?: boolean;
  onNewConversation: () => void;
  voidUnreadCount?: number;
}

export function ConversationListPanel({
  conversations,
  voidConversations = [],
  selectedId,
  currentUserId,
  loading,
  onNewConversation,
  voidUnreadCount = 0,
}: ConversationListPanelProps) {
  const { getUserStatus } = usePresence();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"inbox" | "void">("inbox");

  const displayConversations =
    activeTab === "inbox" ? conversations : voidConversations;

  const inboxUnreadCount = conversations.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0
  );

  const filtered = displayConversations.filter((conv) => {
    if (!search.trim()) return true;
    const otherUser = conv.participants.find(
      (p) => p.user_id !== currentUserId
    )?.user;
    if (!otherUser) return false;
    const q = search.toLowerCase();
    return (
      otherUser.username?.toLowerCase().includes(q) ||
      otherUser.display_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full lg:w-80 flex flex-col h-full bg-surface/60 backdrop-blur-xl lg:border-r border-border/30">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-text">Messages</h2>
          </div>
          <button
            onClick={onNewConversation}
            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[0_0_12px_rgba(0,255,136,0.15)] transition-all"
            title="New conversation"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>

        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="bg-surface-light/50"
        />
      </div>

      {/* Inbox / The Void tabs */}
      <div className="flex border-b border-border/30">
        <button
          onClick={() => setActiveTab("inbox")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium transition-colors relative flex items-center justify-center gap-1.5",
            activeTab === "inbox"
              ? "text-primary"
              : "text-text-muted hover:text-text-secondary"
          )}
        >
          Inbox
          {inboxUnreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded-full font-semibold">
              {inboxUnreadCount}
            </span>
          )}
          {activeTab === "inbox" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("void")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium transition-colors relative flex items-center justify-center gap-1.5",
            activeTab === "void"
              ? "text-purple-400"
              : "text-text-muted hover:text-text-secondary"
          )}
        >
          <Ghost className="h-3.5 w-3.5" />
          The Void
          {voidUnreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded-full font-semibold">
              {voidUnreadCount}
            </span>
          )}
          {activeTab === "void" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
          )}
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-surface-light" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-surface-light rounded mb-2" />
                  <div className="h-3 w-40 bg-surface-light rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            {activeTab === "void" ? (
              <>
                <div className="p-4 rounded-full bg-purple-500/5 mb-4">
                  <Ghost className="h-10 w-10 text-purple-400/40" />
                </div>
                <p className="text-text-muted text-sm">
                  {search ? "No conversations found" : "The Void is empty"}
                </p>
                <p className="text-text-dim text-xs mt-1">
                  {!search && "Messages from non-friends appear here"}
                </p>
              </>
            ) : (
              <>
                <div className="p-4 rounded-full bg-primary/5 mb-4">
                  <Gamepad2 className="h-10 w-10 text-primary/40" />
                </div>
                <p className="text-text-muted text-sm">
                  {search
                    ? "No conversations found"
                    : "No conversations yet"}
                </p>
                <p className="text-text-dim text-xs mt-1">
                  {!search && "Start chatting with a friend!"}
                </p>
              </>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((conv) => {
              const otherUser = conv.participants.find(
                (p) => p.user_id !== currentUserId
              )?.user;
              const isSelected = selectedId === conv.id;
              const hasUnread = (conv.unread_count || 0) > 0;

              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  layout
                >
                  <Link href={`/messages/${conv.id}`}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-l-2",
                        isSelected
                          ? activeTab === "void"
                            ? "bg-purple-500/10 border-purple-500 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]"
                            : "bg-primary/10 border-primary shadow-[inset_0_0_20px_rgba(0,255,136,0.05)]"
                          : "border-transparent hover:bg-surface-light/40 hover:border-border/30",
                        hasUnread && !isSelected && (activeTab === "void" ? "bg-purple-500/5" : "bg-primary/5")
                      )}
                    >
                      <div className="relative">
                        <Avatar
                          src={otherUser?.avatar_url}
                          alt={
                            otherUser?.display_name ||
                            otherUser?.username ||
                            "User"
                          }
                          size="md"
                          status={
                            otherUser?.id ? getUserStatus(otherUser.id) : "offline"
                          }
                          showStatus
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "font-medium truncate text-sm",
                              hasUnread ? "text-text" : "text-text-secondary"
                            )}
                          >
                            {conv.type === "group"
                              ? conv.name || "Group Chat"
                              : otherUser?.display_name ||
                                otherUser?.username ||
                                "Unknown"}
                          </span>
                          {conv.last_message?.created_at && (
                            <span className="text-[10px] text-text-muted flex-shrink-0 ml-2">
                              {formatRelativeTime(
                                conv.last_message.created_at
                              )}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-0.5">
                          <p
                            className={cn(
                              "text-xs truncate",
                              hasUnread
                                ? "text-text-secondary font-medium"
                                : "text-text-muted"
                            )}
                          >
                            {conv.last_message?.type === "image"
                              ? "📷 Photo"
                              : conv.last_message?.content ||
                                "No messages yet"}
                          </p>
                          {hasUnread && (
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full flex-shrink-0 ml-2 animate-pulse",
                                activeTab === "void"
                                  ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                                  : "bg-primary shadow-[0_0_8px_rgba(0,255,136,0.5)]"
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
