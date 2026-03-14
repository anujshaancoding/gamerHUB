"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ConnectionCardProps {
  provider: "riot" | "steam" | "supercell";
  isConnected: boolean;
  username?: string;
  avatarUrl?: string;
  connectedAt?: string;
  lastSynced?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting?: boolean;
  isDisconnecting?: boolean;
}

const providerInfo = {
  riot: {
    name: "Riot Games",
    description: "Connect to sync your Valorant and League of Legends stats",
    color: "text-error",
    bgColor: "bg-error/20",
    borderColor: "border-error/50",
    // logo: "/images/riot-logo.svg",
  },
  steam: {
    name: "Steam",
    description: "Connect to sync your Steam gaming stats",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
    // logo: "/images/steam-logo.svg",
  },
};

export function ConnectionCard({
  provider,
  isConnected,
  username,
  avatarUrl,
  connectedAt,
  lastSynced,
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
}: ConnectionCardProps) {
  const info = providerInfo[provider];

  return (
    <Card
      className={cn(
        "p-4 bg-surface/50 border-border transition-colors",
        isConnected && info.borderColor
      )}
    >
      <div className="flex items-start gap-4">
        {/* Provider Logo/Avatar */}
        <div
          className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
            info.bgColor
          )}
        >
          {isConnected && avatarUrl ? (
            <Avatar className="h-10 w-10">
              <Image src={avatarUrl} alt={username || provider} width={40} height={40} className="object-cover" unoptimized />
            </Avatar>
          ) : (
            <span className={cn("text-lg font-bold", info.color)}>
              {provider === "riot" ? "R" : provider === "supercell" ? "SC" : "S"}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-text">{info.name}</h3>
            {isConnected && (
              <Badge
                variant="outline"
                className="text-xs bg-success/20 text-success border-success/50"
              >
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>

          {isConnected ? (
            <>
              <p className="text-sm text-text font-medium">{username}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                {connectedAt && (
                  <span>
                    Connected{" "}
                    {formatDistanceToNow(new Date(connectedAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
                {lastSynced && (
                  <span>
                    Last synced{" "}
                    {formatDistanceToNow(new Date(lastSynced), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-text-muted">{info.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className="text-error hover:text-error border-error/50 hover:border-error"
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Unlink className="h-4 w-4 mr-1" />
                  Disconnect
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onConnect}
              disabled={isConnecting}
              className={cn(
                "text-text",
                provider === "riot"
                  ? "bg-error hover:bg-error/90"
                  : provider === "supercell"
                    ? "bg-success hover:bg-success/90"
                    : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LinkIcon className="h-4 w-4 mr-2" />
              )}
              Connect
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
