"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Link as LinkIcon,
  Unlink,
  Check,
  Loader2,
  Shield,
  Swords,
  Trophy,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface CocConnectCardProps {
  isConnected: boolean;
  username?: string;
  connectedAt?: string;
  lastSynced?: string;
  metadata?: Record<string, unknown>;
  onConnect: (playerTag: string) => void;
  onDisconnect: () => void;
  isConnecting?: boolean;
  isDisconnecting?: boolean;
  error?: Error | null;
}

export function CocConnectCard({
  isConnected,
  username,
  connectedAt,
  lastSynced,
  metadata,
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
  error,
}: CocConnectCardProps) {
  const [playerTag, setPlayerTag] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateTag = (tag: string): boolean => {
    const normalized = tag.startsWith("#") ? tag : `#${tag}`;
    return /^#[0289PYLQGRJCUV]+$/i.test(normalized);
  };

  const handleConnect = () => {
    const tag = playerTag.trim();
    if (!tag) {
      setValidationError("Please enter your player tag");
      return;
    }

    if (!validateTag(tag)) {
      setValidationError("Invalid tag format. Example: #2YPQ0VJG8");
      return;
    }

    setValidationError(null);
    onConnect(tag.startsWith("#") ? tag : `#${tag}`);
  };

  const townHallLevel = metadata?.town_hall_level as number | undefined;
  const trophies = metadata?.trophies as number | undefined;
  const warStars = metadata?.war_stars as number | undefined;
  const clan = metadata?.clan as { name: string; tag: string } | null;

  return (
    <Card
      className={cn(
        "p-4 bg-zinc-900/50 border-zinc-800 transition-colors",
        isConnected && "border-green-500/50"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-green-500/20">
          <span className="text-lg font-bold text-green-400">CoC</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">Clash of Clans</h3>
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
              {/* CoC-specific stats preview */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
                {townHallLevel && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-yellow-400" />
                    TH {townHallLevel}
                  </span>
                )}
                {trophies !== undefined && (
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-yellow-400" />
                    {trophies.toLocaleString()}
                  </span>
                )}
                {warStars !== undefined && (
                  <span className="flex items-center gap-1">
                    <Swords className="h-3 w-3 text-yellow-400" />
                    {warStars} war stars
                  </span>
                )}
                {clan && (
                  <span className="text-green-400">{clan.name}</span>
                )}
              </div>
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
            <div className="space-y-2">
              <p className="text-sm text-zinc-400">
                Enter your player tag to connect your Clash of Clans account
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={playerTag}
                  onChange={(e) => {
                    setPlayerTag(e.target.value);
                    setValidationError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConnect();
                  }}
                  placeholder="#2YPQ0VJG8"
                  className="flex-1 max-w-[200px] px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                />
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <LinkIcon className="h-4 w-4 mr-1" />
                  )}
                  Connect
                </Button>
              </div>
              {validationError && (
                <p className="text-xs text-red-400">{validationError}</p>
              )}
              {error && (
                <p className="text-xs text-red-400">{error.message}</p>
              )}
              <p className="text-xs text-zinc-500">
                Find your tag in-game: Profile → below your name
              </p>
            </div>
          )}
        </div>

        {/* Disconnect button */}
        {isConnected && (
          <div className="shrink-0">
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
          </div>
        )}
      </div>
    </Card>
  );
}
