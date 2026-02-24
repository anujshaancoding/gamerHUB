"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PenSquare,
  Users,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  X,
  BookOpen,
  Clock,
  Eye,
  CheckCircle,
  Gamepad2,
  Trophy,
  Lock,
  UserPlus,
  Newspaper,
  ExternalLink,
  Star,
  Pin,
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
import { FriendPostCard } from "@/components/friends/friend-post-card";
import { STALE_TIMES } from "@/lib/query/provider";
import { blogKeys } from "@/lib/hooks/useBlog";
import { friendPostKeys, useLikeFriendPost } from "@/lib/hooks/useFriendPosts";
import { NEWS_CATEGORIES } from "@/types/news";
import type { NewsArticle } from "@/types/news";
import type { CommunityListing } from "@/types/listings";

const TournamentsTab = dynamic(
  () => import("@/components/community/TournamentsTab").then((mod) => mod.TournamentsTab),
  {
    ssr: false,
    loading: () => (
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-surface-light animate-pulse" />
        ))}
      </div>
    ),
  }
);

const CreateListingModal = dynamic(
  () => import("@/components/community/CreateListingModal").then((mod) => mod.CreateListingModal),
  { ssr: false }
);

const ListingDetailModal = dynamic(
  () => import("@/components/community/ListingDetailModal").then((mod) => mod.ListingDetailModal),
  { ssr: false }
);

