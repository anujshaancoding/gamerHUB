"use client";

import { Avatar, Badge } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";
import type { Conversation, Profile, Message } from "@/types/database";

interface ConversationWithDetails extends Conversation {
  participants: {
    user: Profile;
    last_read_at: string | null;
  }[];
  messages: Message[];
}

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentUserId: string;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  currentUserId,
}: ConversationListProps) {
  return (
    <div className="space-y-1">
      {conversations.map((conversation) => {
        const otherParticipant = conversation.participants.find(
          (p) => p.user?.id !== currentUserId
        );
        const otherUser = otherParticipant?.user;
        const lastMessage = conversation.messages?.[conversation.messages.length - 1];
        const myParticipant = conversation.participants.find(
          (p) => p.user?.id === currentUserId
        );
        const hasUnread =
          lastMessage &&
          myParticipant?.last_read_at &&
          new Date(lastMessage.created_at) > new Date(myParticipant.last_read_at);

        return (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
              selectedId === conversation.id
                ? "bg-primary/10 border border-primary/30"
                : "hover:bg-surface-light"
            }`}
          >
            <Avatar
              src={otherUser?.avatar_url}
              alt={otherUser?.display_name || otherUser?.username || "User"}
              size="md"
              status={otherUser?.is_online ? "online" : "offline"}
              showStatus
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text truncate">
                  {conversation.type === "group"
                    ? conversation.name || "Group Chat"
                    : otherUser?.display_name || otherUser?.username || "Unknown"}
                </span>
                {lastMessage && (
                  <span className="text-xs text-text-muted shrink-0">
                    {formatRelativeTime(lastMessage.created_at)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-0.5">
                <p className="text-sm text-text-muted truncate">
                  {lastMessage?.content || "No messages yet"}
                </p>
                {hasUnread && (
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0 ml-2" />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
