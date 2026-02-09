"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  Users,
  Circle,
  Gamepad2,
  ArrowRight,
  X,
  Send,
  Minus,
} from "lucide-react";
import { Button, Avatar } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { PremiumBadge } from "@/components/premium";
import { useNewsArticles } from "@/lib/hooks/useNews";
import { useFriends } from "@/lib/hooks/useFriends";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { NEWS_CATEGORIES } from "@/types/news";

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
  const [openChats, setOpenChats] = useState<ChatBox[]>([]);
  const [messageInputs, setMessageInputs] = useState<Record<string, string>>({});

  // Fetch news from backend
  const { data: newsData, isLoading: newsLoading } = useNewsArticles({}, 4);
  const newsArticles = newsData?.pages.flatMap((page) => page.posts) || [];

  // Fetch friends from backend (only for logged in users)
  const { friends: friendsData, loading: friendsLoading } = useFriends({
    userId: user?.id,
    limit: 5,
  });

  // Convert friends to Friend interface
  const onlineFriends: Friend[] = friendsData
    .filter((f) => f.profile?.is_online)
    .map((f) => ({
      id: f.friend_id,
      name: f.profile?.display_name || f.profile?.username || "Unknown",
      game: "", // Game status would come from presence/activity system
      avatar: (f.profile?.display_name || f.profile?.username || "U").slice(0, 2).toUpperCase(),
      avatarUrl: f.profile?.avatar_url || undefined,
      status: "Online",
      username: f.profile?.username,
      isPremium: f.profile?.is_premium || false,
    }));

  const openChat = (friend: Friend) => {
    // Check if chat already exists
    if (openChats.find((chat) => chat.friend.id === friend.id)) {
      // If minimized, expand it
      setOpenChats((prev) =>
        prev.map((chat) =>
          chat.friend.id === friend.id ? { ...chat, minimized: false } : chat
        )
      );
      return;
    }
    // Add new chat (max 3 chats)
    setOpenChats((prev) => {
      const newChats = [{ friend, minimized: false }, ...prev];
      return newChats.slice(0, 3);
    });
  };

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

  const handleSendMessage = (friendId: string) => {
    const message = messageInputs[friendId];
    if (message?.trim()) {
      // In real app, this would send to API
      console.log(`Sending to ${friendId}: ${message}`);
      setMessageInputs((prev) => ({ ...prev, [friendId]: "" }));
    }
  };

  return (
    <>
      {/* Chat Boxes - Positioned to the left of sidebar on xl, bottom right on smaller screens */}
      <div className="fixed bottom-0 right-0 xl:right-72 z-50 flex flex-row-reverse gap-2 p-2">
        <AnimatePresence>
          {openChats.map((chat) => (
            <motion.div
              key={chat.friend.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="flex flex-col bg-surface border border-border rounded-t-lg shadow-xl overflow-hidden"
              style={{ width: chat.minimized ? "200px" : "280px" }}
            >
              {/* Chat Header */}
              <div
                className="flex items-center gap-2 p-3 bg-surface-light border-b border-border cursor-pointer"
                onClick={() => toggleMinimize(chat.friend.id)}
              >
                <div className="relative">
                  {chat.friend.avatarUrl ? (
                    <Avatar
                      src={chat.friend.avatarUrl}
                      alt={chat.friend.name}
                      size="sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                      {chat.friend.avatar}
                    </div>
                  )}
                  <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-success fill-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-text truncate flex items-center gap-1">
                    {chat.friend.name}
                    {chat.friend.isPremium && <PremiumBadge size="sm" showLabel={false} animate={false} />}
                  </span>
                  <p className="text-xs text-text-muted truncate">
                    {chat.friend.status}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMinimize(chat.friend.id);
                    }}
                    className="p-1 hover:bg-surface rounded transition-colors"
                  >
                    <Minus className="h-4 w-4 text-text-muted" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeChat(chat.friend.id);
                    }}
                    className="p-1 hover:bg-surface rounded transition-colors"
                  >
                    <X className="h-4 w-4 text-text-muted" />
                  </button>
                </div>
              </div>

              {/* Chat Body - Only show when not minimized */}
              {!chat.minimized && (
                <>
                  {/* Messages Area */}
                  <div className="flex-1 h-64 p-3 overflow-y-auto bg-background">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-text-muted text-center py-4">
                        Start a conversation with {chat.friend.name}
                      </p>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="p-2 border-t border-border bg-surface">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={messageInputs[chat.friend.id] || ""}
                        onChange={(e) =>
                          setMessageInputs((prev) => ({
                            ...prev,
                            [chat.friend.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSendMessage(chat.friend.id);
                          }
                        }}
                        className="flex-1 bg-surface-light border border-border rounded px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => handleSendMessage(chat.friend.id)}
                        className="p-2 bg-primary hover:bg-primary/80 rounded transition-colors"
                      >
                        <Send className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Right Sidebar - Hidden on mobile/tablet, visible on xl screens */}
      <aside className="fixed right-0 top-0 bottom-0 w-72 flex-col border-l border-border bg-surface/95 backdrop-blur-sm z-40 hidden xl:flex">
        {/* Latest News - Top Half */}
        <div className="flex-1 p-4 border-b border-border overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-text">Latest News</h3>
          </div>
          <div className="space-y-3">
            {newsLoading ? (
              // Loading skeleton
              [...Array(4)].map((_, i) => (
                <Card key={i} className="p-3 animate-pulse">
                  <div className="h-4 w-16 bg-surface-light rounded mb-2" />
                  <div className="h-4 w-full bg-surface-light rounded mb-1" />
                  <div className="h-3 w-20 bg-surface-light rounded" />
                </Card>
              ))
            ) : newsArticles.length === 0 ? (
              <Card className="p-4 text-center">
                <p className="text-sm text-text-muted">No news available</p>
              </Card>
            ) : (
              newsArticles.slice(0, 4).map((news, index) => (
                <motion.div
                  key={news.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group cursor-pointer"
                >
                  <Link href={news.original_url || `/community?news=${news.id}`}>
                    <Card className="p-3 hover:border-primary/50 transition-all hover:bg-surface-light">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {NEWS_CATEGORIES[news.category]?.label || news.category}
                      </span>
                      <h4 className="text-sm font-medium text-text mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {news.title}
                      </h4>
                      <p className="text-xs text-text-muted mt-1">
                        {news.published_at
                          ? formatDistanceToNow(new Date(news.published_at), { addSuffix: true })
                          : "Recently"}
                      </p>
                    </Card>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
          <Link href="/community">
            <Button variant="ghost" size="sm" className="w-full mt-3 text-text-muted">
              View All News
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Online Friends - Bottom Half */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-text">Online Friends</h3>
            </div>
            <span className="text-xs text-text-muted bg-surface-light px-2 py-1 rounded-full">
              {onlineFriends.length} online
            </span>
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
              // Loading skeleton
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
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => openChat(friend)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-light transition-colors cursor-pointer group"
                >
                  <div className="relative">
                    {friend.avatarUrl ? (
                      <Avatar
                        src={friend.avatarUrl}
                        alt={friend.name}
                        size="md"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                        {friend.avatar}
                      </div>
                    )}
                    <Circle className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 text-success fill-success" />
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
                </motion.div>
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
      </aside>
    </>
  );
}
