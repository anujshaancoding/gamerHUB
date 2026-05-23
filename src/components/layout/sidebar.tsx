"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Users,
  Settings,
  Gamepad2,
  LogIn,
  UserPlus,
  Shield,
  UserCheck,
  MessageCircle,
  HelpCircle,
  Trophy,
  Wrench,
  MessagesSquare,
  Swords,
  Map,
  Gift,
  FileText,
  ListOrdered,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSocialCounts } from "@/lib/hooks/useFriends";
import { useUnreadMessageCount } from "@/lib/hooks/useMessages";
import { Avatar, Button, Badge } from "@/components/ui";
import { Logo } from "@/components/layout/logo";
import { StatusSelector } from "@/components/presence/StatusSelector";
import { usePresence } from "@/lib/presence/PresenceProvider";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  requiresAuth: boolean;
  showBadge?: boolean;
  showMessageBadge?: boolean;
  isBeta?: boolean;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  // NOTE: The /community page is surfaced under "You" — it carries Valorant
  // blogs, tournaments/giveaways, and the friend feed. /find-gamers is also
  // surfaced here (Find Friends + LFG). Other Phase-3 social features
  // (standalone friends/messages pages, clans) remain frozen per V2-PLAN.md —
  // routes exist but are not surfaced yet.
  {
    label: "You",
    items: [
      { href: "/profile", label: "My Profile", icon: User, requiresAuth: true },
      { href: "/community", label: "Community", icon: Users, requiresAuth: false },
      { href: "/find-gamers", label: "Find Gamers", icon: Gamepad2, requiresAuth: false },
    ],
  },
  {
    label: "Game Hub",
    items: [
      { href: "/agents", label: "Agents", icon: Swords, requiresAuth: false },
      { href: "/maps", label: "Maps & Lineups", icon: Map, requiresAuth: false },
      { href: "/patch", label: "Patch & Meta", icon: FileText, requiresAuth: false },
      { href: "/tier-list", label: "Tier List", icon: ListOrdered, requiresAuth: false },
      { href: "/tools", label: "Gamer Tools", icon: Wrench, requiresAuth: false, isBeta: true },
      { href: "/forum", label: "Forum", icon: MessagesSquare, requiresAuth: false, isBeta: true },
    ],
  },
  {
    label: "Esports",
    items: [
      { href: "/pro", label: "Pro Scene", icon: Trophy, requiresAuth: false, isBeta: true },
      { href: "/giveaway", label: "Giveaway", icon: Gift, requiresAuth: false },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy, requiresAuth: false },
    ],
  },
];

const bottomItems = [
  { href: "/help", label: "Help Center", icon: HelpCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile, loading: authLoading } = useAuth();
  const isGuest = !user;
  const isAuthenticated = !!user;
  const { counts } = useSocialCounts(user?.id);
  const unreadMessages = useUnreadMessageCount(isAuthenticated);
  const { myStatus } = usePresence();

  return (
    <aside className="hidden lg:flex fixed left-[var(--app-inset)] top-16 bottom-0 w-64 bg-surface border-r border-border flex-col">
      {/* Profile Summary for logged in users, Join CTA for guests */}
      <div className="p-4 border-b border-border">
        {authLoading ? (
          /* Loading skeleton while auth initializes */
          <div className="animate-pulse space-y-3">
            <div className="flex items-center gap-3 p-3">
              <div className="w-12 h-12 rounded-full bg-surface-light flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-light rounded w-24" />
                <div className="h-3 bg-surface-light rounded w-16" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-14 bg-surface-light rounded-lg" />
              <div className="h-14 bg-surface-light rounded-lg" />
              <div className="h-14 bg-surface-light rounded-lg" />
            </div>
          </div>
        ) : isGuest ? (
          /* Guest User - Show Join CTA */
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
            <div className="text-center mb-4">
              <Logo showText={false} size="lg" href={undefined} className="justify-center mb-2" />
              <h3 className="font-semibold text-text">Join ggLobby</h3>
              <p className="text-xs text-text-muted mt-1">
                Connect with gamers and showcase your skills
              </p>
            </div>
            <div className="space-y-2">
              <Link href="/register" className="block">
                <Button variant="primary" className="w-full" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </Button>
              </Link>
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full" size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Logged In User - Show Profile Summary */
          <>
            <Link
              href="/profile"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light transition-colors"
            >
              <div className="relative">
                <Avatar
                  src={profile?.avatar_url}
                  alt={profile?.display_name || profile?.username || "User"}
                  size="lg"
                  status={myStatus}
                  showStatus={false}
                />
                <StatusSelector />
              </div>
              <div className="flex-1 min-w-0">
                {profile ? (
                  <>
                    <span className="font-semibold text-text truncate">
                      {profile.display_name || profile.username}
                    </span>
                    <p className="text-sm text-text-muted truncate">
                      @{profile.username}
                    </p>
                  </>
                ) : (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-surface-light rounded w-24" />
                    <div className="h-3 bg-surface-light rounded w-16" />
                  </div>
                )}
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-dim">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive = item.href === "/profile"
                ? pathname.startsWith("/profile")
                : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-text-secondary hover:text-text hover:bg-surface-light"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {item.showBadge && counts.pending_requests > 0 && (
                  <Badge variant="primary" size="sm">
                    {counts.pending_requests}
                  </Badge>
                )}
                {item.showMessageBadge && unreadMessages > 0 && (
                  <Badge variant="error" size="sm">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </Badge>
                )}
                {item.isBeta && (
                  <Badge variant="primary" size="sm">Beta</Badge>
                )}
              </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Items - Only show for logged in users */}
      {!isGuest && (
        <div className="p-4 border-t border-border space-y-1">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-text hover:bg-surface-light"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
      {/* Legal Links */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-dim">
          <Link href="/overview" className="hover:text-text-muted transition-colors">Overview</Link>
          <Link href="/privacy" className="hover:text-text-muted transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-text-muted transition-colors">Terms</Link>
          <Link href="/disclaimer" className="hover:text-text-muted transition-colors">Disclaimer</Link>
          <Link href="/guidelines" className="hover:text-text-muted transition-colors">Guidelines</Link>
          <Link href="/updates" className="hover:text-text-muted transition-colors">Updates</Link>
        </div>
        <p className="text-xs text-text-dim/60 mt-1.5">&copy; {new Date().getFullYear()} ggLobby</p>
      </div>
    </aside>
  );
}
