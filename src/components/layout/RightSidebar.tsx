"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ChevronLeft,
  X,
} from "lucide-react";
import { MiniChatBox } from "@/components/messages/mini-chat-box";
import { useFriends } from "@/lib/hooks/useFriends";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePresence } from "@/lib/presence/PresenceProvider";
import { SidebarActivitySection } from "./sidebar/SidebarActivitySection";
import { SidebarFriendsSection } from "./sidebar/SidebarFriendsSection";
import type { Friend } from "./sidebar/SidebarFriendsSection";

interface ChatBox {
  friend: Friend;
  minimized: boolean;
}

export function RightSidebar() {
  const { user } = useAuth();
  const { isUserOnline, getUserStatus } = usePresence();
  const [openChats, setOpenChats] = useState<ChatBox[]>([]);
  const openChatsRef = useRef<ChatBox[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Keep ref in sync for event listener access
  useEffect(() => {
    openChatsRef.current = openChats;
  }, [openChats]);

  // Fetch friends from backend (only for logged in users)
  const { friends: friendsData, loading: friendsLoading } = useFriends({
    userId: user?.id,
    limit: 50,
  });

  // Helper to get display label for user status
  const getStatusLabel = (status: "online" | "away" | "dnd" | "offline") => {
    switch (status) {
      case "online": return "Online";
      case "away": return "Away";
      case "dnd": return "Do Not Disturb";
      case "offline": return "Offline";
    }
  };

  // Filter friends by realtime presence (not stale DB is_online)
  const onlineFriends: Friend[] = friendsData
    .filter((f) => isUserOnline(f.friend_id))
    .map((f) => ({
      id: f.friend_id,
      name: f.profile?.display_name || f.profile?.username || "Unknown",
      game: "",
      avatar: (f.profile?.display_name || f.profile?.username || "U").slice(0, 2).toUpperCase(),
      avatarUrl: f.profile?.avatar_url || undefined,
      status: getStatusLabel(getUserStatus(f.friend_id)),
      username: f.profile?.username,
      isPremium: f.profile?.is_premium || false,
    }));

  const openChat = useCallback((friend: Friend) => {
    setOpenChats((prev) => {
      const existing = prev.find((chat) => chat.friend.id === friend.id);
      if (existing) {
        return prev.map((chat) =>
          chat.friend.id === friend.id ? { ...chat, minimized: false } : chat
        );
      }
      const newChats = [{ friend, minimized: false }, ...prev];
      return newChats.slice(0, 3);
    });
  }, []);

  const closeChat = (friendId: string) => {
    setOpenChats((prev) => prev.filter((chat) => chat.friend.id !== friendId));
  };

  const toggleMinimize = (friendId: string) => {
    setOpenChats((prev) =>
      prev.map((chat) =>
        chat.friend.id === friendId ? { ...chat, minimized: !chat.minimized } : chat
      )
    );
  };

  // Listen for incoming message events to auto-open chat popups
  useEffect(() => {
    const handleIncomingMessage = (e: Event) => {
      const detail = (e as CustomEvent).detail as Friend;
      if (detail?.id) {
        openChat(detail);
      }
    };

    window.addEventListener("open-chat-popup", handleIncomingMessage);
    return () => {
      window.removeEventListener("open-chat-popup", handleIncomingMessage);
    };
  }, [openChat]);

  // Sidebar content shared between desktop and mobile
  const sidebarContent = (
    <div className="flex flex-col h-full pt-16 2xl:pt-0">
      {/* Mobile close button */}
      <div className="2xl:hidden flex justify-end p-2 pb-0">
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Top half: Activity Feed */}
      <div className="flex-1 min-h-0 overflow-y-auto border-b border-border p-4">
        <SidebarActivitySection />
      </div>

      {/* Bottom half: Online Friends */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <SidebarFriendsSection
          user={user}
          onlineFriends={onlineFriends}
          friendsLoading={friendsLoading}
          getUserStatus={getUserStatus}
          openChat={openChat}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Chat Boxes - Positioned to the left of sidebar on xl, bottom right on smaller screens */}
      <div className="fixed bottom-0 right-[var(--app-inset)] 2xl:right-[calc(var(--app-inset)_+_18rem)] z-50 flex flex-row-reverse gap-2 sm:p-2">
        <AnimatePresence>
          {openChats.map((chat) => (
            <MiniChatBox
              key={chat.friend.id}
              friend={chat.friend}
              minimized={chat.minimized}
              onToggleMinimize={() => toggleMinimize(chat.friend.id)}
              onClose={() => closeChat(chat.friend.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile toggle button - visible below xl */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 2xl:hidden flex items-center gap-1 bg-surface/95 backdrop-blur-sm border border-border border-r-0 rounded-l-xl px-1.5 py-3 shadow-lg hover:bg-surface-light transition-colors group"
        title="Open Friends Panel"
      >
        <ChevronLeft className="h-4 w-4 text-text-muted group-hover:text-accent transition-colors" />
        <Users className="h-4 w-4 text-accent" />
        {onlineFriends.length > 0 && (
          <span className="absolute -top-1 -left-1 w-4 h-4 bg-accent text-[10px] font-bold text-black rounded-full flex items-center justify-center">
            {onlineFriends.length}
          </span>
        )}
      </button>

      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 2xl:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile slide-in sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-72 flex flex-col border-l border-border bg-surface/95 backdrop-blur-sm z-50 2xl:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - always visible on xl+ */}
      <aside className="fixed right-[var(--app-inset)] top-0 bottom-0 w-72 flex-col border-l border-border bg-surface/95 backdrop-blur-sm z-40 hidden 2xl:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
