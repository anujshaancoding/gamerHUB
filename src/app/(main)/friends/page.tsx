"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  UserCheck,
  Search,
  X,
  Clock,
  Check,
  Loader2,
  FileText,
  Filter,
  Calendar,
} from "lucide-react";
import { Button, Input, Card, Avatar, Badge } from "@/components/ui";
import { useFriends, useFriendRequests, useSocialCounts } from "@/lib/hooks/useFriends";
import { useFollowing, useFollowers } from "@/lib/hooks/useFollowing";
import { useAuth } from "@/lib/hooks/useAuth";
import { FriendCard } from "@/components/friends/friend-card";
import { FollowCard } from "@/components/friends/follow-card";
import { FriendPostCard } from "@/components/friends/friend-post-card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/db/client-browser";
import { STALE_TIMES } from "@/lib/query/provider";
import { friendPostKeys, useLikeFriendPost } from "@/lib/hooks/useFriendPosts";

type TabType = "friends" | "requests" | "following" | "followers" | "posts";

interface FriendPost {
  id: string;
  content: string;
  image_url?: string;
  user_id: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "friends", label: "Friends", icon: UserCheck },
  { id: "requests", label: "Requests", icon: UserPlus },
  { id: "following", label: "Following", icon: Users },
  { id: "followers", label: "Followers", icon: Users },
  { id: "posts", label: "Posts", icon: FileText },
];

function FriendsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const db = createClient();
  const queryClient = useQueryClient();
  const { toggleLike: toggleFriendPostLike } = useLikeFriendPost();

  const initialTab = (searchParams.get("tab") as TabType) || "friends";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Posts tab state
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [postFilterBy, setPostFilterBy] = useState<"all" | "friends" | "following">("all");
  const [postDateFilter, setPostDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [showFilters, setShowFilters] = useState(false);

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
  } = useFriendRequests({ type: "received", userId: user?.id });
  const {
    requests: sentRequests,
    loading: sentLoading,
    cancelRequest,
    refetch: refetchSentRequests,
  } = useFriendRequests({ type: "sent", userId: user?.id });
  const { following, loading: followingLoading } = useFollowing({ userId: user?.id });
  const { followers, loading: followersLoading } = useFollowers({ userId: user?.id });

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch posts with React Query — cached across navigations
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: friendPostKeys.list(false),
    queryFn: async () => {
      const res = await fetch(`/api/friend-posts?limit=50`);
      if (!res.ok) throw new Error("Failed to load posts");
      const { posts } = await res.json();
      return (posts || []) as FriendPost[];
    },
    staleTime: STALE_TIMES.FRIEND_POSTS,
    enabled: activeTab === "posts" && !!user,
  });

  // Get friend and following user IDs for filtering
  const friendUserIds = useMemo(() => {
    return new Set(friends.map((f: { friend_id: string }) => f.friend_id));
  }, [friends]);

  const followingUserIds = useMemo(() => {
    return new Set(following.map((f: { id: string }) => f.id));
  }, [following]);

  // Filter posts based on search, person filter, and date filter
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Filter by person type
    if (postFilterBy === "friends") {
      result = result.filter((post) => friendUserIds.has(post.user_id));
    } else if (postFilterBy === "following") {
      result = result.filter((post) => followingUserIds.has(post.user_id));
    }

    // Filter by date
    if (postDateFilter !== "all") {
      const now = new Date();
      let cutoff: Date;
      switch (postDateFilter) {
        case "today":
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
      result = result.filter((post) => new Date(post.created_at) >= cutoff);
    }

    // Filter by search query (matches content, username, or display name)
    if (postSearchQuery.trim()) {
      const query = postSearchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.content.toLowerCase().includes(query) ||
          post.user?.username?.toLowerCase().includes(query) ||
          post.user?.display_name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [posts, postFilterBy, postDateFilter, postSearchQuery, friendUserIds, followingUserIds]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/friends?tab=${tab}`, { scroll: false });
  };

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    await acceptRequest(requestId);
    await Promise.all([refetchCounts(), refetchFriends(), refetchRequests(), refetchSentRequests()]);
    setActionLoading(null);
  };

  const handleDecline = async (requestId: string) => {
    setActionLoading(requestId);
    await declineRequest(requestId);
    await Promise.all([refetchCounts(), refetchRequests()]);
    setActionLoading(null);
  };

  const handleCancel = async (requestId: string) => {
    setActionLoading(requestId);
    await cancelRequest(requestId);
    await Promise.all([refetchCounts(), refetchSentRequests()]);
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

      {/* Search (for friends tab) */}
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

      {/* Search & Filters (for posts tab) */}
      {activeTab === "posts" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search posts by keyword, friend name..."
                value={postSearchQuery}
                onChange={(e) => setPostSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                rightIcon={
                  postSearchQuery && (
                    <button onClick={() => setPostSearchQuery("")}>
                      <X className="h-4 w-4 hover:text-primary" />
                    </button>
                  )
                }
              />
            </div>
            <Button
              variant={showFilters ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="h-4 w-4" />}
              className="flex-shrink-0"
            >
              Filters
            </Button>
          </div>

          {/* Filter options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="p-4 space-y-4">
                  {/* Filter by person */}
                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-2 block">
                      Show posts from
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "all" as const, label: "Everyone" },
                        { id: "friends" as const, label: "Friends Only" },
                        { id: "following" as const, label: "Following Only" },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setPostFilterBy(option.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                            postFilterBy === option.id
                              ? "bg-primary/10 text-primary border border-primary/30"
                              : "bg-surface-light text-text-secondary hover:text-text border border-transparent"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter by date */}
                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-2 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Time period
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "all" as const, label: "All time" },
                        { id: "today" as const, label: "Today" },
                        { id: "week" as const, label: "This week" },
                        { id: "month" as const, label: "This month" },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setPostDateFilter(option.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                            postDateFilter === option.id
                              ? "bg-primary/10 text-primary border border-primary/30"
                              : "bg-surface-light text-text-secondary hover:text-text border border-transparent"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear filters */}
                  {(postFilterBy !== "all" || postDateFilter !== "all" || postSearchQuery) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPostFilterBy("all");
                        setPostDateFilter("all");
                        setPostSearchQuery("");
                      }}
                      leftIcon={<X className="h-3.5 w-3.5" />}
                    >
                      Clear all filters
                    </Button>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filter badges */}
          {(postFilterBy !== "all" || postDateFilter !== "all") && !showFilters && (
            <div className="flex flex-wrap gap-2">
              {postFilterBy !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                  {postFilterBy === "friends" ? "Friends only" : "Following only"}
                  <button onClick={() => setPostFilterBy("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {postDateFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                  {postDateFilter === "today" ? "Today" : postDateFilter === "week" ? "This week" : "This month"}
                  <button onClick={() => setPostDateFilter("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
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
                        <Link href={request.sender?.username ? `/profile/${request.sender.username}` : "#"}>
                          <Avatar
                            src={request.sender?.avatar_url}
                            alt={request.sender?.display_name || request.sender?.username || "User"}
                            size="lg"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={request.sender?.username ? `/profile/${request.sender.username}` : "#"}>
                            <p className="font-semibold text-text hover:text-primary transition-colors">
                              {request.sender?.display_name || request.sender?.username}
                            </p>
                          </Link>
                          <p className="text-sm text-text-muted">@{request.sender?.username}</p>
                          {request.message && (
                            <p className="text-sm text-text-secondary mt-1 italic">
                              &ldquo;{request.message}&rdquo;
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
                        <Link href={request.recipient?.username ? `/profile/${request.recipient.username}` : "#"}>
                          <Avatar
                            src={request.recipient?.avatar_url}
                            alt={request.recipient?.display_name || request.recipient?.username || "User"}
                            size="lg"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={request.recipient?.username ? `/profile/${request.recipient.username}` : "#"}>
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
            {followingLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : following.length === 0 ? (
              <Card className="text-center py-12">
                <Users className="h-16 w-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text mb-2">Not following anyone</h3>
                <p className="text-text-muted max-w-md mx-auto mb-4">
                  Follow other gamers to see their updates
                </p>
                <Link href="/find-gamers">
                  <Button variant="primary">Find Gamers</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {following.map((profile) => (
                  <FollowCard key={profile.id} profile={profile} type="following" />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "followers" && (
          <motion.div
            key="followers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {followersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : followers.length === 0 ? (
              <Card className="text-center py-12">
                <Users className="h-16 w-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text mb-2">No followers yet</h3>
                <p className="text-text-muted max-w-md mx-auto">
                  When other gamers follow you, they&apos;ll appear here
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {followers.map((profile) => (
                  <FollowCard key={profile.id} profile={profile} type="follower" />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "posts" && (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {postsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card className="text-center py-12">
                <FileText className="h-16 w-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text mb-2">
                  {posts.length === 0 ? "No posts yet" : "No posts match your filters"}
                </h3>
                <p className="text-text-muted max-w-md mx-auto mb-4">
                  {posts.length === 0
                    ? "Head over to the Community page to create your first post!"
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
                {posts.length === 0 ? (
                  <Link href="/community">
                    <Button variant="primary">Go to Community</Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPostSearchQuery("");
                      setPostFilterBy("all");
                      setPostDateFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Card>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                <p className="text-sm text-text-muted">
                  {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"} found
                </p>
                {filteredPosts.map((post, index) => (
                  <FriendPostCard
                    key={post.id}
                    post={post}
                    index={index}
                    onLike={async () => {
                      await toggleFriendPostLike(post.id);
                    }}
                    onShare={async () => {
                      const url = `${window.location.origin}/community?tab=friends`;
                      if (navigator.share) {
                        await navigator.share({
                          title: `Post by ${post.user?.display_name || post.user?.username}`,
                          text: post.content.slice(0, 100),
                          url,
                        });
                      } else {
                        await navigator.clipboard.writeText(url);
                      }
                    }}
                    onDelete={async () => {
                      const res = await fetch(`/api/friend-posts/${post.id}`, {
                        method: "DELETE",
                      });
                      if (!res.ok) throw new Error("Failed to delete post");
                      queryClient.invalidateQueries({ queryKey: friendPostKeys.all });
                    }}
                  />
                ))}
              </div>
            )}
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
