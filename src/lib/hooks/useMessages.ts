"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/db/client-browser";
import type { Profile } from "@/types/database";

// Debounce helper to coalesce rapid-fire realtime events into a single call
function createDebouncedFn(fn: () => void, delay: number): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

// ── Types ────────────────────────────────────────────────────────────

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface MessageWithSender {
  id: string;
  conversation_id: string | null;
  sender_id: string | null;
  content: string;
  type: string | null;
  is_edited: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  sender?: Profile;
  reactions?: MessageReaction[];
}

export interface ConversationWithDetails {
  id: string;
  type: string | null;
  name: string | null;
  created_at: string | null;
  updated_at: string | null;
  participants: {
    user_id: string;
    last_read_at: string | null;
    user: Profile;
  }[];
  last_message?: MessageWithSender | null;
  unread_count?: number;
  is_void?: boolean;
}

// ── useConversations ─────────────────────────────────────────────────

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [voidConversations, setVoidConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchedRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
      setVoidConversations(data.voidConversations || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchConversations is stable with empty deps

  // Realtime: listen for conversation updates + follows changes (friend status)
  // All events are debounced so rapid-fire changes coalesce into a single refetch.
  useEffect(() => {
    const db = createClient();
    const debouncedFetch = createDebouncedFn(fetchConversations, 300);

    const channel = db
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        () => { debouncedFetch(); }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        () => { debouncedFetch(); }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversation_participants" },
        () => { debouncedFetch(); }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => { debouncedFetch(); }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "follows" },
        () => { debouncedFetch(); }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "follows" },
        () => { debouncedFetch(); }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchConversations is stable, setup once on mount

  // Listen for mark-as-read events and optimistically clear unread badges
  useEffect(() => {
    const handler = (e: Event) => {
      const { conversationId } = (e as CustomEvent).detail;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        )
      );
      setVoidConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        )
      );
    };
    window.addEventListener("messages-read", handler);
    return () => window.removeEventListener("messages-read", handler);
  }, []);

  const unreadCount = conversations.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0
  );

  const voidUnreadCount = voidConversations.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0
  );

  return {
    conversations,
    voidConversations,
    loading,
    error,
    refetch: fetchConversations,
    unreadCount,
    voidUnreadCount,
  };
}

// ── useConversationMessages ──────────────────────────────────────────

