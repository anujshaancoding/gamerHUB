"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Bell, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NotificationPreferences } from "@/components/notifications";
import { DiscordConnect } from "@/components/automation";
import {
  useDiscordConnection,
  useDisconnectDiscord,
} from "@/lib/hooks/useNotifications";

export default function NotificationSettingsPage() {
  const { data: discordConnection, isLoading } = useDiscordConnection();
  const disconnectMutation = useDisconnectDiscord();

  const handleConnectDiscord = async () => {
    try {
      const response = await fetch("/api/discord/connect");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to connect Discord"
      );
    }
  };

  const handleDisconnectDiscord = () => {
    disconnectMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Discord disconnected");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

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

      {/* Discord Connection */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Discord Integration
        </h2>
        {isLoading ? (
          <Card className="p-6 bg-zinc-900/50 border-zinc-800">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            </div>
          </Card>
        ) : (
          <DiscordConnect
            connection={discordConnection}
            onConnect={handleConnectDiscord}
            onDisconnect={handleDisconnectDiscord}
            isDisconnecting={disconnectMutation.isPending}
          />
        )}
      </section>

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
