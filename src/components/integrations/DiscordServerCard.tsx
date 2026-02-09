"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Hash,
  Settings,
  Trash2,
  Check,
  X,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useDiscordIntegration } from "@/lib/hooks/useDiscordIntegration";
import type { DiscordGuild, DiscordWebhook } from "@/types/discord";

interface DiscordServerCardProps {
  guild: DiscordGuild;
  webhooks: DiscordWebhook[];
  onAddWebhook?: (guildId: string) => void;
}

export function DiscordServerCard({
  guild,
  webhooks,
  onAddWebhook,
}: DiscordServerCardProps) {
  const { updateWebhook, deleteWebhook } = useDiscordIntegration();
  const [expanded, setExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const guildWebhooks = webhooks.filter((w) => w.guild_id === guild.id);
  const activeCount = guildWebhooks.filter((w) => w.is_active).length;

  const getIconUrl = () => {
    if (!guild.icon) return null;
    const ext = guild.icon.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${ext}?size=64`;
  };

  const handleToggleWebhook = async (
    webhookId: string,
    field: "is_active" | "post_lfg" | "post_tournaments" | "post_clan_recruitment",
    value: boolean
  ) => {
    await updateWebhook(webhookId, { [field]: value });
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    setDeletingId(webhookId);
    try {
      await deleteWebhook(webhookId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Server Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
      >
        {/* Server Icon */}
        {getIconUrl() ? (
          <img
            src={getIconUrl()!}
            alt={guild.name}
            className="w-12 h-12 rounded-xl"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <span className="text-lg font-medium">
              {guild.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Server Info */}
        <div className="flex-1 text-left">
          <div className="font-medium flex items-center gap-2">
            {guild.name}
            {guild.owner && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500">
                Owner
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {guildWebhooks.length === 0 ? (
              "No webhooks configured"
            ) : (
              <>
                {activeCount} of {guildWebhooks.length} channel
                {guildWebhooks.length !== 1 ? "s" : ""} active
              </>
            )}
          </div>
        </div>

        {/* Expand Indicator */}
        {guildWebhooks.length > 0 && (
          expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )
        )}
      </button>

      {/* Webhooks List */}
      {expanded && guildWebhooks.length > 0 && (
        <div className="border-t border-border">
          {guildWebhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="p-4 border-b border-border last:border-b-0"
            >
              {/* Channel Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{webhook.channel_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={webhook.is_active}
                    onCheckedChange={(checked) =>
                      handleToggleWebhook(webhook.id, "is_active", checked)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteWebhook(webhook.id)}
                    disabled={deletingId === webhook.id}
                  >
                    {deletingId === webhook.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Post Settings */}
              {webhook.is_active && (
                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhook.post_lfg}
                      onChange={(e) =>
                        handleToggleWebhook(
                          webhook.id,
                          "post_lfg",
                          e.target.checked
                        )
                      }
                      className="rounded border-input"
                    />
                    <span className="text-sm">LFG</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhook.post_tournaments}
                      onChange={(e) =>
                        handleToggleWebhook(
                          webhook.id,
                          "post_tournaments",
                          e.target.checked
                        )
                      }
                      className="rounded border-input"
                    />
                    <span className="text-sm">Tournaments</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhook.post_clan_recruitment}
                      onChange={(e) =>
                        handleToggleWebhook(
                          webhook.id,
                          "post_clan_recruitment",
                          e.target.checked
                        )
                      }
                      className="rounded border-input"
                    />
                    <span className="text-sm">Clan</span>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Webhook Button */}
      {onAddWebhook && (
        <div className="p-3 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => onAddWebhook(guild.id)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Channel Webhook
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// Add Webhook Modal Component
interface AddWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  guildId: string;
  guildName: string;
}

export function AddWebhookModal({
  isOpen,
  onClose,
  guildId,
  guildName,
}: AddWebhookModalProps) {
  const { addWebhook, isAddingWebhook } = useDiscordIntegration();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channelId, setChannelId] = useState("");
  const [channelName, setChannelName] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!webhookUrl.trim()) {
      setError("Webhook URL is required");
      return;
    }

    // Validate webhook URL format
    const webhookRegex =
      /^https:\/\/discord\.com\/api\/webhooks\/(\d+)\/([A-Za-z0-9_-]+)$/;
    if (!webhookRegex.test(webhookUrl)) {
      setError("Invalid webhook URL format");
      return;
    }

    try {
      await addWebhook({
        webhook_url: webhookUrl,
        guild_id: guildId,
        guild_name: guildName,
        channel_id: channelId || `channel_${Date.now()}`,
        channel_name: channelName || "Unknown Channel",
      });
      onClose();
    } catch {
      setError("Failed to add webhook");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl shadow-xl"
      >
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Add Discord Webhook</h3>
          <p className="text-sm text-muted-foreground">
            Add a webhook to post to {guildName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Webhook URL</label>
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Create a webhook in your Discord channel settings and paste the
              URL here
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Channel Name</label>
            <input
              type="text"
              placeholder="e.g., #lfg-posts"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isAddingWebhook}
            >
              {isAddingWebhook ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Webhook"
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
