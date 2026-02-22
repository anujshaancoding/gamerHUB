"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  Settings,
  User,
  Trophy,
  Crown,
  Star,
  Users,
  Swords,
  Gift,
  MessageCircle,
  Radio,
  Megaphone,
  UserCheck,
  Shield,
  BookOpen,
} from "lucide-react";
import { Button, Avatar, Input, Badge } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications, useMarkAsRead, formatNotificationTime, type NotificationType } from "@/lib/hooks/useNotifications";
import { useUnreadMessageCount } from "@/lib/hooks/useMessages";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useSocialCounts } from "@/lib/hooks/useFriends";
import { PremiumBadge } from "@/components/premium";
import { Logo } from "@/components/layout/logo";
import { SearchDropdown } from "@/components/search";
import { cn } from "@/lib/utils";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "achievement_earned":
      return <Trophy className="h-4 w-4 text-warning" />;
    case "level_up":
      return <Star className="h-4 w-4 text-primary" />;
    case "friend_request":
      return <Users className="h-4 w-4 text-accent" />;
    case "clan_invite":
      return <Users className="h-4 w-4 text-success" />;
    case "match_reminder":
    case "tournament_start":
      return <Swords className="h-4 w-4 text-error" />;
    case "battle_pass_reward":
      return <Gift className="h-4 w-4 text-warning" />;
    case "direct_message":
    case "forum_reply":
      return <MessageCircle className="h-4 w-4 text-primary" />;
    case "stream_live":
      return <Radio className="h-4 w-4 text-error" />;
    case "system_announcement":
      return <Megaphone className="h-4 w-4 text-accent" />;
    default:
      return <Bell className="h-4 w-4 text-text-secondary" />;
  }
};

