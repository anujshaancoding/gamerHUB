"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AutomationTrigger,
  AutomationAction,
  TRIGGER_INFO,
  ACTION_INFO,
  CreateRuleInput,
} from "@/lib/hooks/useAutomation";

interface RuleBuilderProps {
  clanId: string;
  discordConnected: boolean;
  initialData?: Partial<CreateRuleInput>;
  onSubmit: (data: CreateRuleInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
}

export function RuleBuilder({
  clanId,
  discordConnected,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  mode = "create",
}: RuleBuilderProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [triggerType, setTriggerType] = useState<AutomationTrigger | "">(
    initialData?.triggerType || ""
  );
  const [actionType, setActionType] = useState<AutomationAction | "">(
    initialData?.actionType || ""
  );
  const [cooldownMinutes, setCooldownMinutes] = useState(
    initialData?.cooldownMinutes || 0
  );

  // Action-specific config
  const [discordMessage, setDiscordMessage] = useState(
    (initialData?.actionConfig?.message as string) || ""
  );
  const [discordChannelId, setDiscordChannelId] = useState(
    (initialData?.actionConfig?.channel_id as string) || ""
  );
  const [notificationTitle, setNotificationTitle] = useState(
    (initialData?.actionConfig?.title as string) || ""
  );
  const [notificationBody, setNotificationBody] = useState(
    (initialData?.actionConfig?.body as string) || ""
  );

  const selectedAction = actionType ? ACTION_INFO[actionType] : null;
  const requiresDiscord = selectedAction?.requiresDiscord || false;

  const handleSubmit = () => {
    if (!name || !triggerType || !actionType) return;

    const actionConfig: Record<string, unknown> = {};

    if (actionType === "send_discord_message") {
      actionConfig.message = discordMessage;
      actionConfig.channel_id = discordChannelId;
    } else if (actionType === "send_notification" || actionType === "post_announcement") {
      actionConfig.title = notificationTitle;
      actionConfig.body = notificationBody;
    }

    onSubmit({
      clanId,
      name,
      description: description || undefined,
      triggerType,
      actionType,
      actionConfig,
      cooldownMinutes,
    });
  };

  const isValid =
    name.trim() &&
    triggerType &&
    actionType &&
    (!requiresDiscord || discordConnected);

  return (
    <Card className="p-6 bg-zinc-900/50 border-zinc-800">
      <h2 className="text-lg font-semibold text-white mb-6">
        {mode === "create" ? "Create Automation Rule" : "Edit Automation Rule"}
      </h2>

      <div className="space-y-6">
        {/* Basic info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome new members"
              className="mt-1 bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this rule does..."
              className="mt-1 bg-zinc-800 border-zinc-700 min-h-[60px]"
            />
          </div>
        </div>

        {/* Trigger selection */}
        <div>
          <Label>When this happens...</Label>
          <Select
            value={triggerType}
            onValueChange={(v) => setTriggerType(v as AutomationTrigger)}
          >
            <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Select a trigger" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TRIGGER_INFO).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {triggerType && (
            <p className="text-xs text-zinc-500 mt-1">
              {TRIGGER_INFO[triggerType].description}
            </p>
          )}
        </div>

        {/* Flow indicator */}
        {triggerType && (
          <div className="flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-zinc-500" />
          </div>
        )}

        {/* Action selection */}
        <div>
          <Label>Do this...</Label>
          <Select
            value={actionType}
            onValueChange={(v) => setActionType(v as AutomationAction)}
          >
            <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Select an action" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTION_INFO).map(([key, info]) => (
                <SelectItem
                  key={key}
                  value={key}
                  disabled={info.requiresDiscord && !discordConnected}
                >
                  <span className="flex items-center gap-2">
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                    {info.requiresDiscord && (
                      <Badge variant="outline" className="text-xs">
                        Discord
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {actionType && (
            <p className="text-xs text-zinc-500 mt-1">
              {ACTION_INFO[actionType].description}
            </p>
          )}
        </div>

        {/* Discord warning */}
        {requiresDiscord && !discordConnected && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <p className="text-sm text-yellow-200">
              This action requires Discord to be connected to your clan.
            </p>
          </div>
        )}

        {/* Action config */}
        {actionType === "send_discord_message" && discordConnected && (
          <div className="space-y-4 p-4 bg-zinc-800/50 rounded-lg">
            <h3 className="text-sm font-medium text-white">
              Discord Message Settings
            </h3>
            <div>
              <Label htmlFor="channel">Channel ID</Label>
              <Input
                id="channel"
                value={discordChannelId}
                onChange={(e) => setDiscordChannelId(e.target.value)}
                placeholder="e.g., 123456789012345678"
                className="mt-1 bg-zinc-800 border-zinc-700"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Right-click a channel in Discord and copy ID
              </p>
            </div>
            <div>
              <Label htmlFor="message">Message Template</Label>
              <Textarea
                id="message"
                value={discordMessage}
                onChange={(e) => setDiscordMessage(e.target.value)}
                placeholder="Welcome {{username}} to the clan!"
                className="mt-1 bg-zinc-800 border-zinc-700 min-h-[80px]"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Use {"{{username}}"}, {"{{clan_name}}"}, {"{{game}}"} for
                dynamic values
              </p>
            </div>
          </div>
        )}

        {(actionType === "send_notification" ||
          actionType === "post_announcement") && (
          <div className="space-y-4 p-4 bg-zinc-800/50 rounded-lg">
            <h3 className="text-sm font-medium text-white">
              Notification Settings
            </h3>
            <div>
              <Label htmlFor="notifTitle">Title</Label>
              <Input
                id="notifTitle"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Notification title"
                className="mt-1 bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <Label htmlFor="notifBody">Message</Label>
              <Textarea
                id="notifBody"
                value={notificationBody}
                onChange={(e) => setNotificationBody(e.target.value)}
                placeholder="Notification message..."
                className="mt-1 bg-zinc-800 border-zinc-700 min-h-[80px]"
              />
            </div>
          </div>
        )}

        {/* Cooldown */}
        <div>
          <Label htmlFor="cooldown">Cooldown (minutes)</Label>
          <Input
            id="cooldown"
            type="number"
            min={0}
            value={cooldownMinutes}
            onChange={(e) => setCooldownMinutes(parseInt(e.target.value) || 0)}
            className="mt-1 bg-zinc-800 border-zinc-700 w-32"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Minimum time between triggers (0 = no cooldown)
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {mode === "create" ? "Create Rule" : "Save Changes"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default RuleBuilder;
