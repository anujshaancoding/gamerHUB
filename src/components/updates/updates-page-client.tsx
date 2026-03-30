"use client";

import {
  Sparkles,
  Bug,
  Wrench,
  Rocket,
  Zap,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";

type UpdateType = "feature" | "improvement" | "fix" | "security" | "launch" | "performance";

interface UpdateEntry {
  date: string;
  version?: string;
  type: UpdateType;
  title: string;
  description: string;
  highlights?: string[];
}

const typeConfig: Record<UpdateType, { icon: LucideIcon; color: string; label: string; bg: string }> = {
  feature: { icon: Sparkles, color: "text-purple-400", label: "New Feature", bg: "bg-purple-500/10 border-purple-500/20" },
  improvement: { icon: Wrench, color: "text-blue-400", label: "Improvement", bg: "bg-blue-500/10 border-blue-500/20" },
  fix: { icon: Bug, color: "text-orange-400", label: "Bug Fix", bg: "bg-orange-500/10 border-orange-500/20" },
  security: { icon: Shield, color: "text-green-400", label: "Security", bg: "bg-green-500/10 border-green-500/20" },
  launch: { icon: Rocket, color: "text-primary", label: "Launch", bg: "bg-primary/10 border-primary/20" },
  performance: { icon: Zap, color: "text-yellow-400", label: "Performance", bg: "bg-yellow-500/10 border-yellow-500/20" },
};

// All website updates in reverse chronological order
const updates: UpdateEntry[] = [
  {
    date: "2026-03-30T18:00:00",
    version: "1.18.0",
    type: "feature",
    title: "Conversion Improvements & Platform Enhancements",
    description: "Multiple improvements to increase visitor-to-user conversion and enhance the overall user experience.",
    highlights: [
      "Guest visitors now see up to 15 community posts (up from 4) for a better first impression",
      "Improved blog post signup CTA: engaging call-to-action replaces minimal sign-in link",
      "Onboarding steps 2 & 3 are now skippable — users can jump straight to the community",
    ],
  },
  {
    date: "2026-03-22T22:00:00",
    version: "1.17.1",
    type: "security",
    title: "Full-Stack Security Audit, SEO Fixes & Performance Hardening",
    description: "Comprehensive security and SEO audit across the entire platform. Fixed critical homepage SEO issue, hardened API endpoints, added rate limiting to public routes, and opened public pages to guest visitors.",
    highlights: [
      "Fixed critical SEO issue: homepage now serves real landing page content to search engines instead of a loading spinner",
      "Added rate limiting to newsletter subscribe and username check endpoints to prevent abuse",
      "Created pagination bounds utility — API routes now cap limit/offset to prevent DoS via unbounded queries",
      "Blog, Updates, Help, Privacy, Terms, and Guidelines pages now accessible to guest visitors without auth gate",
      "Sitemap cleaned up: removed auth pages, added /updates page",
      "URL validation added to feedback API to prevent stored XSS via malicious URLs",
      "Homepage converted from client-side redirect to server-side for crawler compatibility",
      "Added skeleton loading screens for Community, Profile, Messages, Blog, Clans, and Find Gamers pages",
      "Added preconnect/dns-prefetch hints for Google Fonts, Google Tag Manager, DiceBear, and Discord CDN",
    ],
  },
  {
    date: "2026-03-22T18:00:00",
    version: "1.17.0",
    type: "improvement",
    title: "New Landing Page, SEO Overhaul & Blog Revamp",
    description: "Rebuilt the landing page with a premium design to convert visitors into users. Created a dedicated SEO-friendly blog page, improved navigation for guests, added newsletter signup, and fixed sitemap/robots.txt for better search engine visibility.",
    highlights: [
      "New premium landing page with animated hero, social proof, game badges, and newsletter signup",
      "Dedicated /blog page with category filters, search, and responsive card grid — no more redirect",
      "Navbar now shows Blog, Find Gamers, and Community links to guest visitors",
      "Sitemap now includes /overview, /blog, and all blog post slug URLs for SEO",
      "Added /lfg redirect to /find-gamers for common URL pattern",
      "Newsletter email capture on both landing page and blog page",
      "Logged-out users now land on the feature-rich overview page instead of an empty dashboard",
    ],
  },
  {
    date: "2026-03-20T18:00:00",
    version: "1.16.1",
    type: "fix",
    title: "Profile Page Crash Fix & Monochrome Theme Contrast",
    description: "Fixed a critical bug that prevented profile pages from loading, and resolved text visibility issues on the Monochrome theme across multiple components.",
    highlights: [
      "Fixed profile page crash caused by a variable initialization error",
      "Fixed invisible button/text on Monochrome theme across PWA install prompt, feedback widget, chat, medals, and more",
      "Hardened the online gamers API to prevent crashes from unexpected responses",
    ],
  },
  {
    date: "2026-03-16T18:00:00",
    version: "1.16.0",
    type: "feature",
    title: "Looking For Group (LFG) & Infrastructure Cleanup",
    description: "Find teammates faster with the new LFG system integrated into the Find Gamers page. Create posts specifying your game, region, and play style to find the right squad. Also migrated all legacy image URLs to our self-hosted infrastructure for better reliability.",
    highlights: [
      "New 'Looking For Group' tab on the Find Gamers page — create and browse LFG posts",
      "Filter LFG posts by game, region, and play style",
      "Apply to join other players' LFG posts",
      "Migrated all avatar and banner images to self-hosted storage for faster loading",
    ],
  },
  {
    date: "2026-03-11T18:00:00",
    version: "1.15.0",
    type: "feature",
    title: "Real-Time Post Interactions & Notifications",
    description: "Like and comment counts on friend posts now update instantly without needing to refresh the page. You'll also receive in-app notifications when someone likes or comments on your posts.",
    highlights: [
      "Instant like and comment count updates with optimistic UI",
      "New in-app notifications for post likes and comments",
      "Delete button on posts now correctly shows only for your own posts",
    ],
  },
  {
    date: "2026-03-09T18:00:00",
    version: "1.14.1",
    type: "improvement",
    title: "Blog Game Filter Updated",
    description: "The game filter in the blog section now only shows the three supported games: Valorant, BGMI, and Free Fire Max.",
  },
  {
    date: "2026-03-07T22:00:00",
    version: "1.14.0",
    type: "feature",
    title: "Advanced Search & Filters for Community",
    description: "All community sections now have powerful search and filter capabilities to help you find exactly what you're looking for.",
    highlights: [
      "News tab: Search by title, filter by game, category, region, and featured status, plus sort by newest or most viewed",
      "Blog tab: Search posts, filter by game, category, and featured status",
      "Tournaments & Giveaways tab: Search listings, filter by game and status (active/completed/cancelled)",
      "Friends tab: Search posts by content or username with real-time filtering",
      "Reusable filter bar with expandable panel, active filter chips, and clear-all functionality",
      "Fully responsive design — filters work beautifully on mobile, tablet, and desktop",
    ],
  },
  {
    date: "2026-03-07T20:00:00",
    version: "1.13.0",
    type: "improvement",
    title: "Blog & Community Consolidation",
    description: "Blog posts now live entirely within the Community section with full SEO support, improved editing flow, and better author controls.",
    highlights: [
      "Blog posts are now fully integrated into the Community section — no more separate /blog page",
      "Full SEO metadata and JSON-LD structured data on every community blog post for better Google indexing",
      "Edit and delete your own posts directly from the community post page via the action bar",
      "Featured image upload added to the blog editor — upload images directly instead of only pasting URLs",
      "Old /blog links automatically redirect to the correct community post page",
    ],
  },
  {
    date: "2026-03-06T20:00:00",
    version: "1.11.1",
    type: "fix",
    title: "Feedback Widget Fix",
    description: "Fixed an issue where feedback submitted via the widget was not appearing in the system. Feedback now saves and displays correctly.",
  },
  {
    date: "2026-03-06T18:00:00",
    version: "1.11.0",
    type: "feature",
    title: "Online Gamers Discovery, Username Changes & Responsive Improvements",
    description: "New online gamers discovery, username change support on profile edit, and responsive layout improvements across multiple pages.",
    highlights: [
      "New 'Online Gamers' section at the top of Find Gamers page",
      "Shows 3 online gamers initially with a 'Load More' option",
      "Excludes friends and private profiles, refreshes every 30 seconds",
      "Username can now be changed on profile edit page with availability check and 14-day cooldown",
      "Improved responsive layouts on dashboard, blog, friends, news, premium, and write pages",
    ],
  },
  {
    date: "2026-03-05T12:00:00",
    version: "1.9.0",
    type: "feature",
    title: "Developer Documentation & Project Setup",
    description: "Comprehensive developer documentation added for onboarding and AI-assisted development.",
    highlights: [
      "DEVELOPER.md knowledge-transfer document for new contributors",
      "CLAUDE.md project instructions for AI-assisted development",
    ],
  },
  {
    date: "2026-03-04T18:00:00",
    version: "1.8.0",
    type: "feature",
    title: "Website Updates Page & URL-Synced Community Tabs",
    description: "Added a dedicated updates page to track all platform changes. Community tabs now update the URL so you can share and bookmark specific tabs. Activity feed items now link directly to the relevant content.",
    highlights: [
      "New Updates page to track platform changelog",
      "Community tab selection syncs with URL (?tab=blog, ?tab=tournaments, etc.)",
      "Activity feed items link directly to blog posts, news articles, and friend posts",
    ],
  },
  {
    date: "2026-03-01T14:00:00",
    version: "1.7.0",
    type: "feature",
    title: "Dynamic OG Card Images for Shared Posts",
    description: "When sharing community posts on social media, a beautiful preview card with the post content and author info is now auto-generated.",
    highlights: [
      "Auto-generated OG images for shared friend posts",
      "Author info and post content displayed on social media previews",
    ],
  },
  {
    date: "2026-02-28T12:00:00",
    version: "1.6.0",
    type: "improvement",
    title: "Confirm Delete Dialogs & Community Enhancements",
    description: "Added confirmation dialogs before deleting posts and various improvements across the community section.",
    highlights: [
      "Confirm dialog before deleting friend posts and blog posts",
      "Shared post OG metadata improvements",
      "Community UI polish and fixes",
    ],
  },
  {
    date: "2026-02-25T10:00:00",
    version: "1.5.0",
    type: "feature",
    title: "E2E Test Suite & API Documentation",
    description: "Added comprehensive end-to-end testing and Postman API collection for developers.",
    highlights: [
      "Full E2E test suite for critical user flows",
      "Postman collection with all API endpoints documented",
      "Codebase cleanup and optimization",
    ],
  },
  {
    date: "2026-02-22T09:00:00",
    version: "1.4.1",
    type: "fix",
    title: "Mini-Chat Popup Reload Fix",
    description: "Fixed an issue where the mini-chat popup would unnecessarily reload when switching browser tabs or windows.",
  },
  {
    date: "2026-02-20T16:00:00",
    version: "1.4.0",
    type: "feature",
    title: "Instant Message Notifications via Socket.io",
    description: "Real-time message notifications are now delivered instantly using Socket.io, so you never miss a message from friends.",
    highlights: [
      "Instant push notifications for new messages",
      "Real-time delivery via WebSocket connection",
      "Notification badge updates in real-time",
    ],
  },
  {
    date: "2026-02-15T11:00:00",
    version: "1.3.0",
    type: "feature",
    title: "Tournaments & Giveaways System",
    description: "Create and participate in gaming tournaments and giveaways directly on the platform.",
    highlights: [
      "Create tournaments with entry fees and prize pools",
      "Host giveaways for the community",
      "Game-specific filtering for tournaments",
    ],
  },
  {
    date: "2026-02-10T14:00:00",
    version: "1.2.0",
    type: "feature",
    title: "Blog & News Section",
    description: "Share gaming guides, tips, and stories with the community through the new blog system. Stay updated with curated gaming news.",
    highlights: [
      "Rich text blog editor with image uploads",
      "Game-specific blog categories",
      "Curated gaming news from trusted sources",
    ],
  },
  {
    date: "2026-02-05T10:00:00",
    version: "1.1.0",
    type: "feature",
    title: "Friends & Social Features",
    description: "Follow gamers, send friend requests, and interact with community posts.",
    highlights: [
      "Friend requests and follow system",
      "Community friend posts with likes and comments",
      "Online presence indicators",
    ],
  },
  {
    date: "2026-02-01T09:00:00",
    version: "1.0.0",
    type: "launch",
    title: "ggLobby Beta Launch",
    description: "The initial beta release of ggLobby - India's gaming social platform. Create your profile, discover gamers, and join the community.",
    highlights: [
      "User profiles with gaming stats",
      "Discover gamers by game preferences",
      "Real-time messaging system",
      "Clan creation and management",
      "Premium subscription with exclusive features",
    ],
  },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function UpdatesPageClient() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">What&apos;s New</h1>
        <p className="text-text-muted mt-1">
          All the latest updates, features, and improvements to ggLobby
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border" />

        <div className="space-y-6">
          {updates.map((update, index) => {
            const config = typeConfig[update.type];
            const Icon = config.icon;

            return (
              <div key={index} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0",
                  config.bg
                )}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>

                {/* Content */}
                <Card className="flex-1">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium border",
                        config.bg, config.color
                      )}>
                        {config.label}
                      </span>
                      {update.version && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-surface-light text-text-muted border border-border">
                          v{update.version}
                        </span>
                      )}
                      <span className="text-xs text-text-dim ml-auto">
                        {formatDate(update.date)} at {formatTime(update.date)}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-text mb-1">
                      {update.title}
                    </h3>
                    <p className="text-sm text-text-muted mb-2">
                      {update.description}
                    </p>
                    {update.highlights && update.highlights.length > 0 && (
                      <ul className="space-y-1 mt-2">
                        {update.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                            <span className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", config.color.replace("text-", "bg-"))} />
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
