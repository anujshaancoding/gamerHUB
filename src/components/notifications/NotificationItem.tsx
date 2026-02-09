"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Notification,
  getNotificationIcon,
  formatNotificationTime,
} from "@/lib/hooks/useNotifications";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: () => void;
  onArchive?: () => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onArchive,
  compact = false,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.is_read && onMarkRead) {
      onMarkRead();
    }
  };

  const content = (
    <Card
      className={cn(
        "p-4 transition-colors cursor-pointer group",
        notification.is_read
          ? "bg-zinc-900/30 border-zinc-800"
          : "bg-zinc-900/50 border-purple-500/30 hover:border-purple-500/50",
        compact && "p-3"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg",
            notification.is_read ? "bg-zinc-800" : "bg-purple-500/20"
          )}
        >
          {notification.icon || getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  notification.is_read ? "text-zinc-400" : "text-white"
                )}
              >
                {notification.title}
              </p>
              {notification.body && !compact && (
                <p className="text-sm text-zinc-500 mt-0.5 line-clamp-2">
                  {notification.body}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-zinc-500">
                {formatNotificationTime(notification.created_at)}
              </span>
              {onArchive && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Action button */}
          {notification.action_url && notification.action_label && !compact && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => e.stopPropagation()}
                asChild
              >
                <Link href={notification.action_url}>
                  {notification.action_label}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Unread indicator */}
        {!notification.is_read && (
          <div className="shrink-0 w-2 h-2 rounded-full bg-purple-500 mt-2" />
        )}
      </div>

      {/* Image preview */}
      {notification.image_url && !compact && (
        <div className="mt-3 ml-13">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={notification.image_url}
            alt=""
            className="rounded-lg max-h-32 object-cover"
          />
        </div>
      )}
    </Card>
  );

  if (notification.action_url && compact) {
    return <Link href={notification.action_url}>{content}</Link>;
  }

  return content;
}

export default NotificationItem;
