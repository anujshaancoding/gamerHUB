"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ChevronLeft,
  MoreVertical,
  Phone,
  Video,
  ChevronDown,
} from "lucide-react";
import { Button, Input, Avatar, Card } from "@/components/ui";
import { usePresence } from "@/lib/presence/PresenceProvider";
import { createClient } from "@/lib/db/client-browser";
import { formatRelativeTime } from "@/lib/utils";
import { useCall } from "@/components/call";
import type { Conversation, Profile, Message } from "@/types/database";

interface ConversationWithDetails extends Conversation {
  participants: {
    user: Profile;
    last_read_at: string | null;
  }[];
  messages: Message[];
}

interface ChatWindowProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
  onBack: () => void;
}

interface MessageWithSender extends Message {
  sender?: Profile;
}

export function ChatWindow({
  conversation,
  currentUserId,
  onBack,
}: ChatWindowProps) {
  const db = createClient();
  const { getUserStatus } = usePresence();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { initiateCall, isInCall, isConnecting } = useCall();

  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const otherParticipant = conversation.participants.find(
    (p) => p.user?.id !== currentUserId
  );
  const otherUser = otherParticipant?.user;

  // Track the other user's last_read_at for read receipts
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(
    otherParticipant?.last_read_at || null
  );

  // Realtime: listen for read status updates
  useEffect(() => {
    if (!otherParticipant?.user?.id) return;
    const channel = db
      .channel(`read-receipts-chat:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          if (payload.new.user_id === otherParticipant.user?.id) {
            setOtherLastReadAt(payload.new.last_read_at);
          }
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [db, conversation.id, otherParticipant?.user?.id]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await db
        .from("messages")
        .select(`
          *,
          sender:profiles (*)
        `)
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data as MessageWithSender[]);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [db, conversation.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    const channel = db
      .channel(`conversation:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          // Fetch sender details
          const { data: sender } = await db
            .from("profiles")
            .select("*")
            .eq("id", payload.new.sender_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...payload.new, sender } as unknown as MessageWithSender,
          ]);
        }
      )
      .on("presence", { event: "sync" }, () => {
        // Handle presence for typing indicators
      })
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [db, conversation.id]);

  // Scroll to bottom on new messages (only if user hasn't manually scrolled)
  useEffect(() => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isUserScrolling]);

  // Update last read
  useEffect(() => {
    const updateLastRead = async () => {
      const now = new Date().toISOString();
      await db
        .from("conversation_participants")
        .update({ last_read_at: now } as never)
        .eq("conversation_id", conversation.id)
        .eq("user_id", currentUserId);

      // Notify conversation list to clear unread badge immediately
      window.dispatchEvent(
        new CustomEvent("messages-read", {
          detail: { conversationId: conversation.id, readAt: now },
        })
      );
    };
    updateLastRead();
  }, [db, conversation.id, currentUserId, messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await db.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        content: newMessage.trim(),
        type: "text",
      } as never);

      if (error) throw error;

      // Update conversation timestamp
      await db
        .from("conversations")
        .update({ updated_at: new Date().toISOString() } as never)
        .eq("id", conversation.id);

      setNewMessage("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Check if user is near the bottom
    const threshold = 100;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;

    setShowScrollButton(!isNearBottom);

    // Mark as user scrolling if not at bottom
    if (!isNearBottom) {
      setIsUserScrolling(true);
    } else {
      // Reset user scrolling state when at bottom
      setIsUserScrolling(false);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsUserScrolling(false);
    setShowScrollButton(false);
  };

  const handleVoiceCall = async () => {
    if (isInCall || isConnecting) return;
    try {
      await initiateCall(conversation.id, "voice");
    } catch (error) {
      console.error("Failed to start voice call:", error);
    }
  };

  const handleVideoCall = async () => {
    if (isInCall || isConnecting) return;
    try {
      await initiateCall(conversation.id, "video");
    } catch (error) {
      console.error("Failed to start video call:", error);
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, MessageWithSender[]>);

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
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
            <h3 className="font-semibold text-text">
              {conversation.type === "group"
                ? conversation.name || "Group Chat"
                : otherUser?.display_name || otherUser?.username}
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

        <div className="flex gap-1">
          {/* TODO: Voice and Video calls - to be integrated later */}
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceCall}
            disabled={isInCall || isConnecting}
            title="Voice call"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVideoCall}
            disabled={isInCall || isConnecting}
            title="Video call"
          >
            <Video className="h-4 w-4" />
          </Button> */}
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 relative overflow-hidden">
        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-6 right-6 z-10"
            >
              <Button
                variant="primary"
                size="icon"
                onClick={scrollToBottom}
                className="rounded-full shadow-lg"
                title="Scroll to bottom"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto p-4 space-y-4"
        >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Avatar
                src={otherUser?.avatar_url}
                alt={otherUser?.display_name || "User"}
                size="xl"
                className="mx-auto mb-4"
              />
              <p className="text-text-muted">
                Start a conversation with{" "}
                {otherUser?.display_name || otherUser?.username}
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-surface-light rounded-full text-xs text-text-muted">
                  {date === new Date().toLocaleDateString() ? "Today" : date}
                </span>
              </div>
              <AnimatePresence>
                {dateMessages.map((message) => {
                  const isOwn = message.sender_id === currentUserId;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 mb-3 ${
                        isOwn ? "flex-row-reverse" : ""
                      }`}
                    >
                      {!isOwn && (
                        <Avatar
                          src={message.sender?.avatar_url}
                          alt={message.sender?.username || "User"}
                          size="sm"
                        />
                      )}
                      <div
                        className={`max-w-[70%] ${
                          isOwn ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwn
                              ? "bg-primary text-background rounded-br-sm"
                              : "bg-surface-light text-text rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                        </div>
                        <div
                          className={`flex items-center gap-0.5 mt-1 ${
                            isOwn ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="text-xs text-text-dim">
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isOwn && (
                            otherLastReadAt &&
                            new Date(otherLastReadAt) >= new Date(message.created_at) ? (
                              <span className="inline-flex items-center ml-1" title="Read">
                                <svg width="16" height="10" viewBox="0 0 16 10" fill="none" className="text-[#00bfff]">
                                  <path d="M1.5 5.5L4 8L9 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M5.5 5.5L8 8L13 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            ) : (
                              <span className="inline-flex items-center ml-1" title="Sent">
                                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" className="text-text-muted/60">
                                  <path d="M1.5 5.5L4 8L10 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex items-center gap-2">
            <Avatar
              src={otherUser?.avatar_url}
              alt={otherUser?.username || "User"}
              size="sm"
            />
            <div className="px-4 py-2 bg-surface-light rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            isLoading={sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
