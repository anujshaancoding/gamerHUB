"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Check, X, ExternalLink, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { getDiscordAvatarUrl } from "@/lib/integrations/discord";

interface DiscordConnectionData {
  id: string;
  discord_user_id: string;
  discord_username: string;
  discord_discriminator?: string;
  discord_avatar?: string;
  is_active: boolean;
  connected_at: string;
  last_synced_at?: string;
  guilds?: Array<{
    id: string;
    name: string;
    icon?: string;
    owner: boolean;
  }>;
}

interface DiscordConnectProps {
  connection?: DiscordConnectionData | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting?: boolean;
  isDisconnecting?: boolean;
  className?: string;
}

export function DiscordConnect({
  connection,
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
  className,
}: DiscordConnectProps) {
  const [showGuilds, setShowGuilds] = useState(false);

  const avatarUrl = connection
    ? getDiscordAvatarUrl(
        connection.discord_user_id,
        connection.discord_avatar || undefined,
        connection.discord_discriminator
      )
    : null;

  if (!connection) {
    return (
      <Card
        className={cn(
          "p-6 bg-zinc-900/50 border-zinc-800",
          className
        )}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-lg">
            <MessageSquare className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Discord</h3>
            <p className="text-sm text-zinc-400">
              Connect your Discord account to receive notifications and use bot
              commands
            </p>
          </div>
          <Button
            onClick={onConnect}
            disabled={isConnecting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Connect
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "p-6 bg-zinc-900/50 border-zinc-800",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-12 w-12">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" width={48} height={48} className="object-cover" unoptimized />
            ) : (
              <div className="h-full w-full bg-indigo-600 flex items-center justify-center text-white">
                {connection.discord_username[0].toUpperCase()}
              </div>
            )}
          </Avatar>
          {connection.is_active && (
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-900" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">
              {connection.discord_username}
            </h3>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 mt-0.5">
            Connected{" "}
            {formatDistanceToNow(new Date(connection.connected_at), {
              addSuffix: true,
            })}
          </p>

          {/* Guilds */}
          {connection.guilds && connection.guilds.length > 0 && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-zinc-400 hover:text-white"
                onClick={() => setShowGuilds(!showGuilds)}
              >
                {connection.guilds.length} mutual servers
              </Button>

              {showGuilds && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {connection.guilds.slice(0, 5).map((guild) => (
                    <Badge
                      key={guild.id}
                      variant="outline"
                      className="text-xs"
                    >
                      {guild.name}
                      {guild.owner && " (Owner)"}
                    </Badge>
                  ))}
                  {connection.guilds.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{connection.guilds.length - 5} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 hover:text-red-300 border-red-500/30"
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Disconnect
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-zinc-900 border-zinc-800">
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Discord?</AlertDialogTitle>
              <AlertDialogDescription>
                This will disable Discord notifications and bot commands. You
                can reconnect at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDisconnect}
                className="bg-red-600 hover:bg-red-700"
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}

export default DiscordConnect;
