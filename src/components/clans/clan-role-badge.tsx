"use client";

import { Crown, Shield, Star, User } from "lucide-react";
import { Badge } from "@/components/ui";
import type { ClanMemberRole } from "@/types/database";

interface ClanRoleBadgeProps {
  role: ClanMemberRole;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const roleConfig: Record<
  ClanMemberRole,
  {
    label: string;
    variant: "primary" | "secondary" | "warning" | "default";
    icon: typeof Crown;
  }
> = {
  leader: {
    label: "Leader",
    variant: "warning",
    icon: Crown,
  },
  co_leader: {
    label: "Co-Leader",
    variant: "primary",
    icon: Shield,
  },
  officer: {
    label: "Officer",
    variant: "secondary",
    icon: Star,
  },
  member: {
    label: "Member",
    variant: "default",
    icon: User,
  },
};

export function ClanRoleBadge({
  role,
  size = "sm",
  showIcon = true,
}: ClanRoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} size={size} className="gap-1">
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
