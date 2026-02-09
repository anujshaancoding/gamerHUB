"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, MapPin, Clock } from "lucide-react";
import { Card, Avatar, Badge, Button } from "@/components/ui";
import { PremiumBadge } from "@/components/premium";
import { formatRelativeTime } from "@/lib/utils";
import type { FriendRequestWithProfiles } from "@/types/database";

interface FriendRequestCardProps {
  request: FriendRequestWithProfiles;
  type: "received" | "sent";
  onAccept?: (requestId: string) => Promise<{ success?: boolean; error?: Error }>;
  onDecline?: (requestId: string) => Promise<{ success?: boolean; error?: Error }>;
  onCancel?: (requestId: string) => Promise<{ success?: boolean; error?: Error }>;
}

export function FriendRequestCard({
  request,
  type,
  onAccept,
  onDecline,
  onCancel,
}: FriendRequestCardProps) {
  const [loading, setLoading] = useState<"accept" | "decline" | "cancel" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const profile = type === "received" ? request.sender : request.recipient;

  const handleAccept = async () => {
    if (!onAccept) return;
    setLoading("accept");
    setError(null);
    const result = await onAccept(request.id);
    if (result.error) {
      setError(result.error.message);
    }
    setLoading(null);
  };

  const handleDecline = async () => {
    if (!onDecline) return;
    setLoading("decline");
    setError(null);
    const result = await onDecline(request.id);
    if (result.error) {
      setError(result.error.message);
    }
    setLoading(null);
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    setLoading("cancel");
    setError(null);
    const result = await onCancel(request.id);
    if (result.error) {
      setError(result.error.message);
    }
    setLoading(null);
  };

  return (
    <Card variant="default" className="h-full">
      <div className="flex gap-4">
        <Link href={`/profile/${profile.username}`}>
          <Avatar
            src={profile.avatar_url}
            alt={profile.display_name || profile.username}
            size="lg"
            status={profile.is_online ? "online" : "offline"}
            showStatus
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${profile.username}`}
              className="hover:underline"
            >
              <h3 className="font-semibold text-text truncate">
                {profile.display_name || profile.username}
              </h3>
            </Link>
            {profile.is_premium && (
              <PremiumBadge size="sm" showLabel={false} animate={false} />
            )}
            {profile.gaming_style && (
              <Badge
                variant={
                  profile.gaming_style === "pro"
                    ? "primary"
                    : profile.gaming_style === "competitive"
                    ? "secondary"
                    : "default"
                }
                size="sm"
              >
                {profile.gaming_style}
              </Badge>
            )}
          </div>
          <p className="text-sm text-text-muted truncate">@{profile.username}</p>

          <div className="flex flex-wrap gap-2 mt-2 text-xs text-text-muted">
            {profile.region && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.region}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {type === "received" ? "Received" : "Sent"}{" "}
              {formatRelativeTime(request.created_at)}
            </span>
          </div>

          {request.message && (
            <p className="mt-2 text-sm text-text-secondary italic line-clamp-2">
              "{request.message}"
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-error">{error}</p>
      )}

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-end gap-2">
        {type === "received" ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDecline}
              isLoading={loading === "decline"}
              disabled={loading !== null}
              className="text-error hover:bg-error/10"
              leftIcon={<X className="h-4 w-4" />}
            >
              Decline
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAccept}
              isLoading={loading === "accept"}
              disabled={loading !== null}
              leftIcon={<Check className="h-4 w-4" />}
            >
              Accept
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            isLoading={loading === "cancel"}
            disabled={loading !== null}
            className="text-error hover:bg-error/10"
            leftIcon={<X className="h-4 w-4" />}
          >
            Cancel Request
          </Button>
        )}
      </div>
    </Card>
  );
}
