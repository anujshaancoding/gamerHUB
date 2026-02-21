"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PenSquare,
  Users,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  X,
  BookOpen,
  Clock,
  Eye,
  CheckCircle,
  Gamepad2,
  Trophy,
  Lock,
  UserPlus,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Avatar,
  RelativeTime,
} from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { TournamentsTab } from "@/components/community/TournamentsTab";
import { CreateListingModal } from "@/components/community/CreateListingModal";
import { ListingDetailModal } from "@/components/community/ListingDetailModal";
import { FriendPostCard } from "@/components/friends/friend-post-card";
import type { CommunityListing } from "@/types/listings";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image?: string;
  author_id: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  views_count?: number;
  read_time_minutes?: number;
  category?: string;
  game?: string;
  tags?: string[];
  author?: {
    id?: string;
    username: string;
    display_name: string;
    avatar_url: string;
    is_verified?: boolean;
  };
}

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
    is_verified?: boolean;
  };
}

const supabase = createClient();

export default function CommunityPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"author" | "tournaments" | "friends">("author");
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [friendPosts, setFriendPosts] = useState<FriendPost[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchCounterRef = useRef(0);

  // Tournament/Giveaway listing state
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<CommunityListing | null>(null);

  // New post state
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchContent = useCallback(async () => {
    const fetchId = ++fetchCounterRef.current;

    try {
      if (activeTab === "author") {
        // Fetch published blog posts (real user-created content only)
        const { data: posts } = await supabase
          .from("blog_posts")
          .select(`
            id, title, slug, excerpt, featured_image_url, category, tags,
            published_at, views_count, likes_count, comments_count,
            created_at,
            author:profiles!blog_posts_author_id_fkey(id, username, display_name, avatar_url)
          `)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(20);

        // Ignore stale result if a newer fetch was triggered
        if (fetchId !== fetchCounterRef.current) return;

        const blogPostsMapped: BlogPost[] = (posts || []).map((post: Record<string, unknown>) => ({
          id: post.id as string,
          title: post.title as string,
          excerpt: post.excerpt as string,
          content: "",
          cover_image: post.featured_image_url as string | undefined,
          author_id: "",
          created_at: post.created_at as string,
          likes_count: post.likes_count as number,
          comments_count: post.comments_count as number,
          views_count: post.views_count as number,
          category: (post.category as string) || "",
          tags: post.tags as string[],
          author: post.author as BlogPost["author"],
        }));

        setBlogPosts(blogPostsMapped);
      } else {
        // Fetch friend posts — guests only see verified/public-figure posts (limited to 4)
        const isGuest = !user;
        let query = supabase
          .from("friend_posts")
          .select(`
            *,
            user:profiles!friend_posts_user_id_fkey(username, display_name, avatar_url, is_verified)
          `)
          .order("created_at", { ascending: false });

        if (isGuest) {
          query = query.eq("user.is_verified", true).limit(4);
        } else {
          query = query.limit(20);
        }

        const { data } = await query;

        // Ignore stale result if a newer fetch was triggered
        if (fetchId !== fetchCounterRef.current) return;

        // Supabase inner-filter on joined table can return rows with user: null, filter those out for guests
        const posts = isGuest
          ? (data || []).filter((p: FriendPost) => p.user !== null)
          : (data || []);
        setFriendPosts(posts);
      }
    } catch (error) {
      if (fetchId !== fetchCounterRef.current) return;
      console.error("Error fetching content:", error);
    } finally {
      if (fetchId === fetchCounterRef.current) {
        setLoading(false);
      }
    }
  }, [activeTab, user?.id]);

  // Fetch on mount, tab change, or auth settlement
  useEffect(() => {
    if (authLoading) return;
    if (activeTab !== "author" && activeTab !== "friends") return;

    setLoading(true);
    fetchContent();
  }, [fetchContent, authLoading, activeTab]);

  // Safety net: if loading is stuck for 10 seconds, force it off
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 10_000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedImage) return;
    if (!user) return;

    setIsPosting(true);
    try {
      let imageUrl = null;

      if (selectedImage) {
        const fileExt = selectedImage.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("post-images")
          .upload(fileName, selectedImage);

        if (!uploadError && data) {
          const { data: publicUrl } = supabase.storage
            .from("post-images")
            .getPublicUrl(fileName);
          imageUrl = publicUrl.publicUrl;
        }
      }

      const { error } = await supabase.from("friend_posts").insert({
        user_id: user.id,
        content: newPostContent,
        image_url: imageUrl,
        likes_count: 0,
        comments_count: 0,
      });

      if (!error) {
        setNewPostContent("");
        removeImage();
        fetchContent();
      }
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const tabs = [
    { id: "author" as const, label: "Articles", icon: BookOpen },
    { id: "tournaments" as const, label: "Tournaments", icon: Trophy },
    { id: "friends" as const, label: "Friends", icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Community</h1>
          <p className="text-text-muted mt-1">
            Connect with fellow gamers, share your stories, and discover new content
          </p>
        </div>
        {activeTab === "author" && (
          <Link href="/write">
            <Button leftIcon={<PenSquare className="h-4 w-4" />}>
              Write Article
            </Button>
          </Link>
        )}
        {activeTab === "tournaments" && (
          <Button
            leftIcon={<Trophy className="h-4 w-4" />}
            onClick={() => setShowCreateListingModal(true)}
          >
            Create Listing
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
              activeTab === tab.id
                ? "bg-primary/10 text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text hover:bg-surface-light"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "tournaments" ? (
        <TournamentsTab
          onCreateClick={() => setShowCreateListingModal(true)}
          onListingClick={(listing) => setSelectedListing(listing)}
        />
      ) : loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : activeTab === "author" ? (
        /* Author Section - Blog Posts */
        <div className="space-y-6">
          {blogPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">
                No articles yet
              </h3>
              <p className="text-text-muted mb-4">
                Be the first to share your gaming experiences and insights!
              </p>
              <Link href="/write">
                <Button>Write Your First Article</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {blogPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/community/post/${post.id}`}>
                    <Card className="overflow-hidden hover:border-primary transition-colors cursor-pointer h-full">
                      {post.cover_image && (
                        <div className="aspect-video bg-surface-light relative">
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `/images/banners/gaming-${(index % 5) + 1}.svg`; }}
                          />
                          {/* Game badge overlay */}
                          {post.game && (
                            <div className="absolute top-3 left-3">
                              <span className={cn(
                                "px-2 py-1 rounded text-xs font-semibold uppercase",
                                post.game === "valorant" ? "bg-red-500/90 text-white" :
                                post.game === "bgmi" ? "bg-orange-500/90 text-white" :
                                post.game === "freefire" ? "bg-yellow-500/90 text-black" :
                                "bg-primary/90 text-white"
                              )}>
                                <Gamepad2 className="h-3 w-3 inline mr-1" />
                                {post.game}
                              </span>
                            </div>
                          )}
                          {/* Category badge */}
                          {post.category && (
                            <div className="absolute top-3 right-3">
                              <span className="px-2 py-1 rounded text-xs font-medium bg-background/80 text-text capitalize">
                                {post.category}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar
                            src={post.author?.avatar_url}
                            alt={post.author?.display_name || post.author?.username || "Author"}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text flex items-center gap-1">
                              {post.author?.display_name || post.author?.username}
                              {post.author?.is_verified && (
                                <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              )}
                            </p>
                            <p className="text-xs text-text-muted flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <RelativeTime date={post.created_at} />
                              {post.read_time_minutes && (
                                <>
                                  <span className="mx-1">·</span>
                                  {post.read_time_minutes} min read
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-text mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-text-muted text-sm line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-text-muted text-sm">
                          {post.views_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {post.views_count.toLocaleString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.comments_count}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Friends Section - Social Posts with Glassmorphism */
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Create Post Composer - Only for logged-in users */}
          {user && (
            <div className="rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex gap-3">
                  <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.display_name || profile?.username || "You"}
                    size="md"
                  />
                  <div className="flex-1 space-y-3">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="What's on your mind? Share your gaming moments..."
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-text placeholder-text-dim resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                      rows={3}
                    />

                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-48 rounded-xl border border-white/[0.08]"
                        />
                        <button
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors"
                        >
                          <X className="h-3.5 w-3.5 text-white" />
                        </button>
                      </div>
                    )}

                    {/* Character count + Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageSelect}
                          accept="image/*"
                          className="hidden"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          leftIcon={<ImageIcon className="h-4 w-4" />}
                          className="text-text-muted hover:text-primary"
                        >
                          Add Image
                        </Button>
                        {newPostContent.length > 0 && (
                          <span className={cn(
                            "text-xs",
                            newPostContent.length > 500 ? "text-warning" : "text-text-dim"
                          )}>
                            {newPostContent.length}/500
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={handleCreatePost}
                        disabled={(!newPostContent.trim() && !selectedImage) || isPosting}
                      >
                        {isPosting ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Posts Feed */}
          {friendPosts.length === 0 ? (
            <div className="rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] p-8 text-center">
              <Users className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">
                {user ? "No posts yet" : "No featured posts"}
              </h3>
              <p className="text-text-muted">
                {user
                  ? "Be the first to share something with the community!"
                  : "Sign up to see posts from the community and share your own!"}
              </p>
              {!user && (
                <div className="mt-4 flex gap-3 justify-center">
                  <Link href="/register">
                    <Button leftIcon={<UserPlus className="h-4 w-4" />}>
                      Sign Up
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline">Log In</Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {friendPosts.map((post, index) => (
                <FriendPostCard
                  key={post.id}
                  post={post}
                  index={index}
                  isGuest={!user}
                  onLike={async () => {
                    const { data } = await supabase
                      .from("friend_posts")
                      .select("likes_count")
                      .eq("id", post.id)
                      .single();
                    const { error } = await supabase
                      .from("friend_posts")
                      .update({ likes_count: (data?.likes_count || 0) + 1 })
                      .eq("id", post.id);
                    if (error) throw error;
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
                />
              ))}

              {/* Guest sign-up CTA after posts */}
              {!user && friendPosts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: friendPosts.length * 0.05 + 0.1 }}
                  className="rounded-2xl backdrop-blur-xl bg-gradient-to-br from-primary/[0.08] to-accent/[0.08] border border-primary/20 p-6 text-center"
                >
                  <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-text mb-1">
                    Want to see more?
                  </h3>
                  <p className="text-text-muted text-sm mb-4">
                    Sign up to see all posts, follow your favorite gamers, and share your own moments.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/register">
                      <Button leftIcon={<UserPlus className="h-4 w-4" />}>
                        Create Account
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline">Sign In</Button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tournament/Giveaway Modals */}
      <CreateListingModal
        isOpen={showCreateListingModal}
        onClose={() => setShowCreateListingModal(false)}
      />
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          isOpen={!!selectedListing}
          onClose={() => setSelectedListing(null)}
          isCreator={selectedListing.creator_id === user?.id}
        />
      )}
    </div>
  );
}
