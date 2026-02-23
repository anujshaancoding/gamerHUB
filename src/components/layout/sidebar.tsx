"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Users,
  Settings,
  Gamepad2,
  Crown,
  Eye,
  LogIn,
  UserPlus,
  Shield,
  UserCheck,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSocialCounts } from "@/lib/hooks/useFriends";
import { useUnreadMessageCount } from "@/lib/hooks/useMessages";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { Avatar, Button, Badge } from "@/components/ui";
import { PremiumBadge } from "@/components/premium";
import { Logo } from "@/components/layout/logo";
import { StatusSelector } from "@/components/presence/StatusSelector";
import { usePresence } from "@/lib/presence/PresenceProvider";

const navItems = [
  { href: "/profile", label: "My Profile", icon: User, requiresAuth: true },
  { href: "/friends", label: "Friends", icon: UserCheck, requiresAuth: true, showBadge: true },
  { href: "/messages", label: "Messages", icon: MessageCircle, requiresAuth: true, showMessageBadge: true },
  { href: "/community", label: "Community", icon: Users, requiresAuth: false },
  { href: "/clans", label: "Clans", icon: Shield, requiresAuth: true },
  { href: "/find-gamers", label: "Discover Gamers", icon: Gamepad2, requiresAuth: true },
  { href: "/premium", label: "Premium", icon: Crown, isPremium: true, requiresAuth: true },
];

const bottomItems = [{ href: "/settings", label: "Settings", icon: Settings }];

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile, loading: authLoading } = useAuth();
  const isGuest = !user;
  const isAuthenticated = !!user;
  const { counts } = useSocialCounts(user?.id);
  const unreadMessages = useUnreadMessageCount(isAuthenticated);
  const { isPremium } = useSubscription({ enabled: isAuthenticated });
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
                    <span className="font-semibold text-text truncate flex items-center gap-1.5">
                      {profile.display_name || profile.username}
                      {isPremium && <PremiumBadge size="sm" showLabel={false} animate={false} />}
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

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Link href="/friends" className="text-center p-2 rounded-lg bg-surface-light group hover:bg-primary/10 transition-colors cursor-pointer">
                <p className="text-lg font-bold text-primary group-hover:scale-110 transition-transform">{counts.friends}</p>
                <span className="text-xs text-text-muted">Friends</span>
              </Link>
              <Link href="/friends?tab=following" className="text-center p-2 rounded-lg bg-surface-light group hover:bg-warning/10 transition-colors cursor-pointer">
                <p className="text-lg font-bold text-warning group-hover:scale-110 transition-transform">{counts.following}</p>
                <span className="text-xs text-text-muted">Following</span>
              </Link>
              <Link href="/friends?tab=followers" className="text-center p-2 rounded-lg bg-surface-light group hover:bg-accent/10 transition-colors cursor-pointer">
                <p className="text-lg font-bold text-accent group-hover:scale-110 transition-transform">{counts.followers}</p>
                <span className="text-xs text-text-muted">Followers</span>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              item.href === "/profile"
                ? pathname.startsWith("/profile")
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-text-secondary hover:text-text hover:bg-surface-light"
                : pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-text-secondary hover:text-text hover:bg-surface-light",
              item.isPremium && "text-warning hover:text-warning"
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
          </Link>
        ))}
      </nav>

      {/* Profile Views - Only show for logged in users */}
      {!isGuest && (
        <div className="p-4 border-t border-border">
          <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-warning/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-text">Profile Views</span>
            </div>
            {isPremium ? (
              <>
                <p className="text-2xl font-bold text-primary">
                  {(profile as Record<string, unknown>)?.profile_views as number ?? 0}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Total views on your profile
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-primary">--</p>
                <p className="text-xs text-text-muted mt-1">
                  <Link href="/premium" className="text-warning hover:underline">
                    Upgrade to Premium
                  </Link>{" "}
                  to see who viewed your profile
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Items - Only show for logged in users */}
      {!isGuest && (
        <div className="p-4 border-t border-border space-y-1">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
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
          <Link href="/guidelines" className="hover:text-text-muted transition-colors">Guidelines</Link>
        </div>
        <p className="text-xs text-text-dim/60 mt-1.5">&copy; {new Date().getFullYear()} ggLobby</p>
      </div>
    </aside>
  );
}