export interface BlogPost {
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

export interface FriendPost {
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

// Query keys for news in community context
const newsKeys = {
  all: ["community-news"] as const,
  published: () => ["community-news", "published"] as const,
};

type TabId = "news" | "blog" | "tournaments" | "friends";

interface CommunityPageClientProps {
  initialBlogPosts: BlogPost[];
  initialFriendPosts: FriendPost[];
  initialNewsArticles: NewsArticle[];
}

export function CommunityPageClient({
  initialBlogPosts,
  initialFriendPosts,
  initialNewsArticles,
}: CommunityPageClientProps) {
  const { user, profile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toggleLike: toggleFriendPostLike } = useLikeFriendPost();
  const [activeTab, setActiveTab] = useState<TabId>("news");

  // Tournament/Giveaway listing state
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<CommunityListing | null>(null);

  // New post state
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // News articles query
  const {
    data: newsArticles = [],
    isLoading: newsLoading,
    error: newsError,
  } = useQuery({
    queryKey: newsKeys.published(),
    queryFn: async () => {
      const res = await fetch("/api/news?limit=20");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch news");
      return json.articles as NewsArticle[];
    },
    staleTime: STALE_TIMES.NEWS_ARTICLES,
    enabled: activeTab === "news",
    initialData: initialNewsArticles.length > 0 ? initialNewsArticles : undefined,
  });

  // Blog posts query
  const {
    data: blogPosts = [],
    isLoading: blogLoading,
    error: blogError,
  } = useQuery({
    queryKey: blogKeys.posts(),
    queryFn: async () => {
      const { data: posts, error: queryError } = await supabase
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

      if (queryError) throw new Error(queryError.message);

      return (posts || []).map((post: Record<string, unknown>): BlogPost => ({
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
    },
    staleTime: STALE_TIMES.BLOG_POSTS,
    enabled: activeTab === "blog",
    initialData: initialBlogPosts.length > 0 ? initialBlogPosts : undefined,
  });

  // Friend posts query
  const isGuest = !user;
  const {
    data: friendPosts = [],
    isLoading: friendLoading,
    error: friendError,
  } = useQuery({
    queryKey: friendPostKeys.list(isGuest),
    queryFn: async () => {
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

      const { data, error: queryError } = await query;
      if (queryError) throw new Error(queryError.message);

      return isGuest
        ? (data || []).filter((p: FriendPost) => p.user !== null)
        : (data || []);
    },
    staleTime: STALE_TIMES.FRIEND_POSTS,
    enabled: activeTab === "friends",
    initialData: initialFriendPosts.length > 0 ? initialFriendPosts : undefined,
  });

  const loading =
    activeTab === "news" ? newsLoading :
    activeTab === "blog" ? blogLoading :
    activeTab === "friends" ? friendLoading :
    false;

  const fetchError = newsError || blogError || friendError;

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
        queryClient.invalidateQueries({ queryKey: friendPostKeys.all });
      }
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "news", label: "News", icon: Newspaper },
    { id: "blog", label: "Blog", icon: BookOpen },
    { id: "tournaments", label: "Tournaments/Giveaways", icon: Trophy },
    { id: "friends", label: "Friends", icon: Users },
  ];

  const getGameColor = (game: string) => {
    switch (game) {
      case "valorant": return "bg-red-500/90 text-white";
      case "bgmi": return "bg-orange-500/90 text-white";
      case "freefire": return "bg-yellow-500/90 text-black";
      default: return "bg-primary/90 text-white";
    }
  };

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
        {activeTab === "blog" && (
          <Link href="/write">
            <Button leftIcon={<PenSquare className="h-4 w-4" />}>
              Write Blog Post
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

      {/* Fetch error */}
      {fetchError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <strong>Fetch error:</strong> {fetchError.message}
        </div>
      )}

      {/* Content */}
      {activeTab === "tournaments" ? (
        <TournamentsTab
          onCreateClick={() => setShowCreateListingModal(true)}
          onListingClick={(listing) => setSelectedListing(listing)}
        />
      ) : loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden animate-pulse">
              <div className="aspect-video bg-surface-light" />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-light" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 bg-surface-light rounded" />
                    <div className="h-2.5 w-16 bg-surface-light rounded" />
                  </div>
                </div>
                <div className="h-5 w-3/4 bg-surface-light rounded" />
                <div className="h-3 w-full bg-surface-light rounded" />
                <div className="h-3 w-2/3 bg-surface-light rounded" />
                <div className="flex gap-4 pt-1">
                  <div className="h-3 w-12 bg-surface-light rounded" />
                  <div className="h-3 w-12 bg-surface-light rounded" />
                  <div className="h-3 w-12 bg-surface-light rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "news" ? (
        /* News Section */
        <div className="space-y-6">
          {newsArticles.length === 0 ? (
            <Card className="p-8 text-center">
              <Newspaper className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">
                No news yet
              </h3>
              <p className="text-text-muted">
                Stay tuned for the latest gaming news and updates!
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {newsArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
                >
                  <Link
                    href={`/news/${article.id}`}
                    className="block"
                  >
                    <Card className="overflow-hidden hover:border-primary transition-colors cursor-pointer h-full">
                      {article.thumbnail_url ? (
                        <div className="aspect-video bg-surface-light relative">
                          <Image
                            src={article.thumbnail_url}
                            alt={article.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority={index < 2}
                            unoptimized
                          />
                          {/* Game badge */}
                          <div className="absolute top-3 left-3">
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-semibold uppercase",
                              getGameColor(article.game_slug)
                            )}>
                              <Gamepad2 className="h-3 w-3 inline mr-1" />
                              {article.game_slug}
                            </span>
                          </div>
                          {/* Category badge */}
                          <div className="absolute top-3 right-3 flex gap-1.5">
                            {article.is_pinned && (
                              <span className="px-1.5 py-1 rounded bg-yellow-500/90 text-black">
                                <Pin className="h-3 w-3" />
                              </span>
                            )}
                            {article.is_featured && (
                              <span className="px-1.5 py-1 rounded bg-purple-500/90 text-white">
                                <Star className="h-3 w-3" />
                              </span>
                            )}
                            <span className="px-2 py-1 rounded text-xs font-medium bg-background/80 text-text capitalize">
                              {NEWS_CATEGORIES[article.category]?.label || article.category}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-surface-light relative flex items-center justify-center">
                          <Newspaper className="h-12 w-12 text-text-dim" />
                          <div className="absolute top-3 left-3">
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-semibold uppercase",
                              getGameColor(article.game_slug)
                            )}>
                              <Gamepad2 className="h-3 w-3 inline mr-1" />
                              {article.game_slug}
                            </span>
                          </div>
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2 text-xs text-text-muted">
                          <Clock className="h-3 w-3" />
                          <RelativeTime date={article.published_at || article.created_at} />
                          {article.source?.name && (
                            <>
                              <span className="mx-1">·</span>
                              <span className="flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                {article.source.name}
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-text mb-2 line-clamp-2">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="text-text-muted text-sm line-clamp-3 mb-3">
                            {article.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-text-muted text-sm">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {article.views_count.toLocaleString()}
                          </span>
                          {article.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {article.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-surface-light text-text-muted"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "blog" ? (
        /* Blog Section */
        <div className="space-y-6">
          {blogPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">
                No blog posts yet
              </h3>
              <p className="text-text-muted mb-4">
                Be the first to share your gaming experiences and insights!
              </p>
              <Link href="/write">
                <Button>Write Your First Post</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {blogPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
                >
                  <Link href={`/community/post/${post.id}`}>
                    <Card className="overflow-hidden hover:border-primary transition-colors cursor-pointer h-full">
                      {post.cover_image && (
                        <div className="aspect-video bg-surface-light relative">
                          <Image
                            src={post.cover_image}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority={index < 2}
                          />
                          {post.game && (
                            <div className="absolute top-3 left-3">
                              <span className={cn(
                                "px-2 py-1 rounded text-xs font-semibold uppercase",
                                getGameColor(post.game)
                              )}>
                                <Gamepad2 className="h-3 w-3 inline mr-1" />
                                {post.game}
                              </span>
                            </div>
                          )}
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
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Friends Section */
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

              {/* Guest sign-up CTA after posts */}
              {!user && friendPosts.length > 0 && (
                <div
                  className="rounded-2xl backdrop-blur-xl bg-gradient-to-br from-primary/[0.08] to-accent/[0.08] border border-primary/20 p-6 text-center animate-fadeInUp"
                  style={{ animationDelay: `${friendPosts.length * 50 + 100}ms`, animationFillMode: "both" }}
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
                </div>
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
