"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Crown,
  Shield,
  Star,
  User,
  UserMinus,
  MessageSquare,
} from "lucide-react";
import { Card, Avatar, Badge, Button } from "@/components/ui";
import { PremiumBadge } from "@/components/premium";
import { ClanRoleBadge } from "./clan-role-badge";
import { formatRelativeTime } from "@/lib/utils";
import type { ClanMember, Profile, ClanMemberRole } from "@/types/database";

interface ClanMemberCardProps {
  member: ClanMember & { profile: Profile };
  currentUserRole?: ClanMemberRole | null;
  onUpdateRole?: (userId: string, role: ClanMemberRole) => void;
  onRemove?: (userId: string) => void;
  onMessage?: (userId: string) => void;
}

export function ClanMemberCard({
  member,
  currentUserRole,
  onUpdateRole,
  onRemove,
  onMessage,
}: ClanMemberCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const canManage =
    currentUserRole === "leader" ||
    (currentUserRole === "co_leader" && member.role !== "leader" && member.role !== "co_leader");

  const canChangeRole =
    currentUserRole === "leader" ||
    (currentUserRole === "co_leader" && member.role === "member");

  const roleOptions: { role: ClanMemberRole; label: string; icon: typeof Crown }[] = [
    { role: "co_leader", label: "Co-Leader", icon: Shield },
    { role: "officer", label: "Officer", icon: Star },
    { role: "member", label: "Member", icon: User },
  ];

  // Filter available role options based on current user's permissions
  const availableRoles = roleOptions.filter((option) => {
    if (currentUserRole === "leader") {
      return option.role !== member.role;
    }
    if (currentUserRole === "co_leader") {
      return option.role === "officer" || option.role === "member";
    }
    return false;
  });

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <Link href={`/profile/${member.profile.username}`}>
          <Avatar
            src={member.profile.avatar_url}
            alt={member.profile.display_name || member.profile.username}
            size="md"
            status={member.profile.is_online ? "online" : "offline"}
            showStatus
          />
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${member.profile.username}`}
              className="font-medium text-text hover:text-primary transition-colors truncate"
            >
              {member.profile.display_name || member.profile.username}
            </Link>
            {member.profile.is_premium && (
              <PremiumBadge size="sm" showLabel={false} animate={false} />
            )}
            <ClanRoleBadge role={member.role} size="sm" />
          </div>
          <p className="text-xs text-text-muted">
            Joined {formatRelativeTime(member.joined_at)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onMessage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMessage(member.user_id)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}

          {canManage && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg z-20 py-1">
                    {canChangeRole && (
                      <>
                        <div className="px-3 py-1.5 text-xs text-text-muted">
                          Change Role
                        </div>
                        {availableRoles.map((option) => (
                          <button
                            key={option.role}
                            className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-light flex items-center gap-2"
                            onClick={() => {
                              onUpdateRole?.(member.user_id, option.role);
                              setShowMenu(false);
                            }}
                          >
                            <option.icon className="h-4 w-4" />
                            {option.label}
                          </button>
                        ))}
                        <div className="border-t border-border my-1" />
                      </>
                    )}
                    {onRemove && (
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-error hover:bg-surface-light flex items-center gap-2"
                        onClick={() => {
                          onRemove(member.user_id);
                          setShowMenu(false);
                        }}
                      >
                        <UserMinus className="h-4 w-4" />
                        Remove from Clan
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
