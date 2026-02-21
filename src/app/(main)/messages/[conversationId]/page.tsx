"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ConversationListPanel } from "@/components/messages/conversation-list-panel";
import { MessageThread } from "@/components/messages/message-thread";
import { NewConversationModal } from "@/components/messages/new-conversation-modal";
import { useConversations } from "@/lib/hooks/useMessages";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Profile } from "@/types/database";

interface ConversationDetails {
  id: string;
  type: string | null;
  name: string | null;
  participants: {
    user_id: string;
    last_read_at: string | null;
    user: Profile;
  }[];
}

function ConversationContent() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { user } = useAuth();
  const { conversations, voidConversations, loading: convsLoading, voidUnreadCount } = useConversations();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [conversationDetails, setConversationDetails] =
    useState<ConversationDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [isVoid, setIsVoid] = useState(false);

  // Fetch conversation details
  useEffect(() => {
    if (!conversationId) return;

    const fetchDetails = async () => {
      try {
        const res = await fetch(
          `/api/messages/conversations/${conversationId}`
        );
        if (!res.ok) throw new Error("Failed to fetch conversation");
        const data = await res.json();
        setConversationDetails(data.conversation);
        setIsVoid(data.conversation?.is_void || false);
      } catch (err) {
        console.error("Fetch conversation details error:", err);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [conversationId]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-text-muted">Please log in to view messages</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 lg:-m-6 overflow-hidden">
      {/* Desktop: Conversation list on left */}
      <div className="hidden lg:block">
        <ConversationListPanel
          conversations={conversations}
          voidConversations={voidConversations}
          selectedId={conversationId}
          currentUserId={user.id}
          loading={convsLoading}
          onNewConversation={() => setShowNewConversation(true)}
          voidUnreadCount={voidUnreadCount}
        />
      </div>

      {/* Chat area */}
      {detailsLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <MessageThread
          conversationId={conversationId}
          conversation={conversationDetails || undefined}
          isVoid={isVoid}
        />
      )}

      {/* New conversation modal */}
      <NewConversationModal
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
      />
    </div>
  );
}

export default function ConversationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      }
    >
      <ConversationContent />
    </Suspense>
  );
}
