"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Avatar,
  Badge,
  RelativeTime,
} from "@/components/ui";
import { createClient } from "@/lib/db/client-browser";
import { cn } from "@/lib/utils";
import { ShareCardModal } from "@/components/blog/share-card-modal";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useAuth } from "@/lib/hooks/useAuth";
import { STALE_TIMES } from "@/lib/query/provider";
import { useLikeBlogPost, blogKeys } from "@/lib/hooks/useBlog";

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

interface CommunityPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
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

export default function CommunityPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const db = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { can: permissions } = usePermissions();
  const [bookmarked, setBookmarked] = useState(false);
  const [showShareCards, setShowShareCards] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const { toggleLike, isLiking } = useLikeBlogPost();

  const postId = params.id as string;

  // Fetch post with React Query
  const {
    data: post,
    isLoading: postLoading,
  } = useQuery({
    queryKey: blogKeys.postById(postId),
    queryFn: async () => {
      const { data: postData, error: postError } = await db
        .from("blog_posts")
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            bio,
            gaming_style,
            region
          )
        `)
        .eq("id", postId)
        .single();

      if (postError) throw new Error(postError.message);
      return postData as CommunityPost;
    },
    staleTime: STALE_TIMES.BLOG_POST_DETAIL,
    enabled: !!postId,
  });

  // Deduplicated view counting — only fires once per session per post
  useEffect(() => {
    if (!post?.slug) return;
    const viewKey = `viewed_blog_${post.slug}`;
    if (!sessionStorage.getItem(viewKey)) {
      sessionStorage.setItem(viewKey, "1");
      db.rpc("increment_blog_view", { post_slug: post.slug }).then();
    }
  }, [post?.slug, db]);

  // Fetch comments with React Query
  const {
    data: comments = [],
  } = useQuery({
    queryKey: blogKeys.commentsById(postId),
    queryFn: async () => {
      const { data: commentsData, error } = await db
        .from("blog_comments")
        .select(`
          id,
          content,
          likes_count,
          created_at,
          author:profiles!blog_comments_author_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .eq("status", "visible")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (commentsData || []) as Comment[];
    },
    staleTime: STALE_TIMES.BLOG_COMMENTS,
    enabled: !!postId,
  });

  // Check if user has liked this post
  const { data: liked = false } = useQuery({
    queryKey: blogKeys.postLiked(postId),
    queryFn: async () => {
      const { data } = await db
        .from("blog_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
    staleTime: STALE_TIMES.BLOG_POST_DETAIL,
    enabled: !!postId && !!user,
  });

  const handleLikePost = async () => {
    if (!post?.slug || !user) return;
    try {
      await toggleLike(post.slug);
      // Also refresh the liked status
      queryClient.invalidateQueries({ queryKey: blogKeys.postLiked(postId) });
    } catch {
      // Like failed silently
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    setDeletingCommentId(commentId);
    try {
      const response = await fetch(
        `/api/blog/${post.slug}/comments/${commentId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete comment");
      }
      // Invalidate comments cache — all keys are under blogKeys.all prefix
      queryClient.invalidateQueries({ queryKey: blogKeys.commentsById(postId) });
      queryClient.invalidateQueries({ queryKey: blogKeys.comments(post.slug) });
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post?.title,
        text: post?.excerpt,
        url: window.location.href,
      });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = window.location.href;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("Link copied to clipboard!");
    }
  };

  // Detect if content is HTML (from Tiptap editor) vs plain markdown
  const isHtmlContent = (content: string) => /<[a-z][\s\S]*>/i.test(content);

  if (postLoading) {
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
        {post.featured_image_url && (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/banners/gaming-1.svg'; }}
            />
            {/* Overlays */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-semibold uppercase flex items-center gap-1.5",
                post.game === "valorant" ? "bg-red-500 text-white" :
                post.game === "bgmi" ? "bg-orange-500 text-white" :
                post.game === "freefire" ? "bg-yellow-500 text-black" :
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
            onClick={handleLikePost}
            disabled={isLiking || !user}
            leftIcon={<Heart className={cn("h-4 w-4", liked && "fill-current")} />}
          >
            {post.likes_count}
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
            onClick={() => setShowShareCards(true)}
            leftIcon={<ImageIcon className="h-4 w-4" />}
          >
            Share
          </Button>
        </div>

        {/* Share Card Modal */}
        <ShareCardModal
          isOpen={showShareCards}
          onClose={() => setShowShareCards(false)}
          post={{
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            featured_image_url: post.featured_image_url,
            category: post.category,
            tags: post.tags,
            created_at: post.created_at,
            author: post.author ? {
              display_name: post.author.display_name,
              username: post.author.username,
            } : null,
          }}
          articleUrl={window.location.href}
        />

        {/* Content */}
        {isHtmlContent(post.content) ? (
          <div
            className="prose prose-invert prose-lg max-w-none mb-12
              prose-headings:font-bold prose-a:text-primary prose-a:underline
              prose-img:rounded-lg prose-img:max-w-full
              prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:pl-4 prose-blockquote:italic"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <div className="prose prose-invert max-w-none mb-12 text-text-secondary leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        )}

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
                          {/* Delete button: visible to comment author, post author, or editor+ */}
                          {user && (
                            comment.author.id === user.id ||
                            post?.author?.id === user.id ||
                            permissions.deleteAnyComment
                          ) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deletingCommentId === comment.id}
                              className="flex items-center gap-1 text-xs text-text-muted hover:text-red-500 transition-colors ml-auto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingCommentId === comment.id ? "Deleting..." : "Delete"}
                            </button>
                          )}
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
