"use client";

import { useAdmin } from "@/lib/hooks/useAdmin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { ShieldX } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06060e] flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 mx-auto mb-4 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 animate-pulse" />
          <p className="text-white/40 text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#06060e] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/40 mb-6">
            You don&apos;t have permission to access the admin panel. Contact a
            super admin if you believe this is an error.
          </p>
          <Link
            href="/community"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-500/10 text-violet-400 text-sm font-medium hover:bg-violet-500/20 transition-colors"
          >
            Back to ggLobby
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060e]">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
