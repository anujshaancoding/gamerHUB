"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  ShieldAlert,
  Flag,
  Loader2,
  ChevronDown,
  Ghost,
  UserPlus,
} from "lucide-react";
import { createClient } from "@/lib/db/client-browser";
import { useRouter } from "next/navigation";
import { Button, Avatar } from "@/components/ui";
import { usePresence } from "@/lib/presence/PresenceProvider";
import { GameWallpaper } from "./game-wallpaper";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { useConversationMessages } from "@/lib/hooks/useMessages";
import { useConversationGames } from "@/lib/hooks/useConversationGames";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCall } from "@/components/call";
import { useFriends } from "@/lib/hooks/useFriends";
import { formatRelativeTime } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface MessageThreadProps {
  conversationId: string;
  conversation?: {
    id: string;
    type: string | null;
    name: string | null;
    participants: {
      user_id: string;
      last_read_at: string | null;
      user: Profile;
    }[];
  };
  isVoid?: boolean;
}

export function MessageThread({
  conversationId,
  conversation,
  isVoid,
}: MessageThreadProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { getUserStatus } = usePresence();
  const { initiateCall, isInCall, isConnecting } = useCall();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const prevMessageCountRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    messages,
    loading,
    sendMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    typingUsers,
    setTyping,
    markAsRead,
    loadMore,
    hasMore,
  } = useConversationMessages(conversationId);

  const otherParticipant = conversation?.participants.find(
    (p) => p.user_id !== user?.id
  );
  const otherUser = otherParticipant?.user;

  // Track the other user's last_read_at for read receipts (WhatsApp-style ticks)
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(
    otherParticipant?.last_read_at || null
  );

  // Update when conversation prop changes
  useEffect(() => {
    setOtherLastReadAt(otherParticipant?.last_read_at || null);
  }, [otherParticipant?.last_read_at]);

  // Realtime: listen for the other participant updating their last_read_at
  useEffect(() => {
    if (!conversationId || !otherParticipant?.user_id) return;
    const db = createClient();

    const channel = db
      .channel(`read-receipts:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Only track the other user's read status
          if (payload.new.user_id === otherParticipant.user_id) {
            setOtherLastReadAt(payload.new.last_read_at);
          }
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [conversationId, otherParticipant?.user_id]);

  const { gameSlugs } = useConversationGames(user?.id, otherUser?.id);
  const { sendFriendRequest } = useFriends({ userId: user?.id });
  const [friendRequestSent, setFriendRequestSent] = useState(false);

  const handleAddFriend = async () => {
    if (!otherUser?.id) return;
    try {
      await sendFriendRequest(otherUser.id);
      setFriendRequestSent(true);
    } catch (err) {
      console.error("Failed to send friend request:", err);
    }
  };

  // Track new messages for animation
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const newMsgs = messages.slice(prevMessageCountRef.current);
      setNewMessageIds((prev) => {
        const next = new Set(prev);
        newMsgs.forEach((m) => next.add(m.id));
        return next;
      });
      // Clear animation flag after animation completes
      setTimeout(() => {
        setNewMessageIds(new Set());
      }, 500);
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // Scroll to bottom on new messages (only if user hasn't manually scrolled)
  useEffect(() => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isUserScrolling]);

  // Mark as read when viewing conversation or when new messages arrive
  useEffect(() => {
    if (messages.length === 0) return;

    // Mark as read when:
    // 1. First opening the conversation
    // 2. New messages arrive while viewing
    const timer = setTimeout(() => {
      markAsRead();
    }, 500); // Debounce to avoid excessive calls

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]); // markAsRead is stable (only depends on conversationId)

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll-based load more and scroll button visibility
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Load more messages when near top
    if (hasMore && container.scrollTop < 100) {
      loadMore();
    }

    // Check if user is near the bottom
    const threshold = 100;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;

    setShowScrollButton(!isNearBottom);

    // Mark as user scrolling if not at bottom
    if (!isNearBottom) {
      setIsUserScrolling(true);
      // Clear any existing timeout
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    } else {
      // Reset user scrolling state when at bottom
      setIsUserScrolling(false);
    }
  }, [hasMore, loadMore]);

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (profile) {
        setTyping(isTyping, profile as Profile);
      }
    },
    [setTyping, profile]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsUserScrolling(false);
    setShowScrollButton(false);
  };

  const handleVoiceCall = async () => {
    if (isInCall || isConnecting) return;
    try {
      await initiateCall(conversationId, "voice");
    } catch (err) {
      console.error("Voice call error:", err);
    }
  };

  const handleVideoCall = async () => {
    if (isInCall || isConnecting) return;
    try {
      await initiateCall(conversationId, "video");
    } catch (err) {
      console.error("Video call error:", err);
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: typeof messages }[] = [];
  let currentDate = "";
  messages.forEach((msg) => {
    const date = msg.created_at
      ? new Date(msg.created_at).toLocaleDateString()
      : "Unknown";
    if (date !== currentDate) {
      currentDate = date;
      groupedMessages.push({ date, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  const today = new Date().toLocaleDateString();
  const yesterday = new Date(
    Date.now() - 86400000
  ).toLocaleDateString();

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 bg-surface/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/messages")}
            className="lg:hidden text-text-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Avatar
            src={otherUser?.avatar_url}
            alt={otherUser?.display_name || otherUser?.username || "User"}
            size="md"
            status={otherUser?.id ? getUserStatus(otherUser.id) : "offline"}
            showStatus
          />

          <div>
            <h3 className="font-semibold text-text text-sm">
              {conversation?.type === "group"
                ? conversation.name || "Group Chat"
                : otherUser?.display_name || otherUser?.username || "User"}
            </h3>
            <p className="text-xs text-text-muted">
              {(() => {
                const status = otherUser?.id ? getUserStatus(otherUser.id) : "offline";
                if (status === "online") return "Online";
                if (status === "away") return "Away";
                if (status === "dnd") return "Do Not Disturb";
                return otherUser?.last_seen
                  ? `Last seen ${formatRelativeTime(otherUser.last_seen)}`
                  : "Offline";
              })()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* TODO: Voice and Video calls - to be integrated later */}
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceCall}
            disabled={isInCall || isConnecting}
            className="text-text-muted hover:text-primary"
            title="Voice call"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVideoCall}
            disabled={isInCall || isConnecting}
            className="text-text-muted hover:text-accent"
            title="Video call"
          >
            <Video className="h-4 w-4" />
          </Button> */}

          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
              className="text-text-muted"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute right-0 mt-1 w-48 bg-surface/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl py-1 z-50"
                >
                  <button
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-text-secondary hover:text-error hover:bg-error/5 transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Block User
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-text-secondary hover:text-warning hover:bg-warning/5 transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Flag className="h-4 w-4" />
                    Report User
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* The Void banner for non-friend conversations */}
      {isVoid && (
        <div className="relative z-20 px-4 py-3 bg-purple-500/10 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ghost className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-purple-300">
              This message is from someone not on your friends list
            </span>
          </div>
          {!friendRequestSent ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddFriend}
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Friend
            </Button>
          ) : (
            <span className="text-xs text-purple-400/70">Request sent</span>
          )}
        </div>
      )}

      {/* Messages area with wallpaper */}
      <div className="flex-1 relative overflow-hidden">
        {/* Game wallpaper background */}
        <GameWallpaper gameSlugs={gameSlugs} />

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-6 right-6 z-30"
            >
              <Button
                variant="primary"
                size="icon"
                onClick={scrollToBottom}
                className="rounded-full shadow-lg bg-primary/90 hover:bg-primary backdrop-blur-sm"
                title="Scroll to bottom"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages scroll area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="absolute inset-0 z-20 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent"
        >
          {/* Load more indicator */}
          {hasMore && (
            <div className="flex justify-center py-4">
              <button
                onClick={loadMore}
                className="text-xs text-text-muted hover:text-primary transition-colors"
              >
                Load older messages
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-text-muted">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Avatar
                  src={otherUser?.avatar_url}
                  alt={otherUser?.display_name || "User"}
                  size="xl"
                  className="mx-auto mb-4"
                  frameStyle="epic"
                />
                <p className="text-text-secondary font-medium">
                  Start a conversation with{" "}
                  <span className="text-primary">
                    {otherUser?.display_name || otherUser?.username}
                  </span>
                </p>
                <p className="text-text-muted text-xs mt-1">
                  Say hello and start gaming together!
                </p>
              </div>
            </div>
          ) : (
            <>
              {groupedMessages.map(({ date, messages: dateMessages }) => (
                <div key={date}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-4">
                    <div className="h-px flex-1 bg-border/20" />
                    <span className="px-3 py-1 bg-surface/80 backdrop-blur-sm rounded-full text-[10px] text-text-muted border border-border/20 mx-3">
                      {date === today
                        ? "Today"
                        : date === yesterday
                        ? "Yesterday"
                        : date}
                    </span>
                    <div className="h-px flex-1 bg-border/20" />
                  </div>

                  {/* Messages */}
                  {dateMessages.map((msg, idx) => {
                    const prevMsg = idx > 0 ? dateMessages[idx - 1] : null;
                    const showAvatar =
                      !prevMsg || prevMsg.sender_id !== msg.sender_id;
                    const showName = showAvatar;

                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.sender_id === user?.id}
                        currentUserId={user?.id || ""}
                        showAvatar={showAvatar}
                        showName={showName}
                        onReact={(emoji) => addReaction(msg.id, emoji)}
                        onRemoveReaction={(emoji) =>
                          removeReaction(msg.id, emoji)
                        }
                        onDelete={() => deleteMessage(msg.id)}
                        isNew={newMessageIds.has(msg.id)}
                        otherLastReadAt={otherLastReadAt}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {typingUsers.length > 0 && (
                  <TypingIndicator
                    users={typingUsers}
                    currentUserId={user?.id || ""}
                  />
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="relative z-20">
        <MessageInput
          onSend={sendMessage}
          onTyping={handleTyping}
          disabled={!user}
          currentUserId={user?.id || ""}
        />
      </div>
    </div>
  );
}
