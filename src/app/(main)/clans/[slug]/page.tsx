"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Activity,
  UserPlus,
  Shield,
  Globe,
  Lock,
  Mail,
  Crown,
  Star,
  User,
  LogOut,
  ArrowUp,
  ArrowDown,
  UserMinus,
  Clock,
} from "lucide-react";
import { Card, Button, Badge, Avatar } from "@/components/ui";
import { ClanHeader } from "@/components/clans/clan-header";
import { ClanMemberCard } from "@/components/clans/clan-member-card";
import { ClanJoinModal } from "@/components/clans/clan-join-modal";
import { ClanInviteModal } from "@/components/clans/clan-invite-modal";
import { ClanSettingsModal } from "@/components/clans/clan-settings-modal";
import { useClan } from "@/lib/hooks/useClan";
import { useClanMembers } from "@/lib/hooks/useClanMembers";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelativeTime } from "@/lib/utils";
import { queryKeys, STALE_TIMES } from "@/lib/query/provider";
import type { ClanMemberRole, ClanActivityLog } from "@/types/database";

type Tab = "members" | "activity";

export default function ClanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();

  const { clan, loading: clanLoading, refetch: refetchClan, updateClan, deleteClan } = useClan(slug);
  const {
    members,
    loading: membersLoading,
    updateMemberRole,
    removeMember,
    refetch: refetchMembers,
  } = useClanMembers(clan?.id || null);

  const supabase = useMemo(() => createClient(), []);

  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [joiningOpen, setJoiningOpen] = useState(false);

  // Find current user's membership in this clan
  // Check both useClanMembers (API) and clan.clan_members (nested from useClan) as fallback
  const currentMember = members.find((m) => m.user_id === user?.id);
  const clanMemberFallback = !currentMember && user && clan
    ? (clan as any).clan_members?.find((m: any) => m.user_id === user.id)
    : null;
  const effectiveMember = currentMember || clanMemberFallback;
  const userRole = (effectiveMember?.role as ClanMemberRole) || null;
  const isMember = !!effectiveMember;
  const canInvite =
    userRole === "leader" ||
    userRole === "co_leader" ||
    userRole === "officer";

  // Fetch activity log with React Query — cached
  const { data: activityLog = [], isLoading: activityLoading } = useQuery({
    queryKey: queryKeys.clanActivity(clan?.id || ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clan_activity_log")
        .select("*")
        .eq("clan_id", clan!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw new Error(error.message);
      return (data as ClanActivityLog[]) || [];
    },
    staleTime: STALE_TIMES.CLAN_ACTIVITY,
    enabled: activeTab === "activity" && !!clan?.id && isMember,
  });

  const handleJoinOpen = async () => {
    if (!clan?.id || !user) return;
    setJoiningOpen(true);
    try {
      const response = await fetch(`/api/clans/${clan.id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "request" }),
      });
      const data = await response.json();
      if (response.ok) {
        refetchClan();
        refetchMembers();
      }
    } catch {
      // Join failed
    } finally {
      setJoiningOpen(false);
    }
  };

  const handleJoinRequest = async (message?: string) => {
    if (!clan?.id) return { error: new Error("No clan") };
    try {
      const response = await fetch(`/api/clans/${clan.id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "request", message }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: new Error(data.error) };
      }
      return {};
    } catch {
      return { error: new Error("Failed to submit request") };
    }
  };

  const handleInvite = async (userId: string, message?: string) => {
    if (!clan?.id) return { error: new Error("No clan") };
    try {
      const response = await fetch(`/api/clans/${clan.id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "invite", user_id: userId, message }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: new Error(data.error) };
      }
      return {};
    } catch {
      return { error: new Error("Failed to send invite") };
    }
  };

  const handleLeave = async () => {
    if (!clan?.id || !user) return;
    const response = await fetch(
      `/api/clans/${clan.id}/members/${user.id}`,
      { method: "DELETE" }
    );
    const data = await response.json();
    if (response.ok) {
      if (data.clan_deleted) {
        router.push("/clans");
      } else {
        refetchClan();
        refetchMembers();
      }
    }
  };

  if (clanLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="h-48 bg-surface-light rounded-xl animate-pulse" />
        <div className="h-64 bg-surface-light rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!clan) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Card className="p-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            Clan not found
          </h3>
          <p className="text-text-muted mb-4">
            This clan may have been disbanded or the link is incorrect.
          </p>
          <Button variant="primary" onClick={() => router.push("/clans")}>
            Browse Clans
          </Button>
        </Card>
      </div>
    );
  }

  const joinType = clan.join_type || (clan.settings as any)?.join_type || "closed";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Clan Header */}
      <ClanHeader
        clan={{ ...clan, member_count: members.length }}
        userRole={userRole}
        onRequestJoin={
          !isMember && joinType === "closed" && clan.is_recruiting
            ? () => setShowJoinModal(true)
            : undefined
        }
        onLeave={isMember && userRole !== "leader" ? handleLeave : undefined}
        onOpenSettings={
          userRole === "leader" || userRole === "co_leader"
            ? () => setShowSettingsModal(true)
            : undefined
        }
      />

      {/* Join Actions for non-members */}
      {!isMember && user && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {joinType === "open" && (
                <>
                  <Globe className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm font-medium text-text">Open Clan</p>
                    <p className="text-xs text-text-muted">Anyone can join this clan</p>
                  </div>
                </>
              )}
              {joinType === "closed" && (
                <>
                  <Lock className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-sm font-medium text-text">Closed Clan</p>
                    <p className="text-xs text-text-muted">Send a request to join, officers will review</p>
                  </div>
                </>
              )}
              {joinType === "invite_only" && (
                <>
                  <Mail className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-text">Invite Only</p>
                    <p className="text-xs text-text-muted">You can only join if invited by a clan officer</p>
                  </div>
                </>
              )}
            </div>
            {joinType === "open" && (
              <Button
                variant="primary"
                onClick={handleJoinOpen}
                isLoading={joiningOpen}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Join Clan
              </Button>
            )}
            {joinType === "closed" && clan.is_recruiting && (
              <Button
                variant="primary"
                onClick={() => setShowJoinModal(true)}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Request to Join
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Clan Level */}
      {(clan.clan_level || 1) > 0 && (
        <div className="flex items-center gap-4">
          <Badge variant="primary" className="gap-1 px-3 py-1">
            <Shield className="h-3 w-3" />
            Level {clan.clan_level || 1}
          </Badge>
          <div className="flex-1 bg-surface-light rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${((clan.clan_xp || 0) % 1000) / 10}%` }}
            />
          </div>
          <span className="text-xs text-text-muted">{clan.clan_xp || 0} XP</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("members")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors border-b-2",
            activeTab === "members"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text"
          )}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Members ({members.length})
        </button>
        {isMember && (
          <button
            onClick={() => setActiveTab("activity")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2",
              activeTab === "activity"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            )}
          >
            <Activity className="h-4 w-4 inline mr-2" />
            Activity Log
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {/* Invite Button for officers */}
          {canInvite && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteModal(true)}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Invite Players
              </Button>
            </div>
          )}

          {membersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-surface-light rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : members.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-8 w-8 mx-auto text-text-muted mb-2" />
              <p className="text-text-muted">No members yet</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <ClanMemberCard
                  key={member.id}
                  member={member as any}
                  currentUserRole={userRole}
                  onUpdateRole={
                    userRole === "leader" || userRole === "co_leader"
                      ? (userId, role) => updateMemberRole(userId, role)
                      : undefined
                  }
                  onRemove={
                    userRole === "leader" || userRole === "co_leader"
                      ? (userId) => removeMember(userId)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "activity" && isMember && (
        <div className="space-y-3">
          {activityLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-surface-light rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : activityLog.length === 0 ? (
            <Card className="p-8 text-center">
              <Activity className="h-8 w-8 mx-auto text-text-muted mb-2" />
              <p className="text-text-muted">No activity yet</p>
            </Card>
          ) : (
            activityLog.map((entry) => (
              <ActivityLogEntry key={entry.id} entry={entry} />
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {clan && (
        <>
          <ClanJoinModal
            isOpen={showJoinModal}
            onClose={() => setShowJoinModal(false)}
            clan={clan}
            onSubmit={handleJoinRequest}
          />
          {canInvite && (
            <ClanInviteModal
              isOpen={showInviteModal}
              onClose={() => setShowInviteModal(false)}
              clanId={clan.id}
              onInvite={handleInvite}
            />
          )}
          {(userRole === "leader" || userRole === "co_leader") && (
            <ClanSettingsModal
              isOpen={showSettingsModal}
              onClose={() => setShowSettingsModal(false)}
              clan={clan}
              onUpdate={async (updates) => {
                const result = await updateClan(updates);
                if (!result.error) {
                  refetchClan();
                }
                return result;
              }}
              onDelete={
                userRole === "leader"
                  ? async () => {
                      const result = await deleteClan();
                      if (!result.error) {
                        router.push("/clans");
                      }
                      return result;
                    }
                  : undefined
              }
              isLeader={userRole === "leader"}
            />
          )}
        </>
      )}
    </div>
  );
}

// Activity log entry component
function ActivityLogEntry({ entry }: { entry: ClanActivityLog }) {
  const iconMap: Record<string, { icon: typeof Users; color: string }> = {
    member_joined: { icon: UserPlus, color: "text-success" },
    member_left: { icon: LogOut, color: "text-text-muted" },
    member_kicked: { icon: UserMinus, color: "text-error" },
    member_promoted: { icon: ArrowUp, color: "text-primary" },
    member_demoted: { icon: ArrowDown, color: "text-warning" },
    challenge_created: { icon: Shield, color: "text-accent" },
    challenge_won: { icon: Crown, color: "text-warning" },
    challenge_lost: { icon: Shield, color: "text-error" },
    achievement_earned: { icon: Star, color: "text-warning" },
    settings_updated: { icon: Activity, color: "text-text-muted" },
    clan_created: { icon: Shield, color: "text-primary" },
  };

  const config = iconMap[entry.activity_type] || {
    icon: Activity,
    color: "text-text-muted",
  };
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 bg-surface-light rounded-lg">
      <div
        className={cn(
          "p-1.5 rounded-full bg-surface",
          config.color
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text">
          {entry.description || entry.activity_type.replace(/_/g, " ")}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          <Clock className="h-3 w-3 inline mr-1" />
          {formatRelativeTime(entry.created_at)}
        </p>
      </div>
    </div>
  );
}
