"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Avatar,
  RelativeTime,
} from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/db/client-browser";
import { cn } from "@/lib/utils";
import { blogPostHref } from "@/lib/utils/blog-url";
import { FriendPostCard } from "@/components/friends/friend-post-card";
import { STALE_TIMES } from "@/lib/query/provider";
import { blogKeys } from "@/lib/hooks/useBlog";
import { friendPostKeys, useLikeFriendPost } from "@/lib/hooks/useFriendPosts";
import { BLOG_CATEGORIES } from "@/types/blog";
import { SearchFilterBar } from "@/components/community/SearchFilterBar";
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
  slug?: string | null;
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

type TabId = "blog" | "tournaments" | "friends";

interface CommunityPageClientProps {
  initialBlogPosts: BlogPost[];
  initialFriendPosts: FriendPost[];
}

// ── Blog category filter options ────────────────────────────────────────
const blogCategoryOptions = Object.entries(BLOG_CATEGORIES).map(([key, val]) => ({
  value: key,
  label: val.label,
}));

// ── Supported games (ggLobby V2 is Valorant-only) ──────────────────────
const SUPPORTED_GAME_OPTIONS: { value: string; label: string }[] = [
  { value: "valorant", label: "Valorant" },
];

export function CommunityPageClient({
  initialBlogPosts,
  initialFriendPosts,
}: CommunityPageClientProps) {
  const { user, profile } = useAuth();
  const db = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toggleLike: toggleFriendPostLike } = useLikeFriendPost();

  // Read initial tab from URL: ?tab=tournaments, ?tab=friends, or default (blog)
  const sharedPostId = searchParams.get("post");
  const tabParam = searchParams.get("tab");
  const validTabs: TabId[] = ["blog", "tournaments", "friends"];
  const defaultTab: TabId = "blog";
  const initialTab: TabId = sharedPostId
    ? "friends"
    : validTabs.includes(tabParam as TabId)
      ? (tabParam as TabId)
      : defaultTab;
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // ── Filter states per tab ─────────────────────────────────────────────
  const [blogFilters, setBlogFilters] = useState<{ search?: string; game?: string; category?: string; featured?: boolean }>({});
  const [friendSearch, setFriendSearch] = useState("");

  // Update URL when tab changes
  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === defaultTab) {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    if (tab !== "friends") {
      params.delete("post");
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, router, pathname]);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(sharedPostId);

  // Tournament/Giveaway listing state
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<CommunityListing | null>(null);

  // New post state
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Blog posts query (with filters)
  const {
    data: blogPosts = [],
    isLoading: blogLoading,
    error: blogError,
  } = useQuery({
    queryKey: [...blogKeys.posts(), blogFilters],
    queryFn: async (): Promise<BlogPost[]> => {
      let query = db
        .from("blog_posts")
        .select(`
          id, title, slug, excerpt, featured_image_url, category, tags,
          published_at, views_count, likes_count, comments_count,
          created_at, is_featured,
          author:profiles!blog_posts_author_id_fkey(id, username, display_name, avatar_url),
          game:games!blog_posts_game_id_fkey(slug)
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(20);

      if (blogFilters.category) query = query.eq("category", blogFilters.category);
      if (blogFilters.featured) query = query.eq("is_featured", true);
      if (blogFilters.search) query = query.ilike("title", `%${blogFilters.search}%`);
      const { data: posts, error: queryError } = await query;
      if (queryError) throw new Error(queryError.message);

      // Map slug to tag prefix for client-side game filtering
      // (blog posts don't always have game_id set — game is inferred from tags)
      const SLUG_TO_TAG: Record<string, string> = {
        valorant: "valorant",
      };

      const mapped = (posts || []).map((post: Record<string, unknown>): BlogPost => ({
        id: post.id as string,
        slug: (post.slug as string) || null,
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
        game: (post.game as { slug: string } | null)?.slug,
        tags: post.tags as string[],
        author: post.author as BlogPost["author"],
      }));

      if (blogFilters.game) {
        const tagPrefix = SLUG_TO_TAG[blogFilters.game];
        if (tagPrefix) {
          return mapped.filter((post) =>
            post.tags?.some((tag) => tag.toLowerCase().startsWith(tagPrefix))
          );
        }
      }

      return mapped;
    },
    staleTime: STALE_TIMES.BLOG_POSTS,
    enabled: activeTab === "blog",
    initialData:
      initialBlogPosts.length > 0 && Object.keys(blogFilters).length === 0
        ? initialBlogPosts
        : undefined,
  });

  // Friend posts query
  const isGuest = !user;
  const {
    data: friendPosts = [],
    isLoading: friendLoading,
    error: friendError,
  } = useQuery({
    queryKey: friendPostKeys.list(isGuest),
    queryFn: async (): Promise<FriendPost[]> => {
      const res = await fetch(`/api/friend-posts?limit=20`);
      if (!res.ok) throw new Error("Failed to load friend posts");
      const { posts } = await res.json();

      if (isGuest) {
        return (posts || [])
          .filter((p: FriendPost) => p.user !== null && p.user?.is_verified)
          .slice(0, 15);
      }
      return (posts || []) as FriendPost[];
    },
    staleTime: STALE_TIMES.FRIEND_POSTS,
    enabled: activeTab === "friends",
    initialData: initialFriendPosts.length > 0 ? initialFriendPosts : undefined,
  });

  // Client-side filter for friend posts search
  const filteredFriendPosts = useMemo(() => {
    if (!friendSearch) return friendPosts;
    const q = friendSearch.toLowerCase();
    return friendPosts.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        p.user?.display_name?.toLowerCase().includes(q) ||
        p.user?.username?.toLowerCase().includes(q)
    );
  }, [friendPosts, friendSearch]);

  // Fetch the specific shared post if not already in the feed
  const { data: sharedPost } = useQuery({
    queryKey: friendPostKeys.detail(sharedPostId!),
    queryFn: async () => {
      const res = await fetch(`/api/friend-posts/${sharedPostId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return (data.post || null) as FriendPost | null;
    },
    enabled: !!sharedPostId && !friendLoading && !friendPosts.some((p) => p.id === sharedPostId),
    staleTime: STALE_TIMES.FRIEND_POSTS,
  });

  // Merge shared post into feed if it wasn't there
  const displayFriendPosts = useMemo(() => {
    const base = filteredFriendPosts;
    if (!sharedPostId) return base;
    if (base.some((p) => p.id === sharedPostId)) return base;
    if (sharedPost) return [sharedPost, ...base];
    return base;
  }, [filteredFriendPosts, sharedPost, sharedPostId]);

  // Scroll to and highlight the shared post once loaded
  const scrolledRef = useRef(false);
  useEffect(() => {
    if (!sharedPostId || scrolledRef.current) return;
    if (friendLoading) return;

    const el = document.getElementById(`post-${sharedPostId}`);
    if (el) {
      scrolledRef.current = true;
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setHighlightedPostId(null), 2500);
      }, 300);
    }
  }, [sharedPostId, friendLoading, displayFriendPosts]);

  const loading =
    activeTab === "blog" ? blogLoading :
    activeTab === "friends" ? friendLoading :
    false;

  const fetchError = blogError || friendError;

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
    if (newPostContent.length > 500) {
      toast.error("Posts are limited to 500 characters.");
      return;
    }

    setIsPosting(true);
    try {
      let imageUrl = null;

      if (selectedImage) {
        const fileExt = selectedImage.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedImage);
        uploadFormData.append("path", `post-images/${fileName}`);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadFormData });
        const uploadData = await uploadRes.json();

        if (uploadRes.ok && uploadData.publicUrl) {
          imageUrl = uploadData.publicUrl.split("?")[0];
        } else {
          toast.error(uploadData.error || "Failed to upload image");
          setIsPosting(false);
          return;
        }
      }

      const { error } = await db.from("friend_posts").insert({
        user_id: user.id,
        content: newPostContent,
        image_url: imageUrl,
        likes_count: 0,
        comments_count: 0,
      });

      if (error) {
        toast.error("Failed to create post");
      } else {
        setNewPostContent("");
        removeImage();
        queryClient.invalidateQueries({ queryKey: friendPostKeys.all });
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Something went wrong while creating the post");
    } finally {
      setIsPosting(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "blog", label: "Blog", icon: BookOpen },
    { id: "tournaments", label: "Tournaments/Giveaways", icon: Trophy },
    { id: "friends", label: "Friends", icon: Users },
  ];

  const getGameColor = (game: string) => {
    switch (game) {
      case "valorant": return "bg-red-500/90 text-white";
      default: return "bg-primary/90 text-background";
    }
  };

  // ── Blog filter config ────────────────────────────────────────────────
  const blogFilterFields = useMemo(() => [
    {
      key: "game",
      label: "Game",
      icon: <Gamepad2 className="w-3.5 h-3.5" />,
      type: "select" as const,
      options: SUPPORTED_GAME_OPTIONS,
      placeholder: "All Games",
    },
    {
      key: "category",
      label: "Category",
      type: "select" as const,
      options: blogCategoryOptions,
      placeholder: "All Categories",
    },
    {
      key: "featured",
      label: "Featured Only",
      icon: <Sparkles className="w-3.5 h-3.5" />,
      type: "toggle" as const,
    },
  ], []);

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
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
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
      ) : (
        <>
          {/* ── Search & Filters for Blog ─────────────────────────────── */}
          {activeTab === "blog" && (
            <SearchFilterBar
              searchPlaceholder="Search blog posts, authors, topics..."
              searchValue={blogFilters.search || ""}
              onSearchChange={(val) => setBlogFilters((f) => ({ ...f, search: val || undefined }))}
              filters={blogFilterFields}
              filterValues={blogFilters}
              onFilterChange={(key, val) => setBlogFilters((f) => ({ ...f, [key]: val }))}
              onClearAll={() => setBlogFilters({})}
            />
          )}

          {/* ── Search for Friends ────────────────────────────────────── */}
          {activeTab === "friends" && (
            <SearchFilterBar
              searchPlaceholder="Search posts by content or username..."
              searchValue={friendSearch}
              onSearchChange={setFriendSearch}
              onClearAll={() => setFriendSearch("")}
              debounceMs={300}
              compact
            />
          )}

          {loading ? (
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
          ) : activeTab === "blog" ? (
            /* Blog Section */
            <div className="space-y-6">
              {blogPosts.length === 0 ? (
                <Card className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text mb-2">
                    {blogFilters.search || Object.keys(blogFilters).length > 0
                      ? "No matching blog posts found"
                      : "No blog posts yet"}
                  </h3>
                  <p className="text-text-muted mb-4">
                    {blogFilters.search || Object.keys(blogFilters).length > 0
                      ? "Try adjusting your search or filters to find what you're looking for."
                      : "Be the first to share your gaming experiences and insights!"}
                  </p>
                  {blogFilters.search || Object.keys(blogFilters).length > 0 ? (
                    <Button variant="outline" onClick={() => setBlogFilters({})}>
                      Clear Filters
                    </Button>
                  ) : (
                    <Link href="/write">
                      <Button>Write Your First Post</Button>
                    </Link>
                  )}
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {blogPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className="animate-fadeInUp"
                      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
                    >
                      <Link href={blogPostHref(post)}>
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
                                unoptimized={post.cover_image.startsWith("/uploads/")}
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
                          onChange={(e) => setNewPostContent(e.target.value.slice(0, 500))}
                          maxLength={500}
                          placeholder="What's on your mind? Share your gaming moments..."
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-text placeholder-text-dim resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                          rows={3}
                        />

                        {/* Image Preview */}
                        {imagePreview && (
                          <div className="relative inline-block">
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              width={400}
                              height={192}
                              className="max-h-48 w-auto rounded-xl border border-white/[0.08]"
                              unoptimized
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
              {displayFriendPosts.length === 0 ? (
                <div className="rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] p-8 text-center">
                  <Users className="h-12 w-12 text-text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text mb-2">
                    {friendSearch
                      ? "No matching posts found"
                      : user
                        ? "No posts yet"
                        : "No featured posts"}
                  </h3>
                  <p className="text-text-muted">
                    {friendSearch
                      ? "Try a different search term."
                      : user
                        ? "Be the first to share something with the community!"
                        : "Sign up to see posts from the community and share your own!"}
                  </p>
                  {friendSearch && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setFriendSearch("")}
                    >
                      Clear Search
                    </Button>
                  )}
                  {!user && !friendSearch && (
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
                  {displayFriendPosts.map((post, index) => (
                    <div
                      key={post.id}
                      id={`post-${post.id}`}
                      className={cn(
                        "transition-all duration-700",
                        highlightedPostId === post.id && "ring-2 ring-primary/60 rounded-2xl shadow-lg shadow-primary/10"
                      )}
                    >
                      <FriendPostCard
                        post={post}
                        index={index}
                        isGuest={!user}
                        onLike={async () => {
                          await toggleFriendPostLike(post.id);
                        }}
                        onDelete={async () => {
                          const res = await fetch(`/api/friend-posts/${post.id}`, {
                            method: "DELETE",
                          });
                          if (!res.ok) throw new Error("Failed to delete post");
                          queryClient.invalidateQueries({ queryKey: friendPostKeys.all });
                        }}
                      />
                    </div>
                  ))}

                  {/* Guest sign-up CTA after posts */}
                  {!user && displayFriendPosts.length > 0 && (
                    <div
                      className="rounded-2xl backdrop-blur-xl bg-gradient-to-br from-primary/[0.08] to-accent/[0.08] border border-primary/20 p-6 text-center animate-fadeInUp"
                      style={{ animationDelay: `${displayFriendPosts.length * 50 + 100}ms`, animationFillMode: "both" }}
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
        </>
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
