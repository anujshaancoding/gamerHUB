"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
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
  PenSquare,
  Sparkles,
  TrendingUp,
  Award,
  Target,
  Crown,
  CreditCard,
  Plug,
  Zap,
  CircleDot,
  Eye,
  Palette,
  Loader2,
  Send,
  Code2,
  Newspaper,
  BookOpen,
  ChevronUp,
  Heart,
  Flame,
  Globe,
  LayoutDashboard,
  Lock,
  Smartphone,
  HelpCircle,
  History,
  Star,
  CheckCircle2,
  Mail,
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
          "Real-time direct messages with conversation threads, reactions, typing indicators, and game-themed wallpapers.",
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
          "Stay updated with real-time alerts for friend requests, achievements, messages, clan invites, and more. Fully customizable.",
        link: "/notifications",
        keywords: [
          "notifications",
          "alerts",
          "activity",
          "updates",
          "real-time",
        ],
      },
      {
        title: "Online Status & Presence",
        icon: CircleDot,
        description:
          "Set your status to Online, Idle, In-Game, Away, or Do Not Disturb. See friends' statuses in real-time.",
        link: null,
        keywords: [
          "status",
          "presence",
          "online",
          "away",
          "dnd",
          "offline",
          "availability",
          "in-game",
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
          "Add your Valorant, BGMI, Free Fire, and other game accounts. Display your stats, rank, and game history on your profile.",
        link: null,
        keywords: [
          "games",
          "valorant",
          "bgmi",
          "free fire",
          "stats",
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
        title: "LFG — Looking for Group",
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
          "Create or join clans with roles (Leader, Officer, Member), clan wall, member management, and recruitment posts.",
        link: "/clans",
        keywords: [
          "clans",
          "guild",
          "team",
          "roles",
          "recruitment",
          "join clan",
          "create clan",
          "clan wall",
        ],
      },
      {
        title: "Tournaments & Giveaways",
        icon: Trophy,
        description:
          "Browse and join community tournaments and giveaways. Compete for prizes, track results, and discover events.",
        link: "/community",
        keywords: [
          "tournaments",
          "giveaways",
          "compete",
          "esports",
          "competition",
          "prizes",
          "events",
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
    ],
  },
  {
    id: "content-community",
    title: "Content & Community",
    icon: BookOpen,
    description:
      "Read gaming news, write blogs, share updates, and engage with a thriving gaming community.",
    features: [
      {
        title: "Gaming News",
        icon: Newspaper,
        description:
          "Curated gaming news covering esports, patch notes, and updates across Valorant, BGMI, Free Fire, and more. Filter by game, category, and region.",
        link: "/community",
        keywords: [
          "news",
          "esports",
          "patch notes",
          "gaming news",
          "updates",
          "articles",
        ],
      },
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
        icon: Globe,
        description:
          "Your central feed combining news, blogs, friend posts, LFG listings, and everything happening on the platform.",
        link: "/community",
        keywords: [
          "community",
          "hub",
          "posts",
          "social",
          "feed",
          "activity",
        ],
      },
      {
        title: "Friend Posts",
        icon: Heart,
        description:
          "Share status updates with text and images. Like and comment on friends' posts. Stay connected with your gaming circle.",
        link: "/community",
        keywords: [
          "posts",
          "status",
          "share",
          "like",
          "comment",
          "social feed",
          "updates",
        ],
      },
    ],
  },
  {
    id: "gamification",
    title: "Gamification & Progression",
    icon: Sparkles,
    description:
      "Level up, collect badges, complete quests, and earn rewards just by using the platform.",
    features: [
      {
        title: "XP & Leveling",
        icon: TrendingUp,
        description:
          "Earn XP for every action you take on the platform. Level up your profile and show your dedication.",
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
          "Collect unique badges for milestones and community activities. Pin your favorites to your profile for everyone to see.",
        link: null,
        keywords: [
          "badges",
          "achievements",
          "collect",
          "showcase",
          "medals",
          "unlock",
        ],
      },
      {
        title: "Daily & Weekly Quests",
        icon: Target,
        description:
          "Complete quests for bonus XP and exclusive rewards. New quests refresh daily and weekly to keep things exciting.",
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
        title: "Titles, Frames & Themes",
        icon: Crown,
        description:
          "Equip custom titles, profile frames, and themes to personalize your profile. Choose from multiple theme skins to stand out.",
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
      {
        title: "Player Endorsements",
        icon: Star,
        description:
          "Endorse other players for traits like Friendly, Team Player, Leader, Communicative, and Reliable. Build your reputation.",
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
        ],
      },
    ],
  },
  {
    id: "premium",
    title: "Premium",
    icon: Crown,
    description:
      "Unlock exclusive perks and features with ggLobby Premium.",
    features: [
      {
        title: "Premium Subscription",
        icon: CreditCard,
        description:
          "Get profile view tracking, blog creation, exclusive badges, and premium cosmetics. Flexible billing with monthly or yearly plans.",
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
    ],
  },
  {
    id: "profile-settings",
    title: "Profile & Settings",
    icon: Palette,
    description:
      "Full control over your profile, privacy, appearance, and connected accounts.",
    features: [
      {
        title: "Profile Customization",
        icon: Palette,
        description:
          "Edit your display name, bio, avatar, gaming preferences, language, and region. Make your profile truly yours.",
        link: "/settings",
        keywords: [
          "settings",
          "profile",
          "edit",
          "customize",
          "avatar",
          "bio",
          "preferences",
        ],
      },
      {
        title: "Privacy Controls",
        icon: Lock,
        description:
          "Control who sees your profile, online status, game stats, achievements, and activity feed. Your data, your rules.",
        link: "/settings",
        keywords: [
          "privacy",
          "visibility",
          "controls",
          "hide",
          "public",
          "private",
        ],
      },
      {
        title: "Connected Accounts",
        icon: Plug,
        description:
          "Link your Discord account and game profiles to your ggLobby profile for a unified gaming identity.",
        link: "/settings/connections",
        keywords: [
          "discord",
          "connections",
          "link",
          "integration",
          "connected",
          "accounts",
        ],
      },
      {
        title: "Appearance",
        icon: Eye,
        description:
          "Switch between Dark and Light themes, choose custom theme skins, and adjust the platform to your visual preference.",
        link: "/settings",
        keywords: [
          "theme",
          "dark mode",
          "light mode",
          "appearance",
          "skins",
          "display",
        ],
      },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    icon: Zap,
    description:
      "Built for gamers — fast, searchable, mobile-friendly, and always improving.",
    features: [
      {
        title: "Universal Search",
        icon: Search,
        description:
          "Search across users, blog posts, clans, and listings from one unified search bar. Find anything instantly.",
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
        title: "Dashboard",
        icon: LayoutDashboard,
        description:
          "Your personal hub with quick stats, recent activity, quest progress, upcoming matches, and recommended gamers.",
        link: "/dashboard",
        keywords: [
          "dashboard",
          "stats",
          "overview",
          "activity",
          "home",
          "hub",
        ],
      },
      {
        title: "Install as App",
        icon: Smartphone,
        description:
          "Install ggLobby as a Progressive Web App on your phone or desktop. Get a native app-like experience with offline support.",
        link: null,
        keywords: [
          "pwa",
          "install",
          "app",
          "mobile",
          "offline",
          "progressive web app",
        ],
      },
      {
        title: "Help Center",
        icon: HelpCircle,
        description:
          "FAQ, feature guides, and troubleshooting to help you get the most out of ggLobby.",
        link: "/help",
        keywords: [
          "help",
          "faq",
          "support",
          "guide",
          "troubleshooting",
        ],
      },
      {
        title: "Updates & Changelog",
        icon: History,
        description:
          "See every new feature, improvement, and fix we ship. We build in public and update constantly.",
        link: "/updates",
        keywords: [
          "updates",
          "changelog",
          "version",
          "new features",
          "release notes",
        ],
      },
    ],
  },
];

const HOW_IT_WORKS = [
  {
    title: "Create Your Profile",
    description:
      "Sign up for free in seconds. Set up your gaming identity with an avatar, bio, and game preferences.",
    icon: User,
  },
  {
    title: "Add Your Games",
    description:
      "Add your game accounts like Valorant, BGMI, or Free Fire to display your stats and rank on your profile.",
    icon: Gamepad2,
  },
  {
    title: "Find Your Squad",
    description:
      "Discover gamers by game, rank, and region. Send friend requests, join clans, and form your perfect team.",
    icon: Users,
  },
  {
    title: "Level Up Together",
    description:
      "Complete quests, earn badges, climb leaderboards, and grow your gaming reputation. The more you play, the more you unlock.",
    icon: Trophy,
  },
];

const SOCIAL_PROOF = [
  {
    icon: Gamepad2,
    value: "6+",
    numericTarget: 6,
    label: "Games Supported",
  },
  {
    icon: Zap,
    value: "30+",
    numericTarget: 30,
    label: "Features Live",
  },
  {
    icon: Shield,
    value: "Active",
    numericTarget: null,
    label: "Clan System",
  },
  {
    icon: Flame,
    value: "Daily",
    numericTarget: null,
    label: "New Content",
  },
];

const WHY_GGLOBBY = [
  {
    title: "Built by Gamers, for Gamers",
    description:
      "Every feature is designed around what gamers actually need — not what looks good in a pitch deck.",
    icon: Heart,
  },
  {
    title: "More Than Just Stats",
    description:
      "Profiles with personality. Badges, endorsements, themes, titles — your gaming identity goes beyond K/D ratios.",
    icon: Sparkles,
  },
  {
    title: "Find Real Teammates",
    description:
      "Filter by rank, language, play style, and mic preference. No more random fills with zero comms.",
    icon: Users,
  },
  {
    title: "Always Improving",
    description:
      "We ship updates constantly and listen to community feedback. Check our changelog — we don't just promise, we deliver.",
    icon: TrendingUp,
  },
];

const CONTRIBUTION_ROLES = [
  {
    role: "Developer",
    icon: Code2,
    description:
      "Help build new features, fix bugs, and contribute to the codebase. Experience with React, Next.js, or PostgreSQL is a plus.",
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

const GAME_BADGES = [
  { name: "Valorant", color: "from-red-500 to-red-700" },
  { name: "BGMI", color: "from-yellow-500 to-orange-600" },
  { name: "Free Fire", color: "from-orange-400 to-red-500" },
  { name: "CS2", color: "from-amber-500 to-yellow-600" },
  { name: "Apex Legends", color: "from-red-600 to-red-800" },
  { name: "COD Mobile", color: "from-green-500 to-emerald-700" },
];

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
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */

function useCountUp(target: number | null, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || target === null) return;
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [inView, target, duration]);

  return { count, ref };
}

function AnimatedStat({
  icon: Icon,
  numericTarget,
  value,
  label,
}: {
  icon: LucideIcon;
  numericTarget: number | null;
  value: string;
  label: string;
}) {
  const { count, ref } = useCountUp(numericTarget);

  return (
    <div className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl bg-surface/60 border border-border/60 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
      <Icon className="h-5 w-5 text-primary" />
      <span ref={ref} className="text-2xl font-bold text-text">
        {numericTarget !== null ? `${count}+` : value}
      </span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

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

  // Newsletter
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSending, setNewsletterSending] = useState(false);

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

  /* ---- Newsletter submit ---- */
  const handleNewsletterSubmit = useCallback(async () => {
    const email = newsletterEmail.trim();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setNewsletterSending(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to subscribe");
      toast.success("You're subscribed! Check your inbox.");
      setNewsletterEmail("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setNewsletterSending(false);
    }
  }, [newsletterEmail]);

  /* ---- Scroll helpers ---- */
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background text-text">
      {/* ============================================================ */}
      {/*  Mini Nav                                                     */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-text hover:text-primary transition-colors"
          >
            gg<span className="text-primary">Lobby</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-text-muted">
            <button
              onClick={() => scrollTo("features")}
              className="hover:text-text transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="hover:text-text transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo("contribute")}
              className="hover:text-text transition-colors"
            >
              Contribute
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link
                href="/community"
                className="px-4 py-1.5 rounded-lg bg-primary/90 hover:bg-primary text-background text-sm font-semibold transition-colors ring-1 ring-primary/20"
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
                  className="px-4 py-1.5 rounded-lg bg-primary/90 hover:bg-primary text-background text-sm font-semibold transition-colors ring-1 ring-primary/20"
                >
                  Sign Up Free
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
        {/* Animated gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/5 rounded-full blur-[150px]" />
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-accent/6 rounded-full blur-[80px]" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:py-36 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-sm font-semibold text-primary uppercase tracking-widest mb-5"
          >
            Your Gaming Identity Starts Here
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
          >
            Stop Playing Solo.{" "}
            <br className="hidden sm:block" />
            Start Playing{" "}
            <span className="bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
              Together.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-text-secondary leading-relaxed"
          >
            ggLobby is the gaming social platform where you find teammates,
            join clans, read gaming news, track your stats, complete quests,
            and build your reputation &mdash; all for free.
          </motion.p>

          {/* Game badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
            {GAME_BADGES.map((game) => (
              <span
                key={game.name}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${game.color} shadow-sm`}
              >
                <Gamepad2 className="h-3 w-3" />
                {game.name}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Link
              href={isLoggedIn ? "/community" : "/register"}
              className="group px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-background font-bold text-base transition-all shadow-lg shadow-primary/25 ring-1 ring-primary/50 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
            >
              {isLoggedIn ? "Go to Home" : "Join ggLobby — It's Free"}
              <ArrowRight className="inline-block ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              onClick={() => scrollTo("features")}
              className="px-6 py-3.5 rounded-xl border border-border hover:border-primary/40 text-text-secondary hover:text-text text-sm font-medium transition-all backdrop-blur-sm hover:bg-surface/50 ring-1 ring-transparent hover:ring-primary/20"
            >
              See What&apos;s Inside
            </button>
          </motion.div>

          {/* Social proof — Trusted by gamers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-12 flex flex-col items-center gap-3"
          >
            <div className="flex items-center -space-x-2">
              {[
                "from-violet-500 to-purple-600",
                "from-blue-500 to-cyan-500",
                "from-pink-500 to-rose-500",
                "from-amber-400 to-orange-500",
                "from-emerald-400 to-green-600",
              ].map((gradient, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} border-2 border-background flex items-center justify-center`}
                >
                  <User className="h-3.5 w-3.5 text-white/80" />
                </div>
              ))}
            </div>
            <p className="text-sm text-text-muted">
              Trusted by <span className="text-text font-semibold">500+</span> gamers and growing
            </p>
          </motion.div>

          {/* Social proof stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {SOCIAL_PROOF.map((s) => (
              <AnimatedStat
                key={s.label}
                icon={s.icon}
                numericTarget={s.numericTarget}
                value={s.value}
                label={s.label}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Why ggLobby                                                  */}
      {/* ============================================================ */}
      <section className="relative border-b border-border overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2" />
          <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px] -translate-y-1/2" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeInUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Why Gamers Choose{" "}
              <span className="bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
                ggLobby
              </span>
            </h2>
            <p className="text-text-muted max-w-xl mx-auto">
              Not just another gaming platform. Here&apos;s what makes us different.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {WHY_GGLOBBY.map((item) => (
              <motion.div key={item.title} variants={fadeInUp}>
                <div className="group h-full bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-7 text-center transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                  {/* Gradient accent line at top */}
                  <div className="h-0.5 w-12 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary to-accent opacity-60 group-hover:opacity-100 group-hover:w-16 transition-all duration-300" />
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold text-text mb-2 text-lg">{item.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Search Bar                                                   */}
      {/* ============================================================ */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Everything You{" "}
            <span className="bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
              Need
            </span>
          </h2>
          <p className="text-text-muted max-w-xl mx-auto">
            Explore every feature ggLobby has to offer. Search or scroll to discover what&apos;s available.
          </p>
        </motion.div>

        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search features... (e.g. messaging, clans, quests, news)"
            className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-border bg-surface/80 backdrop-blur-sm text-text placeholder:text-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 space-y-24">
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
              <div className="p-2.5 rounded-xl bg-primary/10">
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
                  <div className="group h-full bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-6 flex flex-col transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden">
                    {/* Gradient accent line at top */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="flex items-start gap-4 flex-1">
                      <div className="shrink-0 p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:shadow-md group-hover:shadow-primary/10 transition-all duration-300">
                        <f.icon className="h-6 w-6" />
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
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors group/link"
                        >
                          Try It
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-surface-light px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          Available
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
      {/*  Mid-page CTA                                                 */}
      {/* ============================================================ */}
      {!isLoggedIn && (
        <section className="relative border-t border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-accent/5 pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/3 w-[300px] h-[300px] bg-primary/8 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-accent/8 rounded-full blur-[80px]" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
                Ready to Find Your Squad?
              </h2>
              <p className="text-text-secondary max-w-xl mx-auto mb-8 text-lg">
                Join a growing community of gamers who are tired of playing with randoms.
                Create your profile, find teammates, and start winning together.
              </p>
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-background font-bold text-base transition-all shadow-lg shadow-primary/25 ring-1 ring-primary/50 hover:shadow-xl hover:shadow-primary/30"
              >
                Create Free Account
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <p className="text-xs text-text-dim mt-4">
                No credit card required. Set up in under a minute.
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/*  How It Works                                                 */}
      {/* ============================================================ */}
      <section id="how-it-works" className="relative border-t border-border overflow-hidden">
        <div className="absolute inset-0 bg-surface/40 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Get Started in{" "}
              <span className="bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
                4 Steps
              </span>
            </h2>
            <p className="text-text-muted max-w-xl mx-auto">
              From signup to your first squad game in minutes. No friction, no filler.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6"
          >
            {/* Connecting line — visible only on lg */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-[2px] pointer-events-none">
              <div className="w-full h-full bg-gradient-to-r from-primary/40 via-purple-400/40 to-accent/40 rounded-full" />
            </div>

            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeInUp}
                className="relative text-center"
              >
                {/* Step number with gradient */}
                <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/15 to-accent/10 border border-primary/20 flex items-center justify-center font-extrabold text-2xl text-primary mb-6 shadow-lg shadow-primary/5">
                  {i + 1}
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-primary/10" />
                </div>
                <div className="mb-3 flex justify-center">
                  <step.icon className="h-6 w-6 text-text-secondary" />
                </div>
                <h3 className="font-semibold text-text mb-2 text-lg">{step.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-14">
            <Link
              href={isLoggedIn ? "/community" : "/register"}
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-background font-semibold text-sm transition-all shadow-lg shadow-primary/20 ring-1 ring-primary/50"
            >
              {isLoggedIn ? "Go to Home" : "Get Started Free"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Newsletter                                                   */}
      {/* ============================================================ */}
      <section className="relative border-t border-border overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeInUp}
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
              <Mail className="h-7 w-7" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Stay in the{" "}
              <span className="bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
                Loop
              </span>
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto mb-8 text-lg">
              Get weekly gaming news, patch updates, and community highlights delivered to your inbox.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNewsletterSubmit()}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-surface/80 backdrop-blur-sm text-text placeholder:text-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
              />
              <button
                onClick={handleNewsletterSubmit}
                disabled={newsletterSending}
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-background text-sm font-semibold transition-all ring-1 ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 flex items-center justify-center gap-2"
              >
                {newsletterSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Subscribe
              </button>
            </div>

            <p className="text-xs text-text-dim mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Contribute                                                   */}
      {/* ============================================================ */}
      <section className="border-t border-border" id="contribute">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeInUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-3">
              Want to{" "}
              <span className="bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
                Contribute?
              </span>
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
                    className={`group h-full bg-surface/80 backdrop-blur-sm border ${
                      contribOpen === r.role ? c.border : "border-border"
                    } rounded-2xl p-7 flex flex-col transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5`}
                  >
                    <div
                      className={`shrink-0 w-14 h-14 rounded-2xl ${c.bg} ${c.text} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <r.icon className="h-7 w-7" />
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
                      className={`mt-5 w-full py-2.5 rounded-xl text-sm font-medium transition-all ring-1 ring-transparent hover:ring-primary/20 ${c.btnBg}`}
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
              className="max-w-lg mx-auto bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-6 sm:p-8"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-light text-text placeholder:text-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-light text-text placeholder:text-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-light text-text placeholder:text-text-dim text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                  />
                </div>

                <button
                  onClick={handleContribSubmit}
                  disabled={contribSending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-background text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ring-1 ring-primary/50"
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
      <section className="relative border-t border-border overflow-hidden" id="feedback">
        <div className="absolute inset-0 bg-surface/40 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeInUp}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-3">
              Feedback &{" "}
              <span className="bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
                Suggestions
              </span>
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
            className="max-w-xl mx-auto bg-surface/80 backdrop-blur-sm border border-border rounded-2xl p-6 sm:p-8"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-light text-text placeholder:text-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-light text-text placeholder:text-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
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
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                        fbCategory === c.value
                          ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                          : "bg-surface-light text-text-muted hover:text-text-secondary border border-border hover:border-primary/30"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-light text-text placeholder:text-text-dim text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                />
                <p className="text-xs text-text-dim mt-1 text-right">
                  {fbMessage.length} / 2000
                </p>
              </div>

              <button
                onClick={handleFeedbackSubmit}
                disabled={!fbMessage.trim() || fbSending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary-dark text-background text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ring-1 ring-primary/50"
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
      {/*  Final CTA                                                    */}
      {/* ============================================================ */}
      {!isLoggedIn && (
        <section className="relative border-t border-border overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[120px]" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text mb-4">
                Your Next Game Starts{" "}
                <span className="bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
                  Here
                </span>
              </h2>
              <p className="text-text-secondary max-w-lg mx-auto mb-8 text-lg">
                Thousands of gamers are already finding teammates, joining clans,
                and leveling up their profiles. Don&apos;t play alone.
              </p>
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary hover:bg-primary-dark text-background font-bold text-lg transition-all shadow-lg shadow-primary/25 ring-1 ring-primary/50 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
              >
                Sign Up Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/*  Footer                                                       */}
      {/* ============================================================ */}
      <footer className="border-t border-border bg-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16">
            {/* Column 1: Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link
                href="/"
                className="text-xl font-bold text-text hover:text-primary transition-colors"
              >
                gg<span className="text-primary">Lobby</span>
              </Link>
              <p className="mt-3 text-sm text-text-muted leading-relaxed">
                The gaming social platform where you find teammates, build your identity, and level up together.
              </p>
              {/* Social icons */}
              <div className="mt-5 flex items-center gap-3">
                <a
                  href="https://instagram.com/gglobby.gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/40 transition-all"
                  aria-label="Instagram"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href="https://x.com/gglobby_gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/40 transition-all"
                  aria-label="X / Twitter"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://discord.gg/gglobby"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/40 transition-all"
                  aria-label="Discord"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: Platform */}
            <div>
              <h4 className="text-sm font-semibold text-text mb-4">Platform</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Find Gamers", href: "/find-gamers" },
                  { label: "Blog", href: "/write" },
                  { label: "Clans", href: "/clans" },
                  { label: "Community", href: "/community" },
                  { label: "Premium", href: "/premium" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-text-muted hover:text-text transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Support */}
            <div>
              <h4 className="text-sm font-semibold text-text mb-4">Support</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Help Center", href: "/help" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Guidelines", href: "/guidelines" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-text-muted hover:text-text transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Company */}
            <div>
              <h4 className="text-sm font-semibold text-text mb-4">Company</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/updates"
                    className="text-sm text-text-muted hover:text-text transition-colors"
                  >
                    Updates
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("contribute")}
                    className="text-sm text-text-muted hover:text-text transition-colors"
                  >
                    Contribute
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("feedback")}
                    className="text-sm text-text-muted hover:text-text transition-colors"
                  >
                    Feedback
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-dim">
              &copy; {new Date().getFullYear()} ggLobby. All rights reserved.
            </p>
            <p className="text-xs text-text-dim">
              Built with passion for gamers worldwide.
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
          className="fixed bottom-20 right-6 z-40 p-3 rounded-full bg-surface/80 backdrop-blur-sm border border-border shadow-lg hover:border-primary/40 text-text-muted hover:text-primary transition-all ring-1 ring-transparent hover:ring-primary/20"
          aria-label="Back to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
