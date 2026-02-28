"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/db/client-browser";
import { useAuth } from "@/lib/hooks/useAuth";
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
  conversationId,
  onClick,
}: {
  sender: Profile;
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
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  // Keep ref in sync so the realtime callback always reads the latest pathname
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const handleNewMessage = useCallback(
    async (payload: { new: Record<string, unknown> }) => {
      const msg = payload.new;
      const senderId = msg.sender_id as string;
      const conversationId = msg.conversation_id as string;
      const content = msg.content as string;

      // Ignore own messages
      if (!user || senderId === user.id) return;

      // Ignore if user is already viewing that conversation
      if (pathnameRef.current === `/messages/${conversationId}`) return;

      // Fetch sender profile
      const db = createClient();
      const { data: sender } = await db
        .from("profiles")
        .select("*")
        .eq("id", senderId)
        .single();

      if (!sender) return;

      // Check if sender is a friend — suppress all notifications for non-friends (The Void)
      const { data: areFriendsResult } = await db.rpc("are_friends", {
        user1_id: user.id,
        user2_id: senderId,
      } as unknown as undefined);

      if (!areFriendsResult) return;

      // Play sound
      playNotificationSound();

      // Build friend info for the chat popup
      const senderProfile = sender as Profile;
      const friendName = senderProfile.display_name || senderProfile.username || "User";
      const friendDetail = {
        id: senderId,
        name: friendName,
        avatar: friendName.slice(0, 2).toUpperCase(),
        avatarUrl: senderProfile.avatar_url || undefined,
        status: "Online",
        isPremium: senderProfile.is_premium || false,
      };

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
    },
    [user]
  );

  // Subscribe to new messages across all conversations the user is part of
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
        (payload) => {
          handleNewMessage(payload as { new: Record<string, unknown> });
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [user, handleNewMessage]);

  // This component renders nothing — it's purely a side-effect listener
  return null;
}