// Mobile menu navigation items - same as sidebar
const mobileNavItems = [
  { href: "/profile", label: "My Profile", icon: User, requiresAuth: true },
  { href: "/friends", label: "Friends", icon: UserCheck, requiresAuth: true, showBadge: true },
  { href: "/messages", label: "Messages", icon: MessageCircle, requiresAuth: true, showMessageBadge: true },
  { href: "/community", label: "Community", icon: Users, requiresAuth: false },
  { href: "/blog", label: "Blog", icon: BookOpen, isPremium: true, requiresAuth: true },
  { href: "/clans", label: "Clans", icon: Shield, requiresAuth: true },
  { href: "/find-gamers", label: "Discover Gamers", icon: Gamepad2, requiresAuth: true },
  { href: "/premium", label: "Premium", icon: Crown, isPremium: true, requiresAuth: true },
  { href: "/settings", label: "Settings", icon: Settings, requiresAuth: true },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { isPremium } = useSubscription();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Fetch notifications from backend (with error handling)
  const { data: notificationData, isLoading: notificationsLoading } = useNotifications({
    limit: 5,
  });

  const notifications = notificationData?.notifications || [];
  const unreadCount = notificationData?.unreadCount || 0;
  const unreadMessages = useUnreadMessageCount();
  const { counts } = useSocialCounts(user?.id);
  const markAsReadMutation = useMarkAsRead();

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearch(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearch(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="fixed top-0 left-[var(--app-inset)] right-[var(--app-inset)] xl:right-[calc(var(--app-inset)_+_18rem)] z-40 bg-surface/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - pinned left on all screen sizes */}
          <div className="flex-shrink-0">
            <Logo showText={true} size="md" className="hidden sm:flex" />
            <Logo showText={true} size="sm" className="sm:hidden" />
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden lg:block relative" ref={searchRef}>
              <form onSubmit={handleSearch}>
                <Input
                  placeholder="Search news and blogs"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length >= 3) setShowSearch(true);
                  }}
                  onFocus={() => {
                    setSearchFocused(true);
                    if (searchQuery.length >= 3) setShowSearch(true);
                  }}
                  onBlur={() => setSearchFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowSearch(false);
                  }}
                  leftIcon={<Search className="h-4 w-4" />}
                  rightIcon={
                    searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setShowSearch(false);
                        }}
                        className="hover:text-text transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : undefined
                  }
                  className={cn(
                    "transition-all duration-300 ease-in-out",
                    searchFocused ? "w-96" : "w-48"
                  )}
                />
              </form>
              <SearchDropdown
                query={searchQuery}
                isOpen={showSearch && searchQuery.length >= 3}
                onClose={() => setShowSearch(false)}
              />
            </div>

            {/* Show Login/Sign Up for guests, or Notifications/User Menu for logged in users */}
            {!user ? (
              /* Guest User - Show Login/Sign Up */
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">
                    Log In
                  </Link>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <Link href="/register">
                    Sign Up
                  </Link>
                </Button>
              </div>
            ) : (
              /* Logged In User - Show Notifications and User Menu */
              <>
                {/* Messages */}
                <Link href="/messages" className="relative">
                  <Button variant="ghost" size="icon" className="relative">
                    <MessageCircle className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 bg-error text-white text-xs rounded-full flex items-center justify-center">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => {
                      const isOpening = !showNotifications;
                      setShowNotifications(isOpening);
                      setShowUserMenu(false);

                      // Mark all unread notifications as read when opening the dropdown
                      if (isOpening && unreadCount > 0) {
                        const unreadIds = notifications
                          .filter(n => !n.is_read)
                          .map(n => n.id);
                        if (unreadIds.length > 0) {
                          markAsReadMutation.mutate(unreadIds);
                        }
                      }
                    }}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-background text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>

                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-auto mt-0 sm:mt-2 sm:w-80 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold text-text">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-xs text-text-muted">{unreadCount} unread</span>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="p-4 space-y-3">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex items-start gap-3 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-surface-light" />
                                <div className="flex-1">
                                  <div className="h-4 w-full bg-surface-light rounded mb-1" />
                                  <div className="h-3 w-16 bg-surface-light rounded" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-6 text-center">
                            <Bell className="h-8 w-8 text-text-muted mx-auto mb-2" />
                            <p className="text-sm text-text-muted">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((notification) => (
                            <Link
                              key={notification.id}
                              href={notification.action_url || "/notifications"}
                              onClick={() => setShowNotifications(false)}
                              className={cn(
                                "flex items-start gap-3 px-4 py-3 hover:bg-surface-light cursor-pointer transition-colors",
                                !notification.is_read && "bg-primary/5"
                              )}
                            >
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    "text-sm",
                                    notification.is_read
                                      ? "text-text-secondary"
                                      : "text-text"
                                  )}
                                >
                                  {notification.title}
                                </p>
                                {notification.body && (
                                  <p className="text-xs text-text-muted line-clamp-1">
                                    {notification.body}
                                  </p>
                                )}
                                <p className="text-xs text-text-muted mt-1">
                                  {formatNotificationTime(notification.created_at)}
                                </p>
                              </div>
                              {!notification.is_read && (
                                <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                              )}
                            </Link>
                          ))
                        )}
                      </div>
                      <div className="border-t border-border">
                        <Link
                          href="/notifications"
                          className="block px-4 py-3 text-center text-sm text-primary hover:bg-surface-light transition-colors"
                          onClick={() => setShowNotifications(false)}
                        >
                          See all notifications
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* User Menu - hidden on mobile since My Profile is in hamburger */}
                <div className="relative hidden sm:block" ref={userMenuRef}>
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-light transition-colors"
                  >
                    <Avatar
                      src={profile?.avatar_url}
                      alt={profile?.display_name || profile?.username || "User"}
                      size="sm"
                      status="online"
                      showStatus
                    />
                    <span className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-text">
                      {profile?.display_name || profile?.username}
                      {isPremium && <PremiumBadge size="sm" showLabel={false} animate={false} />}
                    </span>
                  </button>

                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg py-2"
                    >
                      {profile?.username && (
                        <Link
                          href={`/profile/${profile.username}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text hover:bg-surface-light"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="h-4 w-4" />
                          View Profile
                        </Link>
                      )}
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text hover:bg-surface-light"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <hr className="my-2 border-border" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-surface-light w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </div>
              </>
            )}

            {/* Mobile Menu Button - Show on small/medium screens, hide on large where sidebar is visible */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden bg-surface border-b border-border max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          <div className="px-4 py-3 space-y-2">
            <div className="relative mb-3">
              <form onSubmit={handleSearch}>
                <Input
                  placeholder="Search news and blogs"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length >= 3) setShowSearch(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.length >= 3) setShowSearch(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowSearch(false);
                  }}
                  leftIcon={<Search className="h-4 w-4" />}
                  rightIcon={
                    searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setShowSearch(false);
                        }}
                        className="hover:text-text transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : undefined
                  }
                />
              </form>
              <SearchDropdown
                query={searchQuery}
                isOpen={showSearch && searchQuery.length >= 3}
                onClose={() => {
                  setShowSearch(false);
                  setShowMobileMenu(false);
                }}
              />
            </div>
            {mobileNavItems.map((item) => {
              // Skip auth-required items for guests
              if (item.requiresAuth && !user) return null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    item.href === "/profile"
                      ? pathname.startsWith("/profile")
                        ? "bg-primary/10 text-primary"
                        : "text-text-secondary hover:text-text hover:bg-surface-light"
                      : pathname === item.href || pathname.startsWith(item.href + "/")
                        ? "bg-primary/10 text-primary"
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
              );
            })}

            {/* Legal Links */}
            <div className="pt-3 mt-2 border-t border-border flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-dim px-3">
              <Link href="/privacy" onClick={() => setShowMobileMenu(false)} className="hover:text-text-muted">Privacy</Link>
              <Link href="/terms" onClick={() => setShowMobileMenu(false)} className="hover:text-text-muted">Terms</Link>
              <Link href="/guidelines" onClick={() => setShowMobileMenu(false)} className="hover:text-text-muted">Guidelines</Link>
              <span className="basis-full text-text-dim/60 mt-1">&copy; {new Date().getFullYear()} ggLobby</span>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
