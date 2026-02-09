"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  Check,
  Loader2,
  RefreshCw,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiscordIntegration } from "@/lib/hooks/useDiscordIntegration";
import { getDiscordAvatarUrl, type DiscordFriend } from "@/types/discord";
import Link from "next/link";

interface DiscordFriendsImportProps {
  onFriendClick?: (friend: DiscordFriend) => void;
}

export function DiscordFriendsImport({
  onFriendClick,
}: DiscordFriendsImportProps) {
  const {
    status,
    friends,
    isLoadingFriends,
    importFriends,
    isImporting,
    sendInvite,
  } = useDiscordIntegration();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "matched" | "unmatched">("all");
  const [inviteSending, setInviteSending] = useState<string | null>(null);

  if (!status?.connected) {
    return (
      <div className="p-6 text-center border border-dashed border-border rounded-xl">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-medium mb-1">Connect Discord</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your Discord account to find friends on GamerHub
        </p>
        <Button asChild>
          <Link href="/settings/connections">Connect Discord</Link>
        </Button>
      </div>
    );
  }

  const handleImport = async () => {
    await importFriends();
  };

  const handleSendInvite = async (friendId: string) => {
    setInviteSending(friendId);
    try {
      await sendInvite(friendId);
    } finally {
      setInviteSending(null);
    }
  };

  const filteredFriends = friends?.filter((friend) => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const username = friend.discord_friend_username?.toLowerCase() || "";
      const ghUsername =
        friend.gamerhub_user?.username?.toLowerCase() || "";
      if (!username.includes(query) && !ghUsername.includes(query)) {
        return false;
      }
    }

    // Apply match filter
    if (filter === "matched" && !friend.is_matched) return false;
    if (filter === "unmatched" && friend.is_matched) return false;

    return true;
  });

  const matchedCount = friends?.filter((f) => f.is_matched).length || 0;
  const unmatchedCount = friends?.filter((f) => !f.is_matched).length || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Discord Friends</h3>
          <p className="text-sm text-muted-foreground">
            {matchedCount} friends found on GamerHub
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleImport}
          disabled={isImporting}
        >
          {isImporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm"
          />
        </div>

        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(["all", "matched", "unmatched"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {f === "all"
                ? "All"
                : f === "matched"
                ? `On GamerHub (${matchedCount})`
                : `Not Found (${unmatchedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Friends List */}
      {isLoadingFriends ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !filteredFriends || filteredFriends.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">
            {friends && friends.length > 0
              ? "No matching friends"
              : "No Discord friends found"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {friends && friends.length > 0
              ? "Try adjusting your search or filters"
              : "Click Refresh to import friends from mutual Discord servers"}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {filteredFriends.map((friend, index) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              {/* Avatar */}
              <div className="relative">
                <img
                  src={getDiscordAvatarUrl(
                    friend.discord_friend_id,
                    friend.discord_friend_avatar
                  )}
                  alt={friend.discord_friend_username || "Discord Friend"}
                  className="w-10 h-10 rounded-full"
                />
                {friend.is_matched && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {friend.discord_friend_username}
                </div>
                {friend.is_matched && friend.gamerhub_user ? (
                  <div className="text-sm text-muted-foreground truncate">
                    @{friend.gamerhub_user.username} on GamerHub
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Not on GamerHub
                  </div>
                )}
              </div>

              {/* Actions */}
              {friend.is_matched && friend.gamerhub_user ? (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  onClick={() => onFriendClick?.(friend)}
                >
                  <Link href={`/profile/${friend.gamerhub_user.username}`}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSendInvite(friend.id)}
                  disabled={
                    friend.invite_sent || inviteSending === friend.id
                  }
                >
                  {inviteSending === friend.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : friend.invite_sent ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Invited
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-1" />
                      Invite
                    </>
                  )}
                </Button>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Summary */}
      {friends && friends.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-border text-sm text-muted-foreground">
          <span>
            Showing {filteredFriends?.length || 0} of {friends.length} friends
          </span>
          <span>{matchedCount} already on GamerHub</span>
        </div>
      )}
    </div>
  );
}
