"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Gamepad2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button, Avatar } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { PremiumBadge } from "@/components/premium";
import { MiniChatBox } from "@/components/messages/mini-chat-box";
import { useFriends } from "@/lib/hooks/useFriends";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePresence } from "@/lib/presence/PresenceProvider";

interface Friend {
  id: string;
  name: string;
  game: string;
  avatar: string;
  avatarUrl?: string;
  status: string;
  username?: string;
  isPremium?: boolean;
}

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
      game: "", // Game status would come from presence/activity system
      avatar: (f.profile?.display_name || f.profile?.username || "U").slice(0, 2).toUpperCase(),
      avatarUrl: f.profile?.avatar_url || undefined,
      status: getStatusLabel(getUserStatus(f.friend_id)),
      username: f.profile?.username,
      isPremium: f.profile?.is_premium || false,
    }));

  const openChat = useCallback((friend: Friend) => {
    setOpenChats((prev) => {
      // Check if chat already exists
      const existing = prev.find((chat) => chat.friend.id === friend.id);
      if (existing) {
        // If minimized, expand it
        return prev.map((chat) =>
          chat.friend.id === friend.id ? { ...chat, minimized: false } : chat
        );
      }
      // Add new chat (max 3 chats)
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
    <div className="flex-1 p-4 overflow-y-auto pt-16 2xl:pt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-text">Online Friends</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted bg-surface-light px-2 py-1 rounded-full">
            {onlineFriends.length} online
          </span>
          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="2xl:hidden p-1 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {!user ? (
          <Card className="p-4 text-center">
            <p className="text-sm text-text-muted mb-2">Sign in to see friends</p>
            <Link href="/login">
              <Button variant="outline" size="sm">Log In</Button>
            </Link>
          </Card>
        ) : friendsLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-surface-light" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-surface-light rounded mb-1" />
                <div className="h-3 w-16 bg-surface-light rounded" />
              </div>
            </div>
          ))
        ) : onlineFriends.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-sm text-text-muted">No friends online</p>
          </Card>
        ) : (
          onlineFriends.map((friend, index) => (
            <div
              key={friend.id}
              onClick={() => openChat(friend)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-light transition-colors cursor-pointer group animate-fadeInRight"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
            >
              <div className="relative">
                {friend.avatarUrl ? (
                  <Avatar
                    src={friend.avatarUrl}
                    alt={friend.name}
                    size="md"
                    status={getUserStatus(friend.id)}
                    showStatus
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                    {friend.avatar}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-text truncate group-hover:text-primary transition-colors flex items-center gap-1">
                  {friend.name}
                  {friend.isPremium && <PremiumBadge size="sm" showLabel={false} animate={false} />}
                </span>
                <p className="text-xs text-text-muted truncate">
                  {friend.game ? `${friend.game} • ` : ""}{friend.status}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity px-2">
                <Gamepad2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
      <Link href="/friends">
        <Button variant="ghost" size="sm" className="w-full mt-3 text-text-muted">
          View All Friends
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </Link>
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
