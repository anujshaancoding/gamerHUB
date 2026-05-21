"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Bell, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useNotificationPreferences,
  useUpdatePreferences,
  NotificationPreference,
  NotificationType,
  NotificationChannel,
  NOTIFICATION_TYPE_INFO,
  CHANNEL_INFO,
} from "@/lib/hooks/useNotifications";

interface NotificationPreferencesProps {
  className?: string;
}

export function NotificationPreferences({
  className,
}: NotificationPreferencesProps) {
  const { data, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdatePreferences();

  const [editedPrefs, setEditedPrefs] = useState<
    Map<NotificationType, Partial<NotificationPreference>>
  >(new Map());
  const [hasChanges, setHasChanges] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const preferences = data?.preferences || [];

  const getPreference = (type: NotificationType): NotificationPreference => {
    const edited = editedPrefs.get(type);
    const original = preferences.find((p) => p.notification_type === type);
    return {
      ...original,
      ...edited,
    } as NotificationPreference;
  };

  const updatePreference = (
    type: NotificationType,
    updates: Partial<NotificationPreference>
  ) => {
    const current = editedPrefs.get(type) || {};
    setEditedPrefs(new Map(editedPrefs.set(type, { ...current, ...updates })));
    setHasChanges(true);
  };

  const toggleChannel = (type: NotificationType, channel: NotificationChannel) => {
    const pref = getPreference(type);
    const channels = pref.channels || ["in_app"];

    if (channels.includes(channel)) {
      // Don't allow removing all channels
      if (channels.length === 1) {
        toast.error("At least one channel must be selected");
        return;
      }
      updatePreference(type, {
        channels: channels.filter((c) => c !== channel) as NotificationChannel[],
      });
    } else {
      updatePreference(type, {
        channels: [...channels, channel] as NotificationChannel[],
      });
    }
  };

  const handleSave = () => {
    const prefsToUpdate = Array.from(editedPrefs.entries()).map(
      ([type, updates]) => ({
        notification_type: type,
        ...updates,
      })
    );

    updateMutation.mutate(prefsToUpdate, {
      onSuccess: () => {
        toast.success("Preferences saved");
        setEditedPrefs(new Map());
        setHasChanges(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const ChannelButton = ({
    channel,
    active,
    disabled,
    onClick,
  }: {
    channel: NotificationChannel;
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
  }) => {
    const info = CHANNEL_INFO[channel];
    const Icon = {
      in_app: Bell,
      email: Mail,
      push: Bell,
    }[channel];

    return (
      <Button
        variant={active ? "default" : "outline"}
        size="sm"
        className={cn(
          "h-8 px-3",
          active && "bg-primary hover:bg-primary-dark text-background",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={onClick}
        disabled={disabled}
      >
        <Icon className="h-3 w-3 mr-1" />
        {info.label}
      </Button>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Preferences list */}
      <div className="space-y-4">
        {Object.entries(NOTIFICATION_TYPE_INFO).map(([type, info]) => {
          const pref = getPreference(type as NotificationType);
          const channels = pref.channels || ["in_app"];

          return (
            <Card
              key={type}
              className="p-4 bg-surface/50 border-border"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{info.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-text">{info.label}</h3>
                      {!pref.is_enabled && (
                        <Badge variant="outline" className="text-text-muted">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-muted mt-0.5">
                      {info.description}
                    </p>
                  </div>
                </div>

                <Switch
                  checked={pref.is_enabled !== false}
                  onCheckedChange={(checked) =>
                    updatePreference(type as NotificationType, {
                      is_enabled: checked,
                    })
                  }
                />
              </div>

              {pref.is_enabled !== false && (
                <div className="mt-4 pl-9 space-y-3">
                  {/* Channels */}
                  <div>
                    <p className="text-xs text-text-muted mb-2">
                      Notification channels
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <ChannelButton
                        channel="in_app"
                        active={channels.includes("in_app")}
                        onClick={() =>
                          toggleChannel(type as NotificationType, "in_app")
                        }
                      />
                      <ChannelButton
                        channel="email"
                        active={channels.includes("email")}
                        onClick={() =>
                          toggleChannel(type as NotificationType, "email")
                        }
                      />
                    </div>
                  </div>

                  {/* Frequency (for certain types) */}
                  {["forum_reply", "direct_message"].includes(type) && (
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-text-muted">Frequency</p>
                      <Select
                        value={pref.frequency || "instant"}
                        onValueChange={(value) =>
                          updatePreference(type as NotificationType, {
                            frequency: value as "instant" | "hourly_digest" | "daily_digest",
                          })
                        }
                      >
                        <SelectTrigger className="w-[150px] h-8 bg-surface-light border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instant">Instant</SelectItem>
                          <SelectItem value="hourly_digest">Hourly digest</SelectItem>
                          <SelectItem value="daily_digest">Daily digest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Save button */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-primary hover:bg-primary-dark text-background"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}

export default NotificationPreferences;
