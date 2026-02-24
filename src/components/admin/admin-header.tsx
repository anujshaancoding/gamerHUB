"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Avatar } from "@/components/ui";

const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/analytics": "Analytics",
  "/admin/blog": "Blog Posts",
  "/admin/blog/new": "New Blog Post",
  "/admin/reports": "Reports",
  "/admin/users": "Users",
  "/admin/authors": "Blog Authors",
};

function getTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/admin/blog/edit/")) return "Edit Blog Post";
  return "Admin";
}

export function AdminHeader() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const title = getTitle(pathname);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0a0a12]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        <p className="text-xs text-white/30">
          Manage your gaming platform
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right mr-2">
          <p className="text-sm font-medium text-white/80">
            {profile?.display_name || profile?.username}
          </p>
          <p className="text-[11px] text-violet-400 font-medium">Admin</p>
        </div>
        <Avatar
          src={profile?.avatar_url}
          alt={profile?.display_name || profile?.username || "Admin"}
          size="sm"
        />
      </div>
    </header>
  );
}
