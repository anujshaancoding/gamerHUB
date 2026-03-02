"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/db/client-browser";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSocket } from "@/lib/realtime/SocketProvider";
import { toast } from "sonner";
import { Avatar } from "@/components/ui";
import type { Profile } from "@/types/database";

// ── Notification sound using Web Audio API ─────────────────────────

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Two-tone chime: short high note then slightly lower
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1); // E5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);

    // Clean up
    osc.onended = () => ctx.close();
  } catch {
    // Audio not available — silently ignore
  }
}

// ── Toast content ──────────────────────────────────────────────────

function MessageToast({
  sender,
  content,
  onClick,
}: {
  sender: { display_name?: string | null; username?: string | null; avatar_url?: string | null };
  content: string;
  conversationId: string;
  onClick: () => void;
}) {
  const isImage = content.startsWith("http") && content.includes("/media/");
  const preview = isImage ? "Sent an image" : content;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left"
    >
      <Avatar
        src={sender.avatar_url}
        alt={sender.display_name || sender.username || "User"}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text truncate">
          {sender.display_name || sender.username}
        </p>
        <p className="text-xs text-text-muted truncate">{preview}</p>
      </div>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function MessageNotifier() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  // Track recently shown notifications to avoid duplicates between socket + supabase
  const shownMessageIds = useRef(new Set<string>());

  // Keep ref in sync so the realtime callback always reads the latest pathname
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const showNotification = useCallback(
    (
      senderId: string,
      conversationId: string,
      content: string,
      senderProfile: { id: string; display_name?: string | null; username?: string | null; avatar_url?: string | null; is_premium?: boolean | null },
      messageId?: string
    ) => {
      // Deduplicate: skip if we already showed this message
      if (messageId) {
        if (shownMessageIds.current.has(messageId)) return;
        shownMessageIds.current.add(messageId);
        // Clean up old IDs to prevent memory leak
        if (shownMessageIds.current.size > 100) {
          const arr = Array.from(shownMessageIds.current);
          shownMessageIds.current = new Set(arr.slice(-50));
        }
      }

      // Ignore own messages
      if (!user || senderId === user.id) return;

      // Ignore if user is already viewing that conversation
      if (pathnameRef.current === `/messages/${conversationId}`) return;

      // Dispatch event to instantly update unread count badge
      window.dispatchEvent(
        new CustomEvent("message:new-incoming", {
          detail: { conversationId, senderId },
        })
      );

      // Play sound
      playNotificationSound();

      // Build friend info for the chat popup
      const friendName = senderProfile.display_name || senderProfile.username || "User";
      const friendDetail = {
        id: senderId,
        name: friendName,
        avatar: friendName.slice(0, 2).toUpperCase(),
        avatarUrl: senderProfile.avatar_url || undefined,
        status: "Online",
        isPremium: senderProfile.is_premium || false,
      };

      // Check screen size - only show toast popup on large screens
      const isLargeScreen = window.matchMedia("(min-width: 1024px)").matches;

      if (isLargeScreen) {
        // Auto-open chat popup in bottom right
        window.dispatchEvent(
          new CustomEvent("open-chat-popup", { detail: friendDetail })
        );

        // Show toast — clicking it opens/expands the popup
        toast.custom(
          (id) => (
            <MessageToast
              sender={senderProfile}
              content={content}
              conversationId={conversationId}
              onClick={() => {
                toast.dismiss(id);
                window.dispatchEvent(
                  new CustomEvent("open-chat-popup", { detail: friendDetail })
                );
              }}
            />
          ),
          {
            duration: 5000,
            className:
              "bg-surface border border-border/50 rounded-xl shadow-xl px-4 py-3 cursor-pointer",
          }
        );
      }
    },
    [user]
  );

  // ── Socket.io listener (instant, no extra DB calls) ──────────────
  useEffect(() => {
    if (!socket || !user) return;

    const handleSocketMessage = (data: {
      message: { id: string; sender_id: string; content: string; conversation_id: string };
      conversationId: string;
      sender: { id: string; display_name?: string | null; username?: string | null; avatar_url?: string | null; is_premium?: boolean | null };
    }) => {
      showNotification(
        data.message.sender_id,
        data.conversationId,
        data.message.content,
        data.sender,
        data.message.id
      );
    };

    socket.on("message:new", handleSocketMessage);
    return () => {
      socket.off("message:new", handleSocketMessage);
    };
  }, [socket, user, showNotification]);

  // ── Supabase Realtime fallback (for when Socket.io is unavailable) ──
  useEffect(() => {
    if (!user) return;

    const db = createClient();

    const channel = db
      .channel("global-message-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const msg = payload.new;
          const senderId = msg.sender_id as string;
          const conversationId = msg.conversation_id as string;
          const content = msg.content as string;
          const messageId = msg.id as string;

          // Skip own messages
          if (senderId === user.id) return;

          // Skip if already shown via Socket.io
          if (shownMessageIds.current.has(messageId)) return;

          // Fetch sender profile (only needed for Supabase path)
          const { data: sender } = await db
            .from("profiles")
            .select("*")
            .eq("id", senderId)
            .single();

          if (!sender) return;

          showNotification(senderId, conversationId, content, sender as Profile, messageId);
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [user, showNotification]);

  // This component renders nothing — it's purely a side-effect listener
  return null;
}
