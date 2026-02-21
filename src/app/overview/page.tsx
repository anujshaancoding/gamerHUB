"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Search,
  X,
  ArrowRight,
  Users,
  User,
  UserCheck,
  MessageCircle,
  Bell,
  Gamepad2,
  Shield,
  Trophy,
  BarChart3,
  GraduationCap,
  PenSquare,
  Store,
  Sparkles,
  TrendingUp,
  Award,
  Target,
  Layers,
  Crown,
  CreditCard,
  ShoppingBag,
  Plug,
  MessageSquare,
  Link2,
  Phone,
  Video,
  Radio,
  Zap,
  CircleDot,
  ShieldCheck,
  Eye,
  Palette,
  LogIn,
  UserPlus,
  Loader2,
  Send,
  Code2,
  Newspaper,
  BookOpen,
  ChevronUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

/* ------------------------------------------------------------------ */
/*  Feature data                                                       */
/* ------------------------------------------------------------------ */

interface Feature {
  title: string;
  icon: LucideIcon;
  description: string;
  link: string | null;
  keywords: string[];
}

interface FeatureCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  features: Feature[];
}

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: "core-social",
    title: "Core Social",
    icon: Users,
    description:
      "Connect with gamers worldwide through profiles, friendships, and real-time messaging.",
    features: [
      {
        title: "User Profiles",
        icon: User,
        description:
          "Customizable profiles with badges, titles, frames, themes, game stats, and rank history. Show off your gaming identity to the world.",
        link: "/profile",
        keywords: [
          "profile",
          "badges",
          "titles",
          "frames",
          "themes",
          "stats",
          "rank",
          "customize",
          "avatar",
        ],
      },
      {
        title: "Friends System",
        icon: UserCheck,
        description:
          "Send friend requests, manage your friend list, and follow or unfollow other gamers. Build your gaming network.",
        link: "/friends",
        keywords: [
          "friends",
          "follow",
          "followers",
          "following",
          "request",
          "social",
          "connect",
        ],
      },
      {
        title: "Messaging",
        icon: MessageCircle,
        description:
          "Real-time direct messages with conversation threads and message reactions. Stay in touch with your squad.",
        link: "/messages",
        keywords: [
          "messages",
          "DM",
          "chat",
          "direct message",
          "conversation",
          "reactions",
          "talk",
        ],
      },
      {
        title: "Notifications",
        icon: Bell,
        description:
          "Stay updated with real-time activity alerts for friend requests, achievements, messages, clan invites, and more.",
        link: null,
        keywords: [
          "notifications",
          "alerts",
          "activity",
          "updates",
          "real-time",
        ],
      },
    ],
  },
  {
    id: "gaming-competition",
    title: "Gaming & Competition",
    icon: Gamepad2,
    description:
      "Discover teammates, compete in tournaments, and track your gaming performance across multiple titles.",
    features: [
      {
        title: "Game Integration",
        icon: Gamepad2,
        description:
          "Connect your Valorant, BGMI, Free Fire, Steam, and other game accounts. Sync stats and rank automatically.",
        link: null,
        keywords: [
          "games",
          "valorant",
          "bgmi",
          "free fire",
          "steam",
          "stats",
          "sync",
          "connect",
          "integration",
          "add games",
        ],
      },
      {
        title: "Find Gamers",
        icon: Search,
        description:
          "Discover players by game, rank, region, language, and play style. Find your perfect duo or squad instantly.",
        link: "/find-gamers",
        keywords: [
          "find",
          "discover",
          "gamers",
          "players",
          "matchmaking",
          "rank",
          "region",
          "connect with gamers",
        ],
      },
      {
        title: "LFG - Looking for Group",
        icon: Users,
        description:
          "Post when you need teammates and browse posts from others. Specify requirements like rank, mic, and language.",
        link: "/community",
        keywords: [
          "lfg",
          "looking for group",
          "teammates",
          "squad",
          "party",
          "group",
          "team",
        ],
      },
      {
        title: "Clans",
        icon: Shield,
        description:
          "Create or join clans with custom roles (Leader, Officer, Member), clan challenges, and recruitment posts.",
        link: "/clans",
        keywords: [
          "clans",
          "guild",
          "team",
          "roles",
          "challenges",
          "recruitment",
          "join clan",
          "create clan",
        ],
      },
      {
        title: "Tournaments",
        icon: Trophy,
        description:
          "Create and participate in community tournaments with brackets, team management, and results tracking.",
        link: "/community",
        keywords: [
          "tournaments",
          "brackets",
          "compete",
          "esports",
          "competition",
          "matches",
        ],
      },
      {
        title: "Leaderboards",
        icon: BarChart3,
        description:
          "Seasonal rankings by game. See where you stand among the best players and climb the ladder.",
        link: null,
        keywords: [
          "leaderboards",
          "rankings",
          "seasons",
          "top players",
          "ladder",
          "competitive",
        ],
      },
      {
        title: "Coaching",
        icon: GraduationCap,
        description:
          "Find experienced coaches, book sessions, and leave reviews. Level up your gameplay with personalized guidance.",
        link: null,
        keywords: [
          "coaching",
          "coach",
          "sessions",
          "improve",
          "training",
          "mentor",
          "learn",
        ],
      },
    ],
  },
  {
    id: "content-community",
    title: "Content & Community",
    icon: BookOpen,
    description:
      "Share your gaming stories, join discussions, and create content for the community.",
    features: [
      {
        title: "Blog System",
        icon: PenSquare,
        description:
          "Write gaming articles with a rich text editor, choose from templates and color palettes. Get likes and comments from the community.",
        link: "/write",
        keywords: [
          "blog",
          "write",
          "article",
          "post",
          "editor",
          "templates",
          "content",
          "publish",
        ],
      },
      {
        title: "Community Hub",
        icon: Users,
        description:
          "Central hub for tournaments, community listings, friend posts, challenges, and everything happening on the platform.",
        link: "/community",
        keywords: [
          "community",
          "hub",
          "posts",
          "challenges",
          "social",
          "feed",
          "activity",
        ],
      },
      {
        title: "Giveaways & Events",
        icon: Store,
        description:
          "Create and browse community giveaways and events. Share prizes, set rules, pick winners, and engage the community.",
        link: "/community",
        keywords: [
          "giveaways",
          "events",
          "prizes",
          "winners",
          "community events",
          "free",
        ],
      },
    ],
  },
  {
    id: "gamification",
    title: "Gamification",
    icon: Sparkles,
    description:
      "Level up, collect badges, complete quests, and earn rewards just by using the platform.",
    features: [
      {
        title: "XP & Leveling",
        icon: TrendingUp,
        description:
          "Earn XP for every action you take on the platform. Level up your profile to unlock new features and show your dedication.",
        link: null,
        keywords: [
          "xp",
          "experience",
          "level",
          "leveling",
          "progress",
          "rank up",
        ],
      },
      {
        title: "Badges & Achievements",
        icon: Award,
        description:
          "Collect unique badges for completing challenges, milestones, and community activities. Pin your favorites to your profile.",
        link: null,
        keywords: [
          "badges",
          "achievements",
          "collect",
          "showcase",
          "challenge",
          "medals",
          "unlock",
        ],
      },
      {
        title: "Quests",
        icon: Target,
        description:
          "Complete daily and weekly quests for bonus XP and exclusive rewards. New quests refresh regularly.",
        link: null,
        keywords: [
          "quests",
          "daily",
          "weekly",
          "missions",
          "rewards",
          "tasks",
        ],
      },
      {
        title: "Battle Pass",
        icon: Layers,
        description:
          "Free and premium tiers with seasonal rewards. Unlock exclusive cosmetics, titles, and frames as you progress through each season.",
        link: null,
        keywords: [
          "battle pass",
          "seasons",
          "tiers",
          "rewards",
          "cosmetics",
          "premium",
        ],
      },
      {
        title: "Titles & Cosmetics",
        icon: Crown,
        description:
          "Equip custom titles, profile frames, and themes to personalize your profile. Stand out from the crowd.",
        link: null,
        keywords: [
          "titles",
          "cosmetics",
          "frames",
          "themes",
          "customize",
          "personalize",
          "skins",
        ],
      },
    ],
  },
  {
    id: "premium",
    title: "Premium & Rewards",
    icon: Crown,
    description:
      "Unlock exclusive features and cosmetics with ggLobby Premium.",
    features: [
      {
        title: "Premium Subscription",
        icon: CreditCard,
        description:
          "Multiple tiers with exclusive features like profile view tracking, priority matchmaking, and exclusive badges. Cancel anytime.",
        link: "/premium",
        keywords: [
          "premium",
          "subscription",
          "pro",
          "paid",
          "pricing",
          "upgrade",
          "plan",
        ],
      },
      {
        title: "Shop",
        icon: ShoppingBag,
        description:
          "Browse in-app items and premium cosmetics. Use in-platform currency to enhance your profile and unlock exclusive items.",
        link: null,
        keywords: [
          "shop",
          "store",
          "items",
          "currency",
          "buy",
          "purchase",
          "cosmetics",
        ],
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    icon: Plug,
    description:
      "Connect your gaming accounts and external platforms for a seamless, unified experience.",
    features: [
      {
        title: "Discord Integration",
        icon: MessageSquare,
        description:
          "Connect Discord via OAuth, sync your profile, cross-post updates to your server, and import your Discord friends list.",
        link: null,
        keywords: [
          "discord",
          "integration",
          "oauth",
          "sync",
          "cross-post",
          "import friends",
          "server",
        ],
      },
      {
        title: "Platform Connections",
        icon: Link2,
        description:
          "Link Xbox, PlayStation, Steam, and Twitch accounts to your profile. Show all your gaming identities in one place.",
        link: null,
        keywords: [
          "xbox",
          "playstation",
          "steam",
          "twitch",
          "platform",
          "connect",
          "link",
          "console",
        ],
      },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    icon: Phone,
    description:
      "Voice, video, and live streaming features for real-time interaction with your gaming community.",
    features: [
      {
        title: "Voice & Video Calls",
        icon: Video,
        description:
          "Start voice and video calls with friends directly on the platform. Share your screen during strategy sessions.",
        link: null,
        keywords: [
          "voice",
          "video",
          "call",
          "audio",
          "screen share",
          "talk",
          "webcam",
        ],
      },
      {
        title: "Live Streaming",
        icon: Radio,
        description:
          "Watch live streams from community members with Twitch embeds. See who is live right now.",
        link: null,
        keywords: [
          "streaming",
          "live",
          "twitch",
          "watch",
          "broadcast",
          "stream",
        ],
      },
    ],
  },
  {
    id: "advanced",
    title: "Advanced Features",
    icon: Zap,
    description:
      "Power-user features for search, presence, trust, accessibility, and content creation.",
    features: [
      {
        title: "Universal Search",
        icon: Search,
        description:
          "Search across users, blog posts, forums, and community content from one unified search bar.",
        link: "/search",
        keywords: [
          "search",
          "find",
          "universal",
          "discover",
          "lookup",
          "query",
        ],
      },
      {
        title: "Status & Presence",
        icon: CircleDot,
        description:
          "Set your status to online, away, do not disturb, or appear offline. See your friends\u2019 statuses in real-time.",
        link: "/settings",
        keywords: [
          "status",
          "presence",
          "online",
          "away",
          "dnd",
          "offline",
          "availability",
        ],
      },
      {
        title: "Player Endorsements",
        icon: Award,
        description:
          "Endorse other players for traits like Friendly, Team Player, Leader, Communicative, and Reliable. Build your reputation through community recognition.",
        link: null,
        keywords: [
          "endorsements",
          "endorse",
          "traits",
          "friendly",
          "team player",
          "leader",
          "reputation",
          "reliable",
          "communicative",
        ],
      },
      {
        title: "Trust & Verification",
        icon: ShieldCheck,
        description:
          "Phone verification, trust scores, and verified badges help build a safer, more trustworthy community.",
        link: null,
        keywords: [
          "trust",
          "verification",
          "phone",
          "verify",
          "safety",
          "verified",
          "badge",
        ],
      },
      {
        title: "Accessibility",
        icon: Eye,
        description:
          "Color-blind filters, high contrast mode, and accessibility settings to make ggLobby comfortable for everyone.",
        link: null,
        keywords: [
          "accessibility",
          "color blind",
          "high contrast",
          "a11y",
          "settings",
        ],
      },
      {
        title: "Creator Tools",
        icon: Palette,
        description:
          "Analytics dashboards, clip management, and overlay generation tools for content creators and streamers.",
        link: null,
        keywords: [
          "creator",
          "tools",
          "analytics",
          "clips",
          "overlays",
          "streamer",
          "content",
        ],
      },
    ],
  },
];

const HOW_IT_WORKS = [
  {
    title: "Create Your Profile",
    description:
      "Sign up for free and build your gaming identity with a customizable profile, avatar, and bio.",
    icon: User,
  },
  {
    title: "Connect Your Games",
    description:
      "Link your game accounts like Valorant, Steam, or Xbox to automatically sync your stats and ranks.",
    icon: Gamepad2,
  },
  {
    title: "Find Your Squad",
    description:
      "Discover gamers by game, rank, and region. Send friend requests, join clans, and form your team.",
    icon: Users,
  },
  {
    title: "Compete & Grow",
    description:
      "Enter tournaments, complete quests, earn badges, and climb the leaderboards. Level up as you play.",
    icon: Trophy,
  },
];

const CONTRIBUTION_ROLES = [
  {
    role: "Developer",
    icon: Code2,
    description:
      "Help build new features, fix bugs, and contribute to the open-source codebase. Experience with React, Next.js, or Supabase is a plus.",
    color: "primary" as const,
  },
  {
    role: "News Creator",
    icon: Newspaper,
    description:
      "Cover esports events, gaming industry news, game updates, and community stories. Keep the community informed.",
    color: "accent" as const,
  },
  {
    role: "Blog Writer",
    icon: BookOpen,
    description:
      "Share game guides, reviews, tier lists, and opinion pieces. Help other gamers improve and discover new titles.",
    color: "warning" as const,
  },
];

const FEEDBACK_CATEGORIES = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Idea" },
  { value: "design", label: "Design" },
  { value: "general", label: "General" },
] as const;

/* ------------------------------------------------------------------ */
/*  Animations                                                         */
/* ------------------------------------------------------------------ */

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OverviewPage() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  // Search
  const [query, setQuery] = useState("");

  // Contribution form
  const [contribOpen, setContribOpen] = useState<string | null>(null);
  const [contribName, setContribName] = useState("");
  const [contribEmail, setContribEmail] = useState("");
  const [contribMessage, setContribMessage] = useState("");
  const [contribSending, setContribSending] = useState(false);

  // Feedback form
  const [fbName, setFbName] = useState("");
  const [fbEmail, setFbEmail] = useState("");
  const [fbCategory, setFbCategory] = useState("general");
  const [fbMessage, setFbMessage] = useState("");
  const [fbSending, setFbSending] = useState(false);

  // Back to top
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---- Search filtering ---- */
  const filteredCategories = useMemo(() => {
    if (!query.trim()) return FEATURE_CATEGORIES;

    const q = query.toLowerCase();
    return FEATURE_CATEGORIES.map((cat) => ({
      ...cat,
      features: cat.features.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.keywords.some((k) => k.toLowerCase().includes(q))
      ),
    })).filter((cat) => cat.features.length > 0);
  }, [query]);

  const totalResults = filteredCategories.reduce(
    (sum, c) => sum + c.features.length,
    0
  );

  /* ---- Contribution submit ---- */
  const handleContribSubmit = async () => {
    if (!contribName.trim() || !contribEmail.trim() || !contribMessage.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setContribSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[CONTRIBUTION REQUEST] Role: ${contribOpen} | Name: ${contribName.trim()} | Email: ${contribEmail.trim()} | Message: ${contribMessage.trim()}`,
          category: "feature",
          page_url: "/overview",
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      toast.success("Request sent! We'll get back to you soon.");
      setContribOpen(null);
      setContribName("");
      setContribEmail("");
      setContribMessage("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setContribSending(false);
    }
  };

  /* ---- Feedback submit ---- */
  const handleFeedbackSubmit = async () => {
    if (!fbMessage.trim()) {
      toast.error("Please enter your suggestion or feedback");
      return;
    }
    setFbSending(true);
    try {
      const namePart = fbName.trim() ? `Name: ${fbName.trim()} | ` : "";
      const emailPart = fbEmail.trim() ? `Email: ${fbEmail.trim()} | ` : "";
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${namePart}${emailPart}${fbMessage.trim()}`,
          category: fbCategory,
          page_url: "/overview",
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      toast.success("Thanks for your feedback!");
      setFbName("");
      setFbEmail("");
      setFbMessage("");
      setFbCategory("general");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setFbSending(false);
    }
  };

  /* ---- Scroll helpers ---- */
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background text-text">
      {/* ============================================================ */}
      {/*  Mini Nav                                                     */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-text hover:text-primary transition-colors"
          >
            gg<span className="text-primary">Lobby</span>
          </Link>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link
                href="/community"
                className="px-4 py-1.5 rounded-lg bg-primary/90 hover:bg-primary text-background text-sm font-semibold transition-colors"
              >
                Go to Home
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-sm font-medium text-text-secondary hover:text-text transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-lg bg-primary/90 hover:bg-primary text-background text-sm font-semibold transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  Hero                                                         */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Decorative blurs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
          >
            Welcome to{" "}
            <span className="text-primary text-glow-primary">ggLobby</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 max-w-2xl mx-auto text-lg sm:text-xl text-text-secondary leading-relaxed"
          >
            The ultimate gaming social platform. Connect with gamers, track your
            stats, join clans, compete in tournaments, and grow your gaming
            identity &mdash; all in one place.
          </motion.p>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            {[
              "40+ Features",
              "6+ Games Supported",
              "100% Free to Start",
            ].map((s) => (
              <span
                key={s}
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-surface-light border border-border text-text-secondary"
              >
                {s}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Link
              href={isLoggedIn ? "/community" : "/register"}
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-background font-semibold text-sm transition-colors shadow-lg shadow-primary/20"
            >
              {isLoggedIn ? "Go to Home" : "Get Started Free"}
            </Link>
            <button
              onClick={() => scrollTo("features")}
              className="px-6 py-3 rounded-xl border border-border hover:border-primary/40 text-text-secondary hover:text-text text-sm font-medium transition-colors"
            >
              Explore Features
            </button>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Search Bar                                                   */}
      {/* ============================================================ */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-4">
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search features... (e.g. messaging, clans, add games, connect with gamers)"
            className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-border bg-surface text-text placeholder:text-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-light text-text-muted hover:text-text transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {query.trim() && (
          <p className="text-center text-sm text-text-muted mt-3">
            {totalResults} feature{totalResults !== 1 ? "s" : ""} found for{" "}
            &ldquo;{query}&rdquo;
          </p>
        )}
      </section>

      {/* ============================================================ */}
      {/*  Feature Sections                                             */}
      {/* ============================================================ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-20">
        {filteredCategories.map((cat) => (
          <motion.section
            key={cat.id}
            id={cat.id}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeInUp}
          >
            {/* Category header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <cat.icon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text">
                {cat.title}
              </h2>
            </div>
            <p className="text-text-muted mb-8 max-w-2xl">{cat.description}</p>

            {/* Feature cards */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {cat.features.map((f) => (
                <motion.div key={f.title} variants={fadeInUp}>
                  <div className="h-full bg-surface border border-border rounded-xl p-6 card-hover group flex flex-col">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="shrink-0 p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        <f.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-text mb-1.5">
                          {f.title}
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                          {f.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50">
                      {f.link ? (
                        <Link
                          href={f.link}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                        >
                          Explore
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-dim bg-surface-light px-2.5 py-1 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        ))}

        {/* No results */}
        {query.trim() && filteredCategories.length === 0 && (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-text-dim mx-auto mb-4" />
            <p className="text-xl font-semibold text-text mb-2">
              No features found
            </p>
            <p className="text-text-muted">
              Try a different search term like &ldquo;messaging&rdquo;,
              &ldquo;clans&rdquo;, or &ldquo;badges&rdquo;.
            </p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  How It Works                                                 */}
      {/* ============================================================ */}
      <section className="border-t border-border bg-surface/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeInUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-3">
              How It Works
            </h2>
            <p className="text-text-muted max-w-xl mx-auto">
              Get started in minutes. Here&apos;s how to make the most of
              ggLobby.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold text-lg mb-5">
                  {i + 1}
                </div>
                <div className="mb-3 flex justify-center">
                  <step.icon className="h-6 w-6 text-text-secondary" />
                </div>
                <h3 className="font-semibold text-text mb-2">{step.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <Link
              href={isLoggedIn ? "/community" : "/register"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-background font-semibold text-sm transition-colors shadow-lg shadow-primary/20"
            >
              {isLoggedIn ? "Go to Home" : "Get Started Free"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Contribute                                                   */}
      {/* ============================================================ */}
      <section className="border-t border-border" id="contribute">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeInUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-3">
              Want to Contribute?
            </h2>
            <p className="text-text-muted max-w-xl mx-auto">
              ggLobby is built by the community, for the community. Join us as a
              developer, news creator, or blog writer.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {CONTRIBUTION_ROLES.map((r) => {
              const colorMap = {
                primary: {
                  bg: "bg-primary/10",
                  text: "text-primary",
                  border: "border-primary/30",
                  hoverBg: "hover:bg-primary/20",
                  btnBg: "bg-primary/15 hover:bg-primary/25 text-primary",
                },
                accent: {
                  bg: "bg-accent/10",
                  text: "text-accent",
                  border: "border-accent/30",
                  hoverBg: "hover:bg-accent/20",
                  btnBg: "bg-accent/15 hover:bg-accent/25 text-accent",
                },
                warning: {
                  bg: "bg-warning/10",
                  text: "text-warning",
                  border: "border-warning/30",
                  hoverBg: "hover:bg-warning/20",
                  btnBg: "bg-warning/15 hover:bg-warning/25 text-warning",
                },
              };
              const c = colorMap[r.color];

              return (
                <motion.div key={r.role} variants={fadeInUp}>
                  <div
                    className={`h-full bg-surface border ${
                      contribOpen === r.role ? c.border : "border-border"
                    } rounded-xl p-6 flex flex-col transition-colors`}
                  >
                    <div
                      className={`shrink-0 w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center mb-4`}
                    >
                      <r.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-text mb-2">
                      {r.role}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed flex-1">
                      {r.description}
                    </p>
                    <button
                      onClick={() =>
                        setContribOpen(contribOpen === r.role ? null : r.role)
                      }
                      className={`mt-5 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${c.btnBg}`}
                    >
                      {contribOpen === r.role
                        ? "Close Form"
                        : "Request to Join"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Contribution form */}
          {contribOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-lg mx-auto bg-surface border border-border rounded-xl p-6 sm:p-8"
            >
              <h3 className="text-lg font-semibold text-text mb-1">
                Apply as {contribOpen}
              </h3>
              <p className="text-sm text-text-muted mb-6">
                Fill in your details and we&apos;ll reach out to you.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Your Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={contribName}
                    onChange={(e) => setContribName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-light text-text placeholder:text-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Email <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    value={contribEmail}
                    onChange={(e) => setContribEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-light text-text placeholder:text-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Why do you want to contribute?{" "}
                    <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={contribMessage}
                    onChange={(e) => setContribMessage(e.target.value)}
                    placeholder="Tell us about your experience and what you'd like to work on..."
                    rows={4}
                    maxLength={2000}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-light text-text placeholder:text-text-dim text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                  />
                </div>

                <button
                  onClick={handleContribSubmit}
                  disabled={contribSending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-background text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {contribSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit Request
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Feedback & Suggestions                                       */}
      {/* ============================================================ */}
      <section className="border-t border-border bg-surface/40" id="feedback">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeInUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-3">
              Feedback & Suggestions
            </h2>
            <p className="text-text-muted max-w-xl mx-auto">
              Have an idea, found a bug, or want to share your thoughts? We
              &apos;d love to hear from you. Your feedback shapes ggLobby.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-xl mx-auto bg-surface border border-border rounded-xl p-6 sm:p-8"
          >
            <div className="space-y-5">
              {/* Name & Email row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Name{" "}
                    <span className="text-text-dim text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={fbName}
                    onChange={(e) => setFbName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-light text-text placeholder:text-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Email{" "}
                    <span className="text-text-dim text-xs">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={fbEmail}
                    onChange={(e) => setFbEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-light text-text placeholder:text-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                  />
                </div>
              </div>

              {/* Category pills */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setFbCategory(c.value)}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        fbCategory === c.value
                          ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                          : "bg-surface-light text-text-muted hover:text-text-secondary border border-border"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Your Feedback <span className="text-error">*</span>
                </label>
                <textarea
                  value={fbMessage}
                  onChange={(e) => setFbMessage(e.target.value)}
                  placeholder="Tell us what you think, report a bug, or suggest a feature..."
                  rows={5}
                  maxLength={2000}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface-light text-text placeholder:text-text-dim text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                />
                <p className="text-xs text-text-dim mt-1 text-right">
                  {fbMessage.length} / 2000
                </p>
              </div>

              <button
                onClick={handleFeedbackSubmit}
                disabled={!fbMessage.trim() || fbSending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-primary-dark text-background text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fbSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Feedback
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Footer                                                       */}
      {/* ============================================================ */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/"
              className="text-lg font-bold text-text hover:text-primary transition-colors"
            >
              gg<span className="text-primary">Lobby</span>
            </Link>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-text-muted">
              <Link
                href="/privacy"
                className="hover:text-text transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-text transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/guidelines"
                className="hover:text-text transition-colors"
              >
                Community Guidelines
              </Link>
            </div>

            <p className="text-xs text-text-dim">
              &copy; {new Date().getFullYear()} ggLobby. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/*  Back to top                                                  */}
      {/* ============================================================ */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-6 z-40 p-3 rounded-full bg-surface border border-border shadow-lg hover:border-primary/40 text-text-muted hover:text-primary transition-all"
          aria-label="Back to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
