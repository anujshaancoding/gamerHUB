"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  X,
  MessageCircle,
  Clock,
  Check,
  Loader2,
} from "lucide-react";
import { Button, Input, Card, Avatar, Badge } from "@/components/ui";
import { useFriends, useFriendRequests, useSocialCounts } from "@/lib/hooks/useFriends";
import { useAuth } from "@/lib/hooks/useAuth";
import { FriendCard } from "@/components/friends/friend-card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type TabType = "friends" | "requests" | "following" | "followers";

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "friends", label: "Friends", icon: UserCheck },
  { id: "requests", label: "Requests", icon: UserPlus },
  { id: "following", label: "Following", icon: Users },
  { id: "followers", label: "Followers", icon: Users },
];

function FriendsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const initialTab = (searchParams.get("tab") as TabType) || "friends";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch data
  const { counts, refetch: refetchCounts } = useSocialCounts(user?.id);
  const { friends, loading: friendsLoading, refetch: refetchFriends } = useFriends({
    userId: user?.id,
    search: searchQuery,
  });
  const {
    requests: receivedRequests,
    loading: requestsLoading,
    acceptRequest,
    declineRequest,
    refetch: refetchRequests,
  } = useFriendRequests({ type: "received" });
  const {
    requests: sentRequests,
    loading: sentLoading,
    cancelRequest,
    refetch: refetchSentRequests,
  } = useFriendRequests({ type: "sent" });

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/friends?tab=${tab}`, { scroll: false });
  };

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    await acceptRequest(requestId);
    await Promise.all([refetchCounts(), refetchFriends(), refetchRequests()]);
    setActionLoading(null);
  };

  const handleDecline = async (requestId: string) => {
    setActionLoading(requestId);
    await declineRequest(requestId);
    await refetchCounts();
    setActionLoading(null);
  };

  const handleCancel = async (requestId: string) => {
    setActionLoading(requestId);
    await cancelRequest(requestId);
    await refetchCounts();
    setActionLoading(null);
  };

  if (!user) {
    return (
      <Card className="text-center py-12">
        <Users className="h-16 w-16 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text mb-2">Sign in to see your friends</h3>
        <p className="text-text-muted max-w-md mx-auto mb-4">
          Connect with other gamers and build your network
        </p>
        <Link href="/login">
          <Button variant="primary">Log In</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Friends</h1>
          <p className="text-text-muted mt-1">
            Manage your connections and friend requests
          </p>
        </div>
        <Link href="/find-gamers">
          <Button variant="primary" leftIcon={<UserPlus className="h-4 w-4" />}>
            Find Gamers
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{counts.friends}</p>
          <p className="text-sm text-text-muted">Friends</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-warning">{counts.pending_requests}</p>
          <p className="text-sm text-text-muted">Pending Requests</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{counts.following}</p>
          <p className="text-sm text-text-muted">Following</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-success">{counts.followers}</p>
          <p className="text-sm text-text-muted">Followers</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-primary/10 text-primary"
                : "text-text-secondary hover:text-text hover:bg-surface-light"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.id === "requests" && counts.pending_requests > 0 && (
              <Badge variant="primary" size="sm">{counts.pending_requests}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Search (only for friends tab) */}
      {activeTab === "friends" && (
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            rightIcon={
              searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="h-4 w-4 hover:text-primary" />
                </button>
              )
            }
          />
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "friends" && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {friendsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : friends.length === 0 ? (
              <Card className="text-center py-12">
                <UserCheck className="h-16 w-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text mb-2">No friends yet</h3>
                <p className="text-text-muted max-w-md mx-auto mb-4">
                  Start connecting with other gamers to build your network
                </p>
                <Link href="/find-gamers">
                  <Button variant="primary">Find Gamers</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <FriendCard key={friend.friend_id} friend={friend} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "requests" && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Received Requests */}
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">Received Requests</h3>
              {requestsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : receivedRequests.length === 0 ? (
                <Card className="text-center py-8">
                  <p className="text-text-muted">No pending requests</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {receivedRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center gap-4">
                        <Link href={`/profile/${request.sender?.username}`}>
                          <Avatar
                            src={request.sender?.avatar_url}
                            alt={request.sender?.display_name || request.sender?.username || "User"}
                            size="lg"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${request.sender?.username}`}>
                            <p className="font-semibold text-text hover:text-primary transition-colors">
                              {request.sender?.display_name || request.sender?.username}
                            </p>
                          </Link>
                          <p className="text-sm text-text-muted">@{request.sender?.username}</p>
                          {request.message && (
                            <p className="text-sm text-text-secondary mt-1 italic">
                              "{request.message}"
                            </p>
                          )}
                          <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAccept(request.id)}
                            disabled={actionLoading === request.id}
                            leftIcon={actionLoading === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDecline(request.id)}
                            disabled={actionLoading === request.id}
                            leftIcon={<X className="h-4 w-4" />}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Sent Requests */}
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">Sent Requests</h3>
              {sentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : sentRequests.length === 0 ? (
                <Card className="text-center py-8">
                  <p className="text-text-muted">No pending sent requests</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center gap-4">
                        <Link href={`/profile/${request.recipient?.username}`}>
                          <Avatar
                            src={request.recipient?.avatar_url}
                            alt={request.recipient?.display_name || request.recipient?.username || "User"}
                            size="lg"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${request.recipient?.username}`}>
                            <p className="font-semibold text-text hover:text-primary transition-colors">
                              {request.recipient?.display_name || request.recipient?.username}
                            </p>
                          </Link>
                          <p className="text-sm text-text-muted">@{request.recipient?.username}</p>
                          <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Sent {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(request.id)}
                          disabled={actionLoading === request.id}
                          leftIcon={actionLoading === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        >
                          Cancel
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "following" && (
          <motion.div
            key="following"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="text-center py-12">
              <Users className="h-16 w-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">Following</h3>
              <p className="text-text-muted max-w-md mx-auto">
                Users you follow will appear here
              </p>
            </Card>
          </motion.div>
        )}

        {activeTab === "followers" && (
          <motion.div
            key="followers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="text-center py-12">
              <Users className="h-16 w-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">Followers</h3>
              <p className="text-text-muted max-w-md mx-auto">
                Users who follow you will appear here
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <FriendsContent />
    </Suspense>
  );
}
