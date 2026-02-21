"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageCircle, X, Loader2, Gamepad2 } from "lucide-react";
import { Input, Avatar, Button } from "@/components/ui";
import { usePresence } from "@/lib/presence/PresenceProvider";
import { useFriends } from "@/lib/hooks/useFriends";
import { createConversation } from "@/lib/hooks/useMessages";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewConversationModal({
  isOpen,
  onClose,
}: NewConversationModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { getUserStatus } = usePresence();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState<string | null>(null);

  const { friends, loading } = useFriends({
    userId: user?.id,
    search,
  });

  const handleSelect = async (friendId: string) => {
    if (creating) return;
    setCreating(friendId);
    try {
      const conversationId = await createConversation(friendId);
      onClose();
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      console.error("Create conversation error:", err);
    } finally {
      setCreating(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
      >
        <div className="bg-surface/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-text">New Message</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border/30">
            <Input
              placeholder="Search friends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="bg-surface-light/50"
              autoFocus
            />
          </div>

          {/* Friends list */}
          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Gamepad2 className="h-10 w-10 text-text-muted/30 mb-3" />
                <p className="text-sm text-text-muted">
                  {search ? "No friends found" : "Add friends to start chatting"}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {friends.map((friend) => (
                  <motion.button
                    key={friend.friend_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => handleSelect(friend.friend_id)}
                    disabled={creating === friend.friend_id}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 text-left transition-all",
                      "hover:bg-primary/5 hover:border-l-2 hover:border-primary",
                      creating === friend.friend_id && "opacity-50"
                    )}
                  >
                    <Avatar
                      src={friend.profile?.avatar_url}
                      alt={
                        friend.profile?.display_name ||
                        friend.profile?.username ||
                        "Friend"
                      }
                      size="md"
                      status={friend.profile?.id ? getUserStatus(friend.profile.id) : "offline"}
                      showStatus
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-text truncate">
                        {friend.profile?.display_name ||
                          friend.profile?.username}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        @{friend.profile?.username}
                      </p>
                    </div>
                    {creating === friend.friend_id ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-text-muted flex-shrink-0" />
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
