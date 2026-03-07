"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ChevronRight,
  BookOpen,
  PenTool,
  UserCircle,
  Shield,
  MessageCircle,
  Gamepad2,
  Crown,
  Settings,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  articles: Article[];
}

const helpCategories: Category[] = [
  {
    id: "blog",
    label: "Blog & Writing",
    icon: <PenTool className="w-5 h-5" />,
    description: "Creating, editing, and publishing blog posts",
    articles: [
      {
        id: "blog-create",
        question: "How do I create a blog post?",
        answer:
          'Go to the Community page and click the "Write a Post" button, or navigate to /write directly. You\'ll first choose a template and color palette, then write your content using the rich text editor. Fill in the title, category, tags, excerpt, and featured image. You can save as a draft or publish immediately.',
        tags: ["blog", "write", "create", "post", "publish"],
      },
      {
        id: "blog-html",
        question: "How do I paste HTML content into the blog editor?",
        answer:
          'In the rich text editor toolbar, click the "HTML" button (near the end of the toolbar, before Undo/Redo). This switches to HTML source mode where you can paste raw HTML code. Click the "Visual" button to switch back and see your formatted content rendered properly. This is useful when you have pre-written HTML content from another source.',
        tags: ["blog", "html", "paste", "raw", "source", "code", "editor", "format"],
      },
      {
        id: "blog-edit",
        question: "How do I edit a published blog post?",
        answer:
          'Open your published blog post on the community page. If you\'re the author, you\'ll see an "Edit" button and a three-dot menu (\u22ee) in the action bar below the title. Click Edit to go to the editor with your post pre-loaded. Make changes and click Publish to update.',
        tags: ["blog", "edit", "update", "modify", "published"],
      },
      {
        id: "blog-delete",
        question: "How do I delete my blog post?",
        answer:
          'Open your blog post and click the three-dot menu (\u22ee) in the action bar. Select "Delete Post". You\'ll be asked to confirm before the post is permanently removed. Only the post author can delete their own posts.',
        tags: ["blog", "delete", "remove"],
      },
      {
        id: "blog-image",
        question: "How do I add a featured image to my blog?",
        answer:
          'In the blog editor, scroll to the "Featured Image" section. You can either paste an image URL directly, or click the "Upload" button to upload an image from your device (max 10MB). The uploaded image will be stored and the URL will be filled automatically. A preview will show below.',
        tags: ["blog", "image", "featured", "upload", "thumbnail", "cover"],
      },
      {
        id: "blog-template",
        question: "What are blog templates and color palettes?",
        answer:
          "When creating a new blog post, you first choose a template (layout style) and a color palette (color scheme). Templates control how your content is structured \u2014 classic, magazine, minimal, etc. Color palettes set the accent colors. These affect how your post looks when published. You can change them during the creation wizard.",
        tags: ["blog", "template", "palette", "color", "design", "layout", "style"],
      },
      {
        id: "blog-draft",
        question: "How do I save a draft?",
        answer:
          'Click "Save Draft" instead of "Publish" in the blog editor. Your draft is saved and you can continue editing it later. Drafts are only visible to you and won\'t appear in the community feed until published.',
        tags: ["blog", "draft", "save"],
      },
      {
        id: "blog-seo",
        question: "What are SEO settings in the blog editor?",
        answer:
          'At the bottom of the blog editor, click "SEO Settings" to expand the section. You can set a custom Meta Title (for search engine results) and Meta Description (the snippet shown in Google). If left empty, your post title and excerpt will be used automatically. Good SEO settings help your post rank higher in search results.',
        tags: ["blog", "seo", "meta", "title", "description", "google", "search"],
      },
    ],
  },
  {
    id: "community",
    label: "Community",
    icon: <BookOpen className="w-5 h-5" />,
    description: "Community feed, posts, comments, and interactions",
    articles: [
      {
        id: "community-tabs",
        question: "What are the different tabs in the Community page?",
        answer:
          "The Community page has multiple tabs: Blog (user-written articles), News (curated gaming news), and Friends (posts from people you follow). Each tab has its own content feed. Use the tab bar at the top to switch between them.",
        tags: ["community", "tabs", "blog", "news", "friends", "feed"],
      },
      {
        id: "community-like",
        question: "How do I like and comment on posts?",
        answer:
          "On any blog post, you'll see a heart icon (like), comment icon, bookmark icon, and share button in the action bar. Click the heart to like. Click the comment icon to scroll to the comments section where you can write and post your comment. You must be signed in to interact.",
        tags: ["community", "like", "comment", "interact", "heart", "bookmark"],
      },
      {
        id: "community-share",
        question: "How do I share a blog post?",
        answer:
          'Click the "Share" button on any blog post. This opens a share card modal where you can generate shareable images of the post. You can also copy the post URL directly using your browser\'s share function.',
        tags: ["community", "share", "social", "card", "link"],
      },
      {
        id: "community-bookmark",
        question: "How do I save/bookmark a post?",
        answer:
          'Click the "Save" button (bookmark icon) on any blog post to save it for later. Click it again to remove the bookmark. Your saved posts can be accessed from your profile.',
        tags: ["community", "bookmark", "save", "favorite"],
      },
    ],
  },
  {
    id: "profile",
    label: "Profile",
    icon: <UserCircle className="w-5 h-5" />,
    description: "Setting up and customizing your profile",
    articles: [
      {
        id: "profile-setup",
        question: "How do I set up my profile?",
        answer:
          "After signing up, go to Settings to fill in your display name, username, bio, gaming style, region, and avatar. Your profile is visible to other users at /profile/your-username. A complete profile helps you connect with other gamers.",
        tags: ["profile", "setup", "username", "avatar", "bio", "display name"],
      },
      {
        id: "profile-username",
        question: "How do I change my username?",
        answer:
          "Go to Settings and find the Username field. Enter your new username and save. Usernames must be unique. Note that changing your username will change your profile URL.",
        tags: ["profile", "username", "change", "rename"],
      },
      {
        id: "profile-avatar",
        question: "How do I change my profile picture?",
        answer:
          "Go to Settings and click on your avatar image. You can upload a new image from your device. The image will be cropped to a circle. Supported formats: JPG, PNG, WebP.",
        tags: ["profile", "avatar", "picture", "photo", "image"],
      },
    ],
  },
  {
    id: "clans",
    label: "Clans",
    icon: <Shield className="w-5 h-5" />,
    description: "Creating and managing gaming clans",
    articles: [
      {
        id: "clans-create",
        question: "How do I create a clan?",
        answer:
          'Go to the Clans page and click "Create Clan". Fill in the clan name, tag, description, game focus, and upload a clan logo. You\'ll become the clan leader automatically.',
        tags: ["clan", "create", "start", "make", "team"],
      },
      {
        id: "clans-join",
        question: "How do I join a clan?",
        answer:
          "Browse available clans on the Clans page. Click on a clan to view its details, then click the Join button. Some clans may require approval from the clan leader.",
        tags: ["clan", "join", "apply", "member"],
      },
      {
        id: "clans-manage",
        question: "How do I manage my clan?",
        answer:
          "As a clan leader, you can manage members, change clan settings, update the description and logo, and promote/demote members. Access clan management from your clan page.",
        tags: ["clan", "manage", "leader", "settings", "members", "admin"],
      },
    ],
  },
  {
    id: "messaging",
    label: "Messaging",
    icon: <MessageCircle className="w-5 h-5" />,
    description: "Direct messages and chat",
    articles: [
      {
        id: "msg-send",
        question: "How do I send a message to someone?",
        answer:
          "Visit a user's profile and click the Message button, or go to Messages in the sidebar. Start a new conversation by searching for a username. Type your message and press Enter or click Send.",
        tags: ["message", "chat", "dm", "send", "direct"],
      },
      {
        id: "msg-notifications",
        question: "How do I get notified of new messages?",
        answer:
          "The Messages icon in the sidebar shows a badge with the unread message count. You'll also receive notifications if you have them enabled in Settings > Notifications.",
        tags: ["message", "notification", "unread", "badge", "alert"],
      },
    ],
  },
  {
    id: "gamers",
    label: "Find Gamers",
    icon: <Gamepad2 className="w-5 h-5" />,
    description: "Discovering and connecting with other gamers",
    articles: [
      {
        id: "gamers-find",
        question: "How do I find other gamers to play with?",
        answer:
          "Go to the Discover Gamers page from the sidebar. You can filter by game, region, and gaming style. Browse gamer profiles and send friend requests or messages to connect.",
        tags: ["gamers", "find", "discover", "connect", "play", "filter"],
      },
      {
        id: "gamers-friends",
        question: "How do I add someone as a friend?",
        answer:
          "Visit their profile and click the \"Add Friend\" button. They'll receive a friend request notification. Once they accept, you'll see each other in your Friends list and their posts will appear in your Community > Friends tab.",
        tags: ["friend", "add", "request", "connect"],
      },
    ],
  },
  {
    id: "premium",
    label: "Premium",
    icon: <Crown className="w-5 h-5" />,
    description: "Premium features and subscriptions",
    articles: [
      {
        id: "premium-features",
        question: "What do I get with Premium?",
        answer:
          "Premium unlocks exclusive features including blog creation, advanced profile customization, priority support, and access to premium-only community features. Visit the Premium page for full details and pricing.",
        tags: ["premium", "subscription", "features", "benefits", "paid"],
      },
      {
        id: "premium-blog",
        question: "Do I need Premium to write blog posts?",
        answer:
          "Yes, blog creation is a Premium feature. You need an active Premium subscription to write and publish blog posts. Reading blog posts is free for everyone.",
        tags: ["premium", "blog", "write", "create", "free"],
      },
    ],
  },
  {
    id: "account",
    label: "Account & Settings",
    icon: <Settings className="w-5 h-5" />,
    description: "Account management, security, and preferences",
    articles: [
      {
        id: "account-login",
        question: "How do I sign up or log in?",
        answer:
          "Click the Login or Register button. You can sign up with your email address or use social login providers. After registering, complete your profile setup to get started.",
        tags: ["account", "login", "register", "sign up", "sign in"],
      },
      {
        id: "account-notifications",
        question: "How do I manage my notification preferences?",
        answer:
          "Go to Settings > Notifications. You can toggle different notification types on/off including friend requests, messages, comments on your posts, and more.",
        tags: ["account", "notifications", "settings", "preferences"],
      },
      {
        id: "account-connections",
        question: "How do I connect my gaming accounts?",
        answer:
          "Go to Settings > Connections. You can link your Riot Games, Steam, and Supercell accounts to show your gaming profiles on your ggLobby profile and verify your in-game identity.",
        tags: ["account", "connections", "riot", "steam", "supercell", "link", "gaming"],
      },
    ],
  },
];

