"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell } from "lucide-react";
import { NotificationPreferences } from "@/components/system/notifications";

export default function NotificationSettingsPage() {
  return (
    <div className="container max-w-3xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Bell className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-zinc-400">
              Manage how you receive notifications
            </p>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </h2>
        <NotificationPreferences />
      </section>
    </div>
  );
}
