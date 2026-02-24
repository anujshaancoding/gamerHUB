"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  MessageCircle,
  Flag,
  Clock,
  AlertTriangle,
  Newspaper,
  RefreshCw,
  MessageSquarePlus,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  pendingPosts: number;
  pendingReports: number;
  totalMessages: number;
  pendingNews: number;
  publishedNews: number;
  totalFeedback: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
          {label}
        </span>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const formatCount = (n: number | undefined) => {
    if (n === undefined) return "—";
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Users"
          value={loading ? "..." : formatCount(stats?.totalUsers)}
          icon={Users}
          color="bg-blue-500/10 text-blue-400"
          href="/admin/users"
        />
        <StatCard
          label="Published Posts"
          value={loading ? "..." : formatCount(stats?.totalPosts)}
          icon={BookOpen}
          color="bg-green-500/10 text-green-400"
          href="/admin/blog"
        />
        <StatCard
          label="Published News"
          value={loading ? "..." : formatCount(stats?.publishedNews)}
          icon={Newspaper}
          color="bg-emerald-500/10 text-emerald-400"
          href="/admin/news"
        />
        <StatCard
          label="Messages"
          value={loading ? "..." : formatCount(stats?.totalMessages)}
          icon={MessageCircle}
          color="bg-violet-500/10 text-violet-400"
        />
        <StatCard
          label="Feedback"
          value={loading ? "..." : formatCount(stats?.totalFeedback)}
          icon={MessageSquarePlus}
          color="bg-purple-500/10 text-purple-400"
          href="/admin/feedback"
        />
      </div>

      {/* Attention-needed cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/blog?status=pending_review">
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.03] p-5 hover:bg-yellow-500/[0.06] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-yellow-400/60 uppercase tracking-wider">
                Pending Review
              </span>
              <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-yellow-500/10">
                <Clock className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-yellow-400">
              {loading ? "..." : formatCount(stats?.pendingPosts)}
            </p>
            <p className="text-xs text-white/30 mt-1">Blog posts awaiting approval</p>
          </div>
        </Link>
        <Link href="/admin/news?status=pending">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 hover:bg-emerald-500/[0.06] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-emerald-400/60 uppercase tracking-wider">
                Pending News
              </span>
              <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-emerald-500/10">
                <Newspaper className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {loading ? "..." : formatCount(stats?.pendingNews)}
            </p>
            <p className="text-xs text-white/30 mt-1">News articles needing review</p>
          </div>
        </Link>
        <Link href="/admin/reports?status=pending">
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-5 hover:bg-red-500/[0.06] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-red-400/60 uppercase tracking-wider">
                Pending Reports
              </span>
              <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-400">
              {loading ? "..." : formatCount(stats?.pendingReports)}
            </p>
            <p className="text-xs text-white/30 mt-1">User reports needing attention</p>
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
        <h2 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/blog/new"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
          >
            <BookOpen className="h-5 w-5 text-green-400" />
            <span className="text-xs font-medium text-white/50">New Post</span>
          </Link>
          <Link
            href="/admin/blog?status=pending_review"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
          >
            <Clock className="h-5 w-5 text-yellow-400" />
            <span className="text-xs font-medium text-white/50">Review Posts</span>
          </Link>
          <Link
            href="/admin/reports"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
          >
            <Flag className="h-5 w-5 text-red-400" />
            <span className="text-xs font-medium text-white/50">View Reports</span>
          </Link>
          <Link
            href="/admin/users"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
          >
            <Users className="h-5 w-5 text-blue-400" />
            <span className="text-xs font-medium text-white/50">Manage Users</span>
          </Link>
          <Link
            href="/admin/news"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
          >
            <RefreshCw className="h-5 w-5 text-emerald-400" />
            <span className="text-xs font-medium text-white/50">Fetch News</span>
          </Link>
          <Link
            href="/admin/news/post"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
          >
            <Newspaper className="h-5 w-5 text-emerald-400" />
            <span className="text-xs font-medium text-white/50">Post News</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
