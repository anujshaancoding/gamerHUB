"use client";

import { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Bell,
  Loader2,
  Check,
  Trash2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { NotificationItem } from "@/components/notifications";
import {
  useMarkAsRead,
  useArchiveNotification,
  Notification,
} from "@/lib/hooks/useNotifications";
import { cn } from "@/lib/utils";

async function fetchNotifications({
  pageParam = 0,
  unreadOnly = false,
}: {
  pageParam?: number;
  unreadOnly?: boolean;
}) {
  const params = new URLSearchParams({
    limit: "20",
    offset: pageParam.toString(),
    unread_only: unreadOnly.toString(),
  });

  const response = await fetch(`/api/notifications?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return response.json();
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["notifications-page", filter],
    queryFn: ({ pageParam }) =>
      fetchNotifications({
        pageParam,
        unreadOnly: filter === "unread",
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.reduce(
        (sum, page) => sum + (page.notifications?.length || 0),
        0
      );
    },
    initialPageParam: 0,
  });

  const markAsReadMutation = useMarkAsRead();
  const archiveMutation = useArchiveNotification();

  const notifications =
    data?.pages.flatMap((page) => page.notifications) || [];
  const unreadCount = data?.pages[0]?.unreadCount || 0;

  const handleMarkAllRead = () => {
    markAsReadMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("All notifications marked as read");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const handleClearRead = () => {
    archiveMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Read notifications cleared");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
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
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
          </div>
        </div>

        <Link href="/settings/notifications">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
          <TabsList className="bg-zinc-900/50 border border-zinc-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-600 rounded text-xs">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAsReadMutation.isPending}
            >
              {markAsReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Mark all read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearRead}
            disabled={archiveMutation.isPending}
          >
            {archiveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clear read
          </Button>
        </div>
      </div>

      {/* Notifications list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {filter === "unread" ? "No Unread Notifications" : "No Notifications"}
            </h3>
            <p className="text-zinc-400">
              {filter === "unread"
                ? "You're all caught up!"
                : "When you receive notifications, they'll appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: Notification, index: number) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <NotificationItem
                notification={notification}
                onMarkRead={() =>
                  markAsReadMutation.mutate([notification.id])
                }
                onArchive={() => archiveMutation.mutate(notification.id)}
              />
            </motion.div>
          ))}

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
