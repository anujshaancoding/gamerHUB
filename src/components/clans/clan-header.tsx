"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Users,
  MapPin,
  Globe,
  Trophy,
  Swords,
  Settings,
  UserPlus,
  LogOut,
  MessageSquare,
  Crown,
  Calendar,
  Lock,
  Mail,
  Shield,
} from "lucide-react";
import { Avatar, Badge, Button, Modal } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Clan, Game, ClanMemberRole } from "@/types/database";

interface ClanHeaderProps {
  clan: Clan & { primary_game?: Game | null; member_count: number };
  userRole?: ClanMemberRole | null;
  onRequestJoin?: () => void;
  onLeave?: () => void;
  onOpenSettings?: () => void;
  onOpenChat?: () => void;
}

export function ClanHeader({
  clan,
  userRole,
  onRequestJoin,
  onLeave,
  onOpenSettings,
  onOpenChat,
}: ClanHeaderProps) {
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const stats = clan.stats as { challenges_won?: number; total_matches?: number; win_rate?: number } | null;
  const joinType = clan.join_type || (clan.settings as any)?.join_type || "closed";
  const isMember = !!userRole;
  const canManage = userRole === "leader" || userRole === "co_leader";

  return (
    <>
      <div className="relative">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-br from-primary/20 via-surface to-accent/20 rounded-xl overflow-hidden">
          {clan.banner_url && (
            <Image
              src={clan.banner_url}
              alt={`${clan.name} banner`}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative -mt-16 px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Avatar */}
            <Avatar
              src={clan.avatar_url}
              alt={clan.name}
              size="2xl"
              fallback={clan.tag}
              className="ring-4 ring-background"
            />

            {/* Info */}
            <div className="flex-1 pt-2 md:pt-8">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-text">
                  {clan.name}
                </h1>
                <Badge variant="outline" className="text-lg">
                  [{clan.tag}]
                </Badge>
                {/* Clan Level */}
                {(clan.clan_level || 1) > 0 && (
                  <Badge variant="primary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Lv. {clan.clan_level || 1}
                  </Badge>
                )}
                {/* Join Type Badge */}
                {joinType === "open" && (
                  <Badge variant="success" className="gap-1">
                    <Globe className="h-3 w-3" />
                    Open
                  </Badge>
                )}
                {joinType === "invite_only" && (
                  <Badge variant="default" className="gap-1">
                    <Mail className="h-3 w-3" />
                    Invite Only
                  </Badge>
                )}
                {joinType === "closed" && (
                  <Badge variant="warning" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Closed
                  </Badge>
                )}
                {clan.is_recruiting && (
                  <Badge variant="success">Recruiting</Badge>
                )}
              </div>

              {clan.description && (
                <p className="text-text-secondary mt-2 max-w-2xl">
                  {clan.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-text-muted">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {clan.member_count}/{clan.max_members} members
                </span>
                {clan.region && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {clan.region}
                  </span>
                )}
                {clan.language && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {clan.language.toUpperCase()}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {formatDate(clan.created_at)}
                </span>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-text">
                    {stats?.challenges_won || 0}
                  </p>
                  <p className="text-xs text-text-muted">Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-text">
                    {stats?.total_matches || 0}
                  </p>
                  <p className="text-xs text-text-muted">Matches</p>
                </div>
                {stats?.win_rate !== undefined && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {stats.win_rate}%
                    </p>
                    <p className="text-xs text-text-muted">Win Rate</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 md:pt-8">
              {isMember ? (
                <>
                  {onOpenChat && (
                    <Button
                      variant="primary"
                      onClick={onOpenChat}
                      leftIcon={<MessageSquare className="h-4 w-4" />}
                    >
                      Clan Chat
                    </Button>
                  )}
                  {canManage && onOpenSettings && (
                    <Button
                      variant="secondary"
                      onClick={onOpenSettings}
                      leftIcon={<Settings className="h-4 w-4" />}
                    >
                      Settings
                    </Button>
                  )}
                  {userRole !== "leader" && (
                    <Button
                      variant="ghost"
                      onClick={() => setShowLeaveModal(true)}
                      leftIcon={<LogOut className="h-4 w-4" />}
                    >
                      Leave Clan
                    </Button>
                  )}
                  {userRole === "leader" && (
                    <div className="flex items-center gap-1 text-xs text-warning">
                      <Crown className="h-3 w-3" />
                      You are the leader
                    </div>
                  )}
                </>
              ) : (
                <>
                  {clan.is_recruiting && onRequestJoin && (
                    <Button
                      variant="primary"
                      onClick={onRequestJoin}
                      leftIcon={<UserPlus className="h-4 w-4" />}
                    >
                      Request to Join
                    </Button>
                  )}
                  {!clan.is_recruiting && (
                    <Badge variant="default" className="justify-center">
                      Not Recruiting
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Leave Clan"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to leave <strong>{clan.name}</strong>? You
            will need to request to join again if you want to rejoin.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowLeaveModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onLeave?.();
                setShowLeaveModal(false);
              }}
            >
              Leave Clan
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
