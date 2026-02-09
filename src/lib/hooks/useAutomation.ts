"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface AutomationRule {
  id: string;
  clan_id: string;
  name: string;
  description?: string;
  trigger_type: AutomationTrigger;
  trigger_conditions: Record<string, unknown>;
  action_type: AutomationAction;
  action_config: Record<string, unknown>;
  is_enabled: boolean;
  cooldown_minutes: number;
  last_triggered_at?: string;
  trigger_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_profile?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface AutomationLog {
  id: string;
  rule_id: string;
  clan_id: string;
  trigger_data: Record<string, unknown>;
  action_result?: Record<string, unknown>;
  is_success: boolean;
  error_message?: string;
  execution_time_ms?: number;
  executed_at: string;
}

export interface DiscordGuildConnection {
  id: string;
  clan_id: string;
  guild_id: string;
  guild_name: string;
  guild_icon?: string;
  webhook_url?: string;
  notification_channel_id?: string;
  announcement_channel_id?: string;
  is_active: boolean;
}

export type AutomationTrigger =
  | "member_joined"
  | "member_left"
  | "match_scheduled"
  | "match_completed"
  | "tournament_created"
  | "achievement_unlocked"
  | "level_milestone"
  | "weekly_summary";

export type AutomationAction =
  | "send_discord_message"
  | "send_notification"
  | "assign_role"
  | "update_channel_topic"
  | "create_event"
  | "post_announcement";

export interface CreateRuleInput {
  clanId: string;
  name: string;
  description?: string;
  triggerType: AutomationTrigger;
  triggerConditions?: Record<string, unknown>;
  actionType: AutomationAction;
  actionConfig: Record<string, unknown>;
  cooldownMinutes?: number;
}

export interface UpdateRuleInput {
  name?: string;
  description?: string;
  triggerConditions?: Record<string, unknown>;
  actionConfig?: Record<string, unknown>;
  isEnabled?: boolean;
  cooldownMinutes?: number;
}

// Trigger display info
export const TRIGGER_INFO: Record<AutomationTrigger, { label: string; description: string; icon: string }> = {
  member_joined: {
    label: "Member Joined",
    description: "When a new member joins the clan",
    icon: "👋",
  },
  member_left: {
    label: "Member Left",
    description: "When a member leaves the clan",
    icon: "🚪",
  },
  match_scheduled: {
    label: "Match Scheduled",
    description: "When a new match is scheduled",
    icon: "📅",
  },
  match_completed: {
    label: "Match Completed",
    description: "When a match finishes",
    icon: "🏁",
  },
  tournament_created: {
    label: "Tournament Created",
    description: "When a new tournament is created",
    icon: "🏆",
  },
  achievement_unlocked: {
    label: "Achievement Unlocked",
    description: "When a member earns an achievement",
    icon: "🎖️",
  },
  level_milestone: {
    label: "Level Milestone",
    description: "When a member reaches a level milestone",
    icon: "⬆️",
  },
  weekly_summary: {
    label: "Weekly Summary",
    description: "Sends a weekly summary of clan activity",
    icon: "📊",
  },
};

// Action display info
export const ACTION_INFO: Record<AutomationAction, { label: string; description: string; icon: string; requiresDiscord: boolean }> = {
  send_discord_message: {
    label: "Send Discord Message",
    description: "Send a message to a Discord channel",
    icon: "💬",
    requiresDiscord: true,
  },
  send_notification: {
    label: "Send Notification",
    description: "Send an in-app notification to members",
    icon: "🔔",
    requiresDiscord: false,
  },
  assign_role: {
    label: "Assign Role",
    description: "Assign a Discord role to a member",
    icon: "🏷️",
    requiresDiscord: true,
  },
  update_channel_topic: {
    label: "Update Channel Topic",
    description: "Update a Discord channel's topic",
    icon: "📝",
    requiresDiscord: true,
  },
  create_event: {
    label: "Create Event",
    description: "Create a scheduled event in Discord",
    icon: "📆",
    requiresDiscord: true,
  },
  post_announcement: {
    label: "Post Announcement",
    description: "Post an announcement to the clan",
    icon: "📢",
    requiresDiscord: false,
  },
};

// Fetch automation rules
async function fetchRules(clanId: string) {
  const response = await fetch(`/api/automation/rules?clan_id=${clanId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch rules");
  }
  return response.json();
}

// Create rule
async function createRule(input: CreateRuleInput) {
  const response = await fetch("/api/automation/rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create rule");
  }
  return response.json();
}

// Update rule
async function updateRule({ ruleId, ...updates }: UpdateRuleInput & { ruleId: string }) {
  const response = await fetch(`/api/automation/rules/${ruleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update rule");
  }
  return response.json();
}

// Delete rule
async function deleteRule(ruleId: string) {
  const response = await fetch(`/api/automation/rules/${ruleId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete rule");
  }
  return response.json();
}

// Fetch single rule with logs
async function fetchRule(ruleId: string) {
  const response = await fetch(`/api/automation/rules/${ruleId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch rule");
  }
  return response.json();
}

// Hooks
export function useAutomationRules(clanId: string) {
  return useQuery<{
    rules: AutomationRule[];
    discordConnected: boolean;
    discordGuild: DiscordGuildConnection | null;
  }>({
    queryKey: ["automation-rules", clanId],
    queryFn: () => fetchRules(clanId),
    enabled: !!clanId,
  });
}

export function useAutomationRule(ruleId: string) {
  return useQuery<{
    rule: AutomationRule;
    logs: AutomationLog[];
    canEdit: boolean;
  }>({
    queryKey: ["automation-rule", ruleId],
    queryFn: () => fetchRule(ruleId),
    enabled: !!ruleId,
  });
}

export function useCreateRule(clanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", clanId] });
    },
  });
}

export function useUpdateRule(clanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRule,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", clanId] });
      queryClient.invalidateQueries({ queryKey: ["automation-rule", variables.ruleId] });
    },
  });
}

export function useDeleteRule(clanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", clanId] });
    },
  });
}

export function useToggleRule(clanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, isEnabled }: { ruleId: string; isEnabled: boolean }) =>
      updateRule({ ruleId, isEnabled }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", clanId] });
      queryClient.invalidateQueries({ queryKey: ["automation-rule", variables.ruleId] });
    },
  });
}
