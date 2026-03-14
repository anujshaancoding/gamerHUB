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
        "p-4 bg-surface/50 border-border transition-colors",
        isConnected && "border-success/50"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-success/20">
          <span className="text-lg font-bold text-success">CoC</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-text">Clash of Clans</h3>
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
              {/* CoC-specific stats preview */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-muted">
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
                  <span className="text-success">{clan.name}</span>
                )}
              </div>
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
            <div className="space-y-2">
              <p className="text-sm text-text-muted">
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
                  className="flex-1 max-w-[200px] px-3 py-1.5 text-sm bg-surface-light border border-border rounded-md text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success"
                />
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  size="sm"
                  className="bg-success hover:bg-success/90 text-text"
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
                <p className="text-xs text-error">{validationError}</p>
              )}
              {error && (
                <p className="text-xs text-error">{error.message}</p>
              )}
              <p className="text-xs text-text-muted">
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
          </div>
        )}
      </div>
    </Card>
  );
}
