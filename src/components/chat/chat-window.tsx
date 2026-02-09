"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ChevronLeft, MoreVertical, Phone, Video } from "lucide-react";
import { Button, Input, Avatar, Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { initiateCall, isInCall, isConnecting } = useCall();

  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const otherUser = conversation.participants.find(
    (p) => p.user?.id !== currentUserId
  )?.user;

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
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
  }, [supabase, conversation.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
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
          const { data: sender } = await supabase
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
      supabase.removeChannel(channel);
    };
  }, [supabase, conversation.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update last read
  useEffect(() => {
    const updateLastRead = async () => {
      await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() } as never)
        .eq("conversation_id", conversation.id)
        .eq("user_id", currentUserId);
    };
    updateLastRead();
  }, [supabase, conversation.id, currentUserId, messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        content: newMessage.trim(),
        type: "text",
      } as never);

      if (error) throw error;

      // Update conversation timestamp
      await supabase
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
            status={otherUser?.is_online ? "online" : "offline"}
            showStatus
          />
          <div>
            <h3 className="font-semibold text-text">
              {conversation.type === "group"
                ? conversation.name || "Group Chat"
                : otherUser?.display_name || otherUser?.username}
            </h3>
            <p className="text-xs text-text-muted">
              {otherUser?.is_online
                ? "Online"
                : otherUser?.last_seen
                ? `Last seen ${formatRelativeTime(otherUser.last_seen)}`
                : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          <Button
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
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                        <p
                          className={`text-xs text-text-dim mt-1 ${
                            isOwn ? "text-right" : ""
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
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