export function useConversationMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Profile[]>([]);
  const messagesRef = useRef<MessageWithSender[]>([]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(
        `/api/messages/conversations/${conversationId}/messages?limit=50`
      );
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      const msgs = data.messages || [];
      setMessages(msgs);
      messagesRef.current = msgs;
      setHasMore(msgs.length >= 50);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      setLoading(true);
      setMessages([]);
      messagesRef.current = [];
      fetchMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]); // fetchMessages is stable and only depends on conversationId

  // Listen for cross-instance message deletions (e.g. mini-chat ↔ messages page)
  useEffect(() => {
    if (!conversationId) return;

    const handler = (e: Event) => {
      const { conversationId: cid, messageId } = (e as CustomEvent).detail;
      if (cid === conversationId) {
        setMessages((prev) => {
          if (!prev.some((m) => m.id === messageId)) return prev;
          const updated = prev.filter((m) => m.id !== messageId);
          messagesRef.current = updated;
          return updated;
        });
      }
    };

    window.addEventListener("message-deleted", handler);
    return () => window.removeEventListener("message-deleted", handler);
  }, [conversationId]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const db = createClient();

    const channel = db
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data: sender } = await db
            .from("profiles")
            .select("*")
            .eq("id", payload.new.sender_id)
            .single();

          const newMsg: MessageWithSender = {
            ...payload.new as MessageWithSender,
            sender: sender || undefined,
            reactions: [],
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const updated = [...prev, newMsg];
            messagesRef.current = updated;
            return updated;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const updated = prev.filter((m) => m.id !== payload.old.id);
            messagesRef.current = updated;
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [conversationId]);

  // Typing presence channel
  useEffect(() => {
    if (!conversationId) return;

    const db = createClient();

    const channel = db.channel(`typing:${conversationId}`, {
      config: { presence: { key: "typing" } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: Profile[] = [];
        Object.values(state).forEach((presences) => {
          (presences as { user: Profile }[]).forEach((p) => {
            if (p.user) users.push(p.user);
          });
        });
        setTypingUsers(users);
      })
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [conversationId]);

  // Catch-up on tab focus (like Discord) — fetch missed messages when user returns
  useEffect(() => {
    if (!conversationId) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;

      const latest = messagesRef.current[messagesRef.current.length - 1];
      const after = latest?.created_at || new Date(0).toISOString();

      try {
        const res = await fetch(
          `/api/messages/conversations/${conversationId}/messages?limit=50&after=${encodeURIComponent(after)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const newMsgs: MessageWithSender[] = data.messages || [];
        if (newMsgs.length === 0) return;

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const toAdd = newMsgs.filter((m) => !existingIds.has(m.id));
          if (toAdd.length === 0) return prev;
          const updated = [...prev, ...toAdd];
          messagesRef.current = updated;
          return updated;
        });
      } catch {
        // Ignore catch-up errors silently
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string, type: string = "text") => {
      if (!conversationId) return;
      try {
        const res = await fetch("/api/messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, content, type }),
        });
        if (!res.ok) throw new Error("Failed to send message");
        const data = await res.json();

        // Add sent message to state immediately — no extra network calls.
        // Own messages don't render sender avatar/name, so sender profile
        // is not needed here. The realtime subscription deduplicates by id.
        if (data.message) {
          const sentMsg: MessageWithSender = {
            ...data.message,
            reactions: [],
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === sentMsg.id)) return prev;
            const updated = [...prev, sentMsg];
            messagesRef.current = updated;
            return updated;
          });
        }
      } catch (err) {
        console.error("Send message error:", err);
        throw err;
      }
    },
    [conversationId]
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete message");
      setMessages((prev) => {
        const updated = prev.filter((m) => m.id !== messageId);
        messagesRef.current = updated;
        return updated;
      });
      // Broadcast deletion so other hook instances (e.g. mini-chat popup) stay in sync
      window.dispatchEvent(
        new CustomEvent("message-deleted", {
          detail: { conversationId, messageId },
        })
      );
    } catch (err) {
      console.error("Delete message error:", err);
    }
  }, [conversationId]);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) throw new Error("Failed to add reaction");
      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, reactions: [...(m.reactions || []), data.reaction] }
            : m
        )
      );
    } catch (err) {
      console.error("Add reaction error:", err);
    }
  }, []);

  const removeReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        const res = await fetch(`/api/messages/${messageId}/reactions`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
        if (!res.ok) throw new Error("Failed to remove reaction");

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  reactions: (m.reactions || []).filter(
                    (r) => r.emoji !== emoji || r.user_id !== "self"
                  ),
                }
              : m
          )
        );
      } catch (err) {
        console.error("Remove reaction error:", err);
      }
    },
    []
  );

  const setTyping = useCallback(
    async (isTyping: boolean, _currentUser: Profile) => {
      if (!conversationId) return;
      // Typing indicators will be handled via Socket.io in production
      try {
        await fetch(`/api/messages/conversations/${conversationId}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isTyping }),
        });
      } catch {
        // Typing is non-critical, silently ignore errors
      }
    },
    [conversationId]
  );

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;
    try {
      await fetch(`/api/messages/conversations/${conversationId}/read`, {
        method: "POST",
      });
    } catch {
      // Non-critical
    }

    // Notify conversation list to clear unread badge immediately
    window.dispatchEvent(
      new CustomEvent("messages-read", {
        detail: { conversationId, readAt: new Date().toISOString() },
      })
    );
  }, [conversationId]);

  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || loading) return;
    const oldest = messagesRef.current[0];
    if (!oldest) return;

    try {
      const res = await fetch(
        `/api/messages/conversations/${conversationId}/messages?limit=50&before=${oldest.created_at}`
      );
      if (!res.ok) throw new Error("Failed to load more");
      const data = await res.json();
      const older = data.messages || [];
      setHasMore(older.length >= 50);
      setMessages((prev) => {
        const updated = [...older, ...prev];
        messagesRef.current = updated;
        return updated;
      });
    } catch (err) {
      console.error("Load more error:", err);
    }
  }, [conversationId, hasMore, loading]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    loadMore,
    hasMore,
    typingUsers,
    setTyping,
    markAsRead,
    refetch: fetchMessages,
  };
}

// ── useUnreadMessageCount ────────────────────────────────────────────

/**
 * Lightweight hook for unread message count.
 * Uses a module-level singleton so Navbar + Sidebar share one subscription
 * instead of each creating their own useConversations instance.
 */
const unreadCountListeners = new Set<(count: number) => void>();
let unreadSingletonActive = false;
let lastUnreadCount = 0;

function startUnreadCountSingleton() {
  if (unreadSingletonActive) return;
  unreadSingletonActive = true;

  const fetchCount = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (!res.ok) return;
      const data = await res.json();
      const conversations: { unread_count?: number }[] = data.conversations || [];
      lastUnreadCount = conversations.reduce(
        (sum, c) => sum + (c.unread_count || 0),
        0
      );
      unreadCountListeners.forEach((cb) => cb(lastUnreadCount));
    } catch {
      // silently ignore
    }
  };

  // Initial fetch
  fetchCount();

  // Listen for realtime message inserts to update the count (debounced)
  const db = createClient();
  const debouncedFetchCount = createDebouncedFn(fetchCount, 500);
  const channel = db
    .channel("unread-count-singleton")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      () => { debouncedFetchCount(); }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "conversation_participants" },
      () => { debouncedFetchCount(); }
    )
    .subscribe();

  // Listen for optimistic mark-as-read events
  const handler = (e: Event) => {
    const { conversationId } = (e as CustomEvent).detail;
    if (conversationId) {
      lastUnreadCount = Math.max(0, lastUnreadCount - 1);
      unreadCountListeners.forEach((cb) => cb(lastUnreadCount));
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("messages-read", handler);
  }

  // This singleton lives for the lifetime of the app — no cleanup needed
  void channel;
}

export function useUnreadMessageCount(enabled: boolean = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    startUnreadCountSingleton();
    unreadCountListeners.add(setCount);
    // Sync with latest value in case it was updated before this component mounted
    setCount(lastUnreadCount);
    return () => {
      unreadCountListeners.delete(setCount);
    };
  }, [enabled]);

  return enabled ? count : 0;
}

// ── createConversation ───────────────────────────────────────────────

export async function createConversation(
  otherUserId: string
): Promise<string> {
  const res = await fetch("/api/messages/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otherUserId }),
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  const data = await res.json();
  return data.conversationId;
}
