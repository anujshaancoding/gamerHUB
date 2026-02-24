"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/blog", label: "Blog Posts", icon: BookOpen },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/authors", label: "Blog Authors", icon: PenTool },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquarePlus },
];

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="fixed left-[var(--app-inset)] top-0 bottom-0 w-64 bg-[#0a0a12] border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Logo size="sm" showText={false} href={undefined} />
          <div>
            <h1 className="font-bold text-white text-sm">ggLobby</h1>
            <p className="text-[11px] text-white/40 font-medium">Admin Panel</p>
          </div>
        </div>
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
  );
}
