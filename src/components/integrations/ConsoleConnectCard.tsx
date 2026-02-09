"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Unlink,
  Check,
  Loader2,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConsolePlatforms } from "@/lib/hooks/useConsolePlatforms";
import {
  type ConsolePlatform,
  PLATFORM_CONFIG,
  formatNintendoFriendCode,
} from "@/types/console";

interface ConsoleConnectCardProps {
  platform: ConsolePlatform;
  compact?: boolean;
}

export function ConsoleConnectCard({
  platform,
  compact = false,
}: ConsoleConnectCardProps) {
  const {
    connections,
    isLoading,
    connect,
    isConnecting,
    disconnect,
    isDisconnecting,
  } = useConsolePlatforms();

  const [showForm, setShowForm] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const config = PLATFORM_CONFIG[platform];
  const connection = connections?.find((c) => c.platform === platform);

  const handleConnect = async () => {
    if (!inputValue.trim()) {
      setError(`Please enter your ${config.idLabel}`);
      return;
    }

    setError("");

    try {
      let data: Record<string, string> = {};

      if (platform === "nintendo") {
        data = {
          friend_code: inputValue,
          nickname: nickname.trim(),
        };
      } else if (platform === "playstation") {
        data = { online_id: inputValue.trim() };
      } else if (platform === "xbox") {
        data = { gamertag: inputValue.trim() };
      }

      await connect({ platform, ...data });
      setShowForm(false);
      setInputValue("");
      setNickname("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  };

  const handleDisconnect = async () => {
    if (confirm(`Are you sure you want to disconnect ${config.name}?`)) {
      await disconnect(platform);
    }
  };

  const handleInputChange = (value: string) => {
    if (platform === "nintendo") {
      setInputValue(formatNintendoFriendCode(value));
    } else {
      setInputValue(value);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border border-border bg-card animate-pulse">
        <div className="h-12 bg-muted rounded" />
      </div>
    );
  }

  // Platform-specific icon
  const PlatformIcon = () => (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
      style={{ backgroundColor: config.color }}
    >
      {platform === "playstation" && (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
          <path d="M8.984 2.596v17.547l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.393-1.502z" />
        </svg>
      )}
      {platform === "xbox" && (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2c1.33 0 2.598.26 3.755.732-.367.314-.729.657-1.074 1.026-.757.81-1.494 1.745-2.127 2.776-.633-1.031-1.37-1.966-2.127-2.776-.345-.369-.707-.712-1.074-1.026A7.955 7.955 0 0112 4zm-5.8 2.138c.386.323.783.68 1.18 1.068.932.914 1.849 2.024 2.62 3.313.85 1.424 1.479 3.018 1.79 4.68H5.72a7.963 7.963 0 01-.52-2.897c0-2.284.959-4.345 2.5-5.804l-.5-.36zm11.6 0l-.5.36A7.963 7.963 0 0120.3 12.2c0 1.027-.193 2.01-.54 2.91h-5.97c.31-1.662.94-3.256 1.79-4.68.77-1.289 1.688-2.399 2.62-3.313.397-.388.794-.745 1.18-1.068zM12 8.61c.395.57.78 1.187 1.136 1.84.706 1.293 1.248 2.756 1.514 4.35h-5.3c.266-1.594.808-3.057 1.514-4.35A15.6 15.6 0 0112 8.61zm0 8.19h6.462c-1.21 2.7-3.862 4.6-6.962 4.6s-5.752-1.9-6.962-4.6H12z" />
        </svg>
      )}
      {platform === "nintendo" && (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
          <path d="M10.04 20.4H7.12c-.93 0-1.68-.81-1.68-1.8V5.4c0-.99.75-1.8 1.68-1.8h2.92V20.4zM7.12 2A3.37 3.37 0 003.8 5.4v13.2c0 1.88 1.49 3.4 3.32 3.4h2.92V2H7.12zm7.76 0h2.92c1.83 0 3.32 1.52 3.32 3.4v13.2c0 1.88-1.49 3.4-3.32 3.4h-2.92V2zm2.92 1.6c.93 0 1.68.81 1.68 1.8v13.2c0 .99-.75 1.8-1.68 1.8h-2.92V3.6h2.92zM7.12 9.79c-.67 0-1.21.58-1.21 1.3s.54 1.3 1.21 1.3c.67 0 1.21-.58 1.21-1.3s-.54-1.3-1.21-1.3z" />
        </svg>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-3">
          <PlatformIcon />
          <div>
            <div className="font-medium">{config.name}</div>
            {connection ? (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                {connection.is_verified ? (
                  <ShieldCheck className="h-3 w-3 text-green-500" />
                ) : (
                  <Shield className="h-3 w-3 text-yellow-500" />
                )}
                {connection.online_id || connection.platform_username}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Not connected</div>
            )}
          </div>
        </div>
        {connection ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Unlink className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button size="sm" onClick={() => setShowForm(true)}>
            Connect
          </Button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-6 border-b border-border"
        style={{
          background: `linear-gradient(to right, ${config.color}15, transparent)`,
        }}
      >
        <div className="flex items-center gap-4">
          <PlatformIcon />
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{config.name}</h3>
            <p className="text-sm text-muted-foreground">
              {connection
                ? `Connected as ${connection.online_id || connection.platform_username}`
                : `Connect your ${config.name} account`}
            </p>
          </div>
          {connection && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                connection.is_verified
                  ? "bg-green-500/10 text-green-500"
                  : "bg-yellow-500/10 text-yellow-500"
              }`}
            >
              {connection.is_verified ? (
                <>
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </>
              ) : (
                <>
                  <Shield className="h-3 w-3" />
                  Unverified
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {connection ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="text-sm">
                <div className="text-muted-foreground">{config.idLabel}</div>
                <div className="font-medium">
                  {connection.online_id || connection.platform_username}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Unlink className="h-4 w-4 mr-2" />
              )}
              Disconnect
            </Button>
          </div>
        ) : showForm ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{config.idLabel}</label>
              <input
                type="text"
                placeholder={config.idPlaceholder}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
              />
            </div>

            {platform === "nintendo" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Nickname (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Your Switch nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                />
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowForm(false);
                  setInputValue("");
                  setError("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleConnect}
                disabled={isConnecting}
                style={{ backgroundColor: config.color }}
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Connect"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Show your {config.name} ID on your profile
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Find friends who also play on {config.name}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Join crossplay parties with other platforms
              </li>
            </ul>

            <Button
              className="w-full"
              style={{ backgroundColor: config.color }}
              onClick={() => setShowForm(true)}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Connect {config.name}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// All platforms card
export function AllConsolesCard() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Gaming Platforms</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <ConsoleConnectCard platform="playstation" compact />
        <ConsoleConnectCard platform="xbox" compact />
        <ConsoleConnectCard platform="nintendo" compact />
      </div>
    </div>
  );
}
