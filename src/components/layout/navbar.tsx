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
} from "lucide-react";
import { Button, Avatar, Input } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications, formatNotificationTime, type NotificationType } from "@/lib/hooks/useNotifications";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { PremiumBadge } from "@/components/premium";
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

const navItems = [
  { href: "/profile", label: "My Profile" },
  { href: "/community", label: "Community" },
  { href: "/find-gamers", label: "Discover" },
  { href: "/premium", label: "Premium", isPremium: true },
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

  // Fetch notifications from backend (with error handling)
  const { data: notificationData, isLoading: notificationsLoading } = useNotifications({
    limit: 5,
  });

  const notifications = notificationData?.notifications || [];
  const unreadCount = notificationData?.unreadCount || 0;

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/find-gamers?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 xl:right-72 z-40 bg-surface/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/community" className="flex items-center gap-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-glow-primary hidden sm:block">
              GamerHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
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
                {item.isPremium && <Crown className="h-4 w-4" />}
                {item.label}
              </Link>
            ))}
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden lg:block">
              <Input
                placeholder="Search gamers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="w-48"
              />
            </form>

            {/* Show Login/Sign Up for guests, or Notifications/User Menu for logged in users */}
            {!user ? (
              /* Guest User - Show Login/Sign Up */
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            ) : (
              /* Logged In User - Show Notifications and User Menu */
              <>
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowUserMenu(false);
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

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
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

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
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
          className="md:hidden bg-surface border-b border-border"
        >
          <div className="px-4 py-3 space-y-2">
            <form onSubmit={handleSearch} className="mb-3">
              <Input
                placeholder="Search gamers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </form>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMobileMenu(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  item.href === "/profile"
                    ? pathname.startsWith("/profile")
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:text-text hover:bg-surface-light"
                    : pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:text-text hover:bg-surface-light",
                  item.isPremium && "text-warning"
                )}
              >
                {item.isPremium && <Crown className="h-4 w-4" />}
                {item.label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
