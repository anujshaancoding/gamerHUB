"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Eye,
  Clock,
  CheckCircle,
  Gamepad2,
  Calendar,
  User,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Avatar,
  Badge,
  RelativeTime,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Author {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  gaming_style: string;
  region: string;
  is_verified: boolean;
  social_links?: Record<string, string>;
}

interface Comment {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

interface DemoPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  game: string;
  tags: string[];
  views_count: number;
  likes_count: number;
  comments_count: number;
  read_time_minutes: number;
  is_featured: boolean;
  is_pinned: boolean;
  created_at: string;
  author: Author;
}

const supabase = createClient();

export default function DemoPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<DemoPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPost(params.id as string);
    }
  }, [params.id]);

  const fetchPost = async (postId: string) => {
    setLoading(true);
    try {
      // Fetch the post with author info
      const { data: postData, error: postError } = await supabase
        .from("demo_community_posts")
        .select(`
          *,
          author:demo_profiles!demo_community_posts_author_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            bio,
            gaming_style,
            region,
            is_verified,
            social_links
          )
        `)
        .eq("id", postId)
        .single();

      if (postError) throw postError;
      setPost(postData as DemoPost);

      // Fetch comments
      const { data: commentsData } = await supabase
        .from("demo_post_comments")
        .select(`
          id,
          content,
          likes_count,
          created_at,
          author:demo_profiles!demo_post_comments_author_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      setComments((commentsData || []) as Comment[]);
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post?.title,
        text: post?.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering
    return content
      .split("\n\n")
      .map((paragraph, index) => {
        // Headers
        if (paragraph.startsWith("## ")) {
          return (
            <h2 key={index} className="text-xl font-bold text-text mt-8 mb-4">
              {paragraph.replace("## ", "")}
            </h2>
          );
        }
        if (paragraph.startsWith("### ")) {
          return (
            <h3 key={index} className="text-lg font-semibold text-text mt-6 mb-3">
              {paragraph.replace("### ", "")}
            </h3>
          );
        }
        // Bold text processing
        const processBold = (text: string) => {
          const parts = text.split(/(\*\*.*?\*\*)/g);
          return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
          });
        };
        // Lists
        if (paragraph.includes("\n- ") || paragraph.startsWith("- ")) {
          const items = paragraph.split("\n").filter(item => item.startsWith("- "));
          return (
            <ul key={index} className="list-disc list-inside space-y-2 mb-4 text-text-secondary">
              {items.map((item, i) => (
                <li key={i}>{processBold(item.replace("- ", ""))}</li>
              ))}
            </ul>
          );
        }
        // Numbered lists
        if (/^\d+\.\s/.test(paragraph)) {
          const items = paragraph.split("\n").filter(item => /^\d+\.\s/.test(item));
          return (
            <ol key={index} className="list-decimal list-inside space-y-2 mb-4 text-text-secondary">
              {items.map((item, i) => (
                <li key={i}>{processBold(item.replace(/^\d+\.\s/, ""))}</li>
              ))}
            </ol>
          );
        }
        // Italic text (single asterisks at start/end)
        if (paragraph.startsWith("*") && paragraph.endsWith("*") && !paragraph.startsWith("**")) {
          return (
            <p key={index} className="text-text-muted italic mb-4">
              {paragraph.slice(1, -1)}
            </p>
          );
        }
        // Regular paragraph
        return (
          <p key={index} className="text-text-secondary leading-relaxed mb-4">
            {processBold(paragraph)}
          </p>
        );
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-text mb-4">Post not found</h2>
        <Button onClick={() => router.push("/community")}>Back to Community</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Button
          variant="ghost"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Community
        </Button>
      </motion.div>

      {/* Article */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Cover Image */}
        {post.cover_image && (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/banners/gaming-1.svg'; }}
            />
            {/* Overlays */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-semibold uppercase flex items-center gap-1.5",
                post.game === "valorant" ? "bg-red-500 text-white" :
                post.game === "cs2" ? "bg-amber-500 text-black" :
                "bg-primary text-white"
              )}>
                <Gamepad2 className="h-4 w-4" />
                {post.game}
              </span>
              <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-background/90 text-text capitalize">
                {post.category}
              </span>
            </div>
          </div>
        )}

        {/* Title & Meta */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-4 leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-text-muted mb-6">{post.excerpt}</p>

          {/* Author & Stats Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Link href={`/profile/${post.author.username}`}>
              <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar
                  src={post.author.avatar_url}
                  alt={post.author.display_name}
                  size="lg"
                />
                <div>
                  <p className="font-semibold text-text flex items-center gap-1.5">
                    {post.author.display_name}
                    {post.author.is_verified && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </p>
                  <p className="text-sm text-text-muted">@{post.author.username}</p>
                  <p className="text-xs text-text-muted">{post.author.region}</p>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-4 text-text-muted text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <RelativeTime date={post.created_at} />
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.read_time_minutes} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.views_count.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pb-6 mb-8 border-b border-border">
          <Button
            variant={liked ? "default" : "outline"}
            size="sm"
            onClick={() => setLiked(!liked)}
            leftIcon={<Heart className={cn("h-4 w-4", liked && "fill-current")} />}
          >
            {post.likes_count + (liked ? 1 : 0)}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<MessageCircle className="h-4 w-4" />}
          >
            {post.comments_count}
          </Button>
          <Button
            variant={bookmarked ? "default" : "outline"}
            size="sm"
            onClick={() => setBookmarked(!bookmarked)}
            leftIcon={<Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />}
          >
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            leftIcon={<Share2 className="h-4 w-4" />}
          >
            Share
          </Button>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none mb-12">
          {renderMarkdown(post.content)}
        </div>

        {/* Author Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar
                src={post.author.avatar_url}
                alt={post.author.display_name}
                size="xl"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-text">{post.author.display_name}</h3>
                  {post.author.is_verified && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                  <Badge variant="secondary" className="text-xs capitalize">
                    {post.author.gaming_style}
                  </Badge>
                </div>
                <p className="text-sm text-text-muted mb-2">@{post.author.username} · {post.author.region}</p>
                {post.author.bio && (
                  <p className="text-sm text-text-secondary mb-3">{post.author.bio}</p>
                )}
                <div className="flex gap-2">
                  <Link href={`/profile/${post.author.username}`}>
                    <Button size="sm" leftIcon={<User className="h-4 w-4" />}>
                      View Profile
                    </Button>
                  </Link>
                  {post.author.social_links?.discord && (
                    <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />}>
                      Discord
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-text mb-6 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments ({comments.length})
          </h3>

          {comments.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-text-muted">No comments yet. Be the first to share your thoughts!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={comment.author.avatar_url}
                        alt={comment.author.display_name}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-text text-sm">
                            {comment.author.display_name}
                          </span>
                          <span className="text-xs text-text-muted">
                            <RelativeTime date={comment.created_at} />
                          </span>
                        </div>
                        <p className="text-text-secondary text-sm">{comment.content}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <button className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors">
                            <Heart className="h-3.5 w-3.5" />
                            {comment.likes_count}
                          </button>
                          <button className="text-xs text-text-muted hover:text-primary transition-colors">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </motion.article>
    </div>
  );
}
