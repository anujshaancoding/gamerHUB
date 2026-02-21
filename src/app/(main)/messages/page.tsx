"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gamepad2, MessageCircle, Loader2 } from "lucide-react";
import { ConversationListPanel } from "@/components/messages/conversation-list-panel";
import { NewConversationModal } from "@/components/messages/new-conversation-modal";
import { useConversations, createConversation } from "@/lib/hooks/useMessages";
import { useAuth } from "@/lib/hooks/useAuth";

function MessagesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { conversations, voidConversations, loading, voidUnreadCount } = useConversations();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const handledUserRef = useRef<string | null>(null);

  // Auto-create conversation when ?user=<id> is present (e.g. from profile page)
  const targetUserId = searchParams.get("user");

  useEffect(() => {
    if (!targetUserId || !user || redirecting) return;
    if (targetUserId === user.id) return;
    if (handledUserRef.current === targetUserId) return;

    handledUserRef.current = targetUserId;
    setRedirecting(true);

    createConversation(targetUserId)
      .then((conversationId) => {
        router.replace(`/messages/${conversationId}`);
      })
      .catch((err) => {
        console.error("Auto-create conversation error:", err);
        setRedirecting(false);
      });
  }, [targetUserId, user, router, redirecting]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-text-muted">Please log in to view messages</p>
      </div>
    );
  }

  // Show loading while redirecting to the conversation
  if (redirecting || targetUserId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-text-muted">Opening conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 lg:-m-6 overflow-hidden">
      {/* Conversation list */}
      <ConversationListPanel
        conversations={conversations}
        voidConversations={voidConversations}
        currentUserId={user.id}
        loading={loading}
        onNewConversation={() => setShowNewConversation(true)}
        voidUnreadCount={voidUnreadCount}
      />

      {/* Desktop: Empty state right panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-background/50 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.03)_0%,transparent_70%)]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative z-10"
        >
          <div className="relative mx-auto mb-6">
            <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
              <Gamepad2 className="h-12 w-12 text-primary/30" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
              <MessageCircle className="h-4 w-4 text-accent/40" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-text-secondary mb-1">
            Select a conversation
          </h3>
          <p className="text-sm text-text-muted max-w-xs">
            Choose an existing chat or start a new conversation with a friend
          </p>
        </motion.div>
      </div>

      {/* New conversation modal */}
      <NewConversationModal
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
