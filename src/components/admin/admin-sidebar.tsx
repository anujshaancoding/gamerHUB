"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChevronLeft,
  BookOpen,
  Flag,
  Users,
  PenTool,
  Newspaper,
  MessageSquarePlus,
  BarChart3,
  Bot,
  Trophy,
  Mail,
  Crosshair,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";

const allNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/blog", label: "Blog Posts", icon: BookOpen },
  { href: "/admin/news", label: "News", icon: Newspaper, newsOnly: true },
  { href: "/admin/pro", label: "Pro Hub", icon: Trophy },
  { href: "/admin/lineups", label: "Lineups", icon: Crosshair },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/authors", label: "Blog Authors", icon: PenTool },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquarePlus },
  { href: "/admin/automation", label: "Automation", icon: Bot },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [hideNews, setHideNews] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.settings) setHideNews(data.settings.hide_news);
      })
      .catch(() => {});
  }, []);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const navItems = hideNews
    ? allNavItems.filter((item) => !item.newsOnly)
    : allNavItems;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Mobile hamburger — visible only below lg */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open admin menu"
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-[#0a0a12] border border-white/10 text-white/70"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-[var(--app-inset)] top-0 bottom-0 w-64 bg-[#0a0a12] border-r border-white/5 flex flex-col z-40 transition-transform duration-200",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
      {/* Logo */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" showText={false} href={undefined} />
          <div>
            <h1 className="font-bold text-white text-sm">ggLobby</h1>
            <p className="text-[11px] text-white/40 font-medium">Admin Panel</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close admin menu"
          className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
          Management
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-violet-500/15 text-violet-400 shadow-sm shadow-violet-500/5"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px]", active && "text-violet-400")} />
              <span>{item.label}</span>
              {active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Back to App */}
      <div className="p-3 border-t border-white/5">
        <Link
          href="/community"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          <ChevronLeft className="h-[18px] w-[18px]" />
          Back to ggLobby
        </Link>
      </div>
      </aside>
    </>
  );
}
