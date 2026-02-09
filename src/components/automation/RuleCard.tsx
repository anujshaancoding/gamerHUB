"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Pencil,
  Trash2,
  History,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  AutomationRule,
  TRIGGER_INFO,
  ACTION_INFO,
} from "@/lib/hooks/useAutomation";

interface RuleCardProps {
  rule: AutomationRule;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewLogs: () => void;
  isToggling?: boolean;
}

export function RuleCard({
  rule,
  onToggle,
  onEdit,
  onDelete,
  onViewLogs,
  isToggling,
}: RuleCardProps) {
  const triggerInfo = TRIGGER_INFO[rule.trigger_type];
  const actionInfo = ACTION_INFO[rule.action_type];

  return (
    <Card
      className={cn(
        "p-4 bg-zinc-900/50 border-zinc-800 transition-colors",
        !rule.is_enabled && "opacity-60"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Toggle */}
        <Switch
          checked={rule.is_enabled}
          onCheckedChange={onToggle}
          disabled={isToggling}
          className="mt-1"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-white">{rule.name}</h3>
              {rule.description && (
                <p className="text-sm text-zinc-400 mt-0.5">
                  {rule.description}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onViewLogs}>
                  <History className="h-4 w-4 mr-2" />
                  View Logs
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Trigger → Action flow */}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400">
              <span className="mr-1">{triggerInfo?.icon}</span>
              {triggerInfo?.label || rule.trigger_type}
            </Badge>
            <ArrowRight className="h-4 w-4 text-zinc-500" />
            <Badge
              variant="outline"
              className={cn(
                "bg-green-500/10 border-green-500/30 text-green-400",
                actionInfo?.requiresDiscord && "border-indigo-500/30 text-indigo-400 bg-indigo-500/10"
              )}
            >
              <span className="mr-1">{actionInfo?.icon}</span>
              {actionInfo?.label || rule.action_type}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {rule.trigger_count} triggers
            </span>
            {rule.cooldown_minutes > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {rule.cooldown_minutes}m cooldown
              </span>
            )}
            {rule.last_triggered_at && (
              <span>
                Last triggered{" "}
                {formatDistanceToNow(new Date(rule.last_triggered_at), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>

          {/* Created by */}
          {rule.created_by_profile && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800">
              <Avatar className="h-5 w-5">
                {rule.created_by_profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={rule.created_by_profile.avatar_url}
                    alt=""
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-purple-600 flex items-center justify-center text-white text-xs">
                    {(rule.created_by_profile.display_name ||
                      rule.created_by_profile.username)[0].toUpperCase()}
                  </div>
                )}
              </Avatar>
              <span className="text-xs text-zinc-500">
                Created by{" "}
                {rule.created_by_profile.display_name ||
                  rule.created_by_profile.username}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default RuleCard;
