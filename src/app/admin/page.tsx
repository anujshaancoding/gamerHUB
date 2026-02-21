"use client";

import {
  Users,
  BookOpen,
  MessageCircle,
  Shield,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
          {label}
        </span>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-lg font-bold text-white/60">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Users"
          value="—"
          icon={Users}
          color="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          label="Blog Posts"
          value="—"
          icon={BookOpen}
          color="bg-green-500/10 text-green-400"
        />
        <StatCard
          label="Messages"
          value="—"
          icon={MessageCircle}
          color="bg-violet-500/10 text-violet-400"
        />
        <StatCard
          label="Reports"
          value="—"
          icon={Shield}
          color="bg-yellow-500/10 text-yellow-400"
        />
      </div>

      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
        <Shield className="h-10 w-10 text-white/20 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-white/60 mb-2">Admin Dashboard</h2>
        <p className="text-sm text-white/30 max-w-md mx-auto">
          Platform management tools will be expanded here as the platform grows.
        </p>
      </div>
    </div>
  );
}
