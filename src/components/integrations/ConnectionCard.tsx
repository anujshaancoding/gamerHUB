"use client";

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
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/50",
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
        "p-4 bg-zinc-900/50 border-zinc-800 transition-colors",
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt={username || provider} className="object-cover" />
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
            <h3 className="font-semibold text-white">{info.name}</h3>
            {isConnected && (
              <Badge
                variant="outline"
                className="text-xs bg-green-500/20 text-green-300 border-green-500/50"
              >
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>

          {isConnected ? (
            <>
              <p className="text-sm text-white font-medium">{username}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
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
            <p className="text-sm text-zinc-400">{info.description}</p>
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
              className="text-red-400 hover:text-red-300 border-red-500/50 hover:border-red-500"
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
                "text-white",
                provider === "riot"
                  ? "bg-red-600 hover:bg-red-700"
                  : provider === "supercell"
                    ? "bg-green-600 hover:bg-green-700"
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