function ArticleCard({ article, isOpen, onToggle }: { article: Article; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-light transition-colors"
      >
        <span className="text-sm font-medium text-text pr-4">{article.question}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-border">
          <p className="text-sm text-text-secondary leading-relaxed mt-3">
            {article.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export function HelpCenterClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openArticles, setOpenArticles] = useState<Set<string>>(new Set());

  const toggleArticle = (id: string) => {
    setOpenArticles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Search across all articles
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    const results: (Article & { categoryLabel: string })[] = [];
    for (const category of helpCategories) {
      for (const article of category.articles) {
        const matchesQuestion = article.question.toLowerCase().includes(query);
        const matchesAnswer = article.answer.toLowerCase().includes(query);
        const matchesTags = article.tags.some((tag) => tag.includes(query));
        if (matchesQuestion || matchesAnswer || matchesTags) {
          results.push({ ...article, categoryLabel: category.label });
        }
      }
    }
    return results;
  }, [searchQuery]);

  const displayCategories = activeCategory
    ? helpCategories.filter((c) => c.id === activeCategory)
    : helpCategories;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
          <HelpCircle className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Help Center</h1>
        <p className="text-text-muted max-w-lg mx-auto">
          Find answers to common questions about ggLobby features
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for help... e.g. 'how to paste HTML', 'edit blog post'"
          className="w-full pl-12 pr-4 py-3.5 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text"
          >
            Clear
          </button>
        )}
      </div>

      {/* Search results */}
      {searchResults !== null ? (
        <div className="mb-8">
          <p className="text-sm text-text-muted mb-4">
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
          </p>
          {searchResults.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-xl border border-border">
              <HelpCircle className="w-10 h-10 text-text-dim mx-auto mb-3" />
              <p className="text-text-muted mb-1">No results found</p>
              <p className="text-sm text-text-dim">
                Try different keywords or{" "}
                <Link href="/feedback" className="text-primary hover:underline">
                  contact us
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((article) => (
                <div key={article.id}>
                  <span className="text-xs text-primary font-medium">{article.categoryLabel}</span>
                  <ArticleCard
                    article={article}
                    isOpen={openArticles.has(article.id)}
                    onToggle={() => toggleArticle(article.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                !activeCategory
                  ? "bg-primary text-white"
                  : "bg-surface border border-border text-text-muted hover:text-text hover:bg-surface-light"
              )}
            >
              All Topics
            </button>
            {helpCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  activeCategory === cat.id
                    ? "bg-primary text-white"
                    : "bg-surface border border-border text-text-muted hover:text-text hover:bg-surface-light"
                )}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* Categories with articles */}
          <div className="space-y-8">
            {displayCategories.map((category) => (
              <section key={category.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {category.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text">{category.label}</h2>
                    <p className="text-xs text-text-muted">{category.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {category.articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      isOpen={openArticles.has(article.id)}
                      onToggle={() => toggleArticle(article.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-12 mb-8 text-center py-8 bg-surface rounded-xl border border-border">
        <h3 className="font-semibold text-text mb-2">Still need help?</h3>
        <p className="text-sm text-text-muted mb-4">
          Can&apos;t find what you&apos;re looking for? Send us your feedback.
        </p>
        <Link
          href="/feedback"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Send Feedback
        </Link>
      </div>
    </div>
  );
}
