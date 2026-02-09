"use client";

import { useState, useEffect, useRef } from "react";
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
  Newspaper,
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
import { NewsFeed } from "@/components/news/NewsFeed";

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
  is_demo?: boolean;
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
  };
}

const supabase = createClient();

export default function CommunityPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"news" | "author" | "friends">("news");
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [friendPosts, setFriendPosts] = useState<FriendPost[]>([]);
  const [loading, setLoading] = useState(true);

  // New post state
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab !== "news") {
      fetchContent();
    }
  }, [activeTab]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      if (activeTab === "author") {
        // First try to fetch demo community posts (seeded data)
        const { data: demoPosts } = await supabase
          .from("demo_community_posts")
          .select(`
            id,
            title,
            excerpt,
            content,
            cover_image,
            category,
            game,
            tags,
            views_count,
            likes_count,
            comments_count,
            read_time_minutes,
            created_at,
            author:demo_profiles!demo_community_posts_author_id_fkey(
              id,
              username,
              display_name,
              avatar_url,
              is_verified
            )
          `)
          .order("is_pinned", { ascending: false })
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(12);

        // Also fetch regular blog posts
        const { data: regularPosts } = await supabase
          .from("blog_posts")
          .select(`
            *,
            author:profiles!blog_posts_author_id_fkey(username, display_name, avatar_url)
          `)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(10);

        // Combine demo posts (marked) with regular posts
        const demoPostsMarked: BlogPost[] = (demoPosts || []).map((post: Record<string, unknown>) => ({
          id: post.id as string,
          title: post.title as string,
          excerpt: post.excerpt as string,
          content: post.content as string,
          cover_image: post.cover_image as string | undefined,
          author_id: "",
          created_at: post.created_at as string,
          likes_count: post.likes_count as number,
          comments_count: post.comments_count as number,
          views_count: post.views_count as number,
          read_time_minutes: post.read_time_minutes as number,
          category: post.category as string,
          game: post.game as string,
          tags: post.tags as string[],
          is_demo: true,
          author: post.author as BlogPost["author"]
        }));

        const regularPostsMapped: BlogPost[] = (regularPosts || []).map((post: Record<string, unknown>) => ({
          id: post.id as string,
          title: post.title as string,
          excerpt: post.excerpt as string,
          content: post.content as string,
          cover_image: post.featured_image_url as string | undefined,
          author_id: post.author_id as string,
          created_at: post.created_at as string,
          likes_count: post.likes_count as number,
          comments_count: post.comments_count as number,
          is_demo: false,
          author: post.author as BlogPost["author"]
        }));

        const allPosts = [...demoPostsMarked, ...regularPostsMapped];
        // Sort by created_at descending
        allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setBlogPosts(allPosts);
      } else {
        // Fetch friend posts
        const { data } = await supabase
          .from("friend_posts")
          .select(`
            *,
            user:profiles!friend_posts_user_id_fkey(username, display_name, avatar_url)
          `)
          .order("created_at", { ascending: false })
          .limit(20);
        setFriendPosts(data || []);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

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
    { id: "news" as const, label: "News", icon: Newspaper },
    { id: "author" as const, label: "Author", icon: BookOpen },
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
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors",
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
      {activeTab === "news" ? (
        <NewsFeed />
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
                  <Link href={post.is_demo ? `/community/post/${post.id}` : `/community/article/${post.id}`}>
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
                                post.game === "cs2" ? "bg-amber-500/90 text-black" :
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
        /* Friends Section - Social Posts with Images */
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Create Post Card */}
          <Card>
            <CardContent className="p-4">
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
                    className="w-full bg-surface-light border border-border rounded-lg p-3 text-text placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    rows={3}
                  />

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 rounded-lg"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background transition-colors"
                      >
                        <X className="h-4 w-4 text-text" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
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
                      >
                        Add Image
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleCreatePost}
                      disabled={(!newPostContent.trim() && !selectedImage) || isPosting}
                      leftIcon={<Send className="h-4 w-4" />}
                    >
                      {isPosting ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          {friendPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">
                No posts yet
              </h3>
              <p className="text-text-muted">
                Be the first to share something with the community!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {friendPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-3">
                        <Link
                          href={`/profile/${post.user?.username}`}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          <Avatar
                            src={post.user?.avatar_url}
                            alt={post.user?.display_name || post.user?.username || "User"}
                            size="md"
                          />
                          <div>
                            <p className="font-medium text-text">
                              {post.user?.display_name || post.user?.username}
                            </p>
                            <p className="text-xs text-text-muted">
                              @{post.user?.username} · <RelativeTime date={post.created_at} />
                            </p>
                          </div>
                        </Link>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Post Content */}
                      <p className="text-text mb-3 whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Post Image */}
                      {post.image_url && (
                        <div className="rounded-lg overflow-hidden mb-3">
                          <img
                            src={post.image_url}
                            alt="Post image"
                            className="w-full max-h-96 object-cover"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center gap-4 pt-3 border-t border-border">
                        <button className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors">
                          <Heart className="h-5 w-5" />
                          <span className="text-sm">{post.likes_count}</span>
                        </button>
                        <button className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors">
                          <MessageCircle className="h-5 w-5" />
                          <span className="text-sm">{post.comments_count}</span>
                        </button>
                        <button className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors">
                          <Share2 className="h-5 w-5" />
                          <span className="text-sm">Share</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
