"use client";

import { useState } from "react";
import {
  Target,
  Trophy,
  Plus,
  Trash2,
  ChevronUp,
  Zap,
  CheckCircle,
  Flame,
} from "lucide-react";
import { Card, Button, Badge, Modal, Input } from "@/components/ui";
import {
  useClanMissions,
  type ClanMission,
} from "@/lib/hooks/useClanMissions";
import type { ClanMemberRole } from "@/types/database";

const GOAL_TYPE_LABELS: Record<string, string> = {
  matches_played: "Matches Played",
  wins: "Wins",
  members_online: "Members Online",
  wall_posts: "Wall Posts",
  scrims_played: "Scrims Played",
  custom: "Custom Goal",
};

const GOAL_TYPE_ICONS: Record<string, typeof Target> = {
  matches_played: Target,
  wins: Trophy,
  members_online: Zap,
  wall_posts: Flame,
  scrims_played: Target,
  custom: Target,
};

interface ClanMissionsProps {
  clanId: string;
  userRole: ClanMemberRole | null;
}

export function ClanMissions({ clanId, userRole }: ClanMissionsProps) {
  const {
    missions,
    activeMissions,
    completedMissions,
    weekStart,
    loading,
    createMission,
    creatingMission,
    contribute,
    contributing,
    deleteMission,
  } = useClanMissions(clanId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const canManage = userRole === "leader" || userRole === "co_leader";
  const isMember = !!userRole;

  // Calculate week end for display
  const weekEndDate = weekStart
    ? (() => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 6);
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      })()
    : null;
  const weekStartDisplay = weekStart
    ? new Date(weekStart).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-surface-light rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Weekly Missions
          </h3>
          {weekStartDisplay && weekEndDate && (
            <p className="text-xs text-text-muted mt-0.5">
              {weekStartDisplay} - {weekEndDate}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {activeMissions.length} active
          </Badge>
          {canManage && missions.length < 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="h-3 w-3" />}
            >
              Add
            </Button>
          )}
        </div>
      </div>

      {/* Mission list */}
      {missions.length === 0 ? (
        <Card className="p-6 text-center">
          <Target className="h-8 w-8 mx-auto text-text-muted mb-2" />
          <p className="text-text-muted text-sm">No missions this week</p>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="h-3 w-3" />}
            >
              Create First Mission
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              canManage={canManage}
              isMember={isMember}
              contributing={contributing}
              onContribute={(amount) =>
                contribute({ missionId: mission.id, amount })
              }
              onDelete={() => deleteMission(mission.id)}
            />
          ))}
        </div>
      )}

      {/* Create Mission Modal */}
      <CreateMissionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={async (data) => {
          await createMission(data);
          setShowCreateModal(false);
        }}
        creating={creatingMission}
      />
    </div>
  );
}

interface MissionCardProps {
  mission: ClanMission;
  canManage: boolean;
  isMember: boolean;
  contributing: boolean;
  onContribute: (amount?: number) => void;
  onDelete: () => void;
}

function MissionCard({
  mission,
  canManage,
  isMember,
  contributing,
  onContribute,
  onDelete,
}: MissionCardProps) {
  const progress = Math.min(
    (mission.current_progress / mission.goal_target) * 100,
    100
  );
  const Icon =
    GOAL_TYPE_ICONS[mission.goal_type] || Target;

  return (
    <Card
      className={`p-4 ${mission.is_completed ? "border-success/30 bg-success/5" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-lg ${
            mission.is_completed
              ? "bg-success/10 text-success"
              : "bg-primary/10 text-primary"
          }`}
        >
          {mission.is_completed ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm text-text">
                {mission.title}
              </h4>
              {mission.is_completed && (
                <Badge variant="success" className="text-[10px]">
                  Completed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="primary" className="text-[10px] gap-0.5">
                <Zap className="h-2.5 w-2.5" />
                {mission.xp_reward} XP
              </Badge>
              {canManage && !mission.is_completed && (
                <button
                  onClick={onDelete}
                  className="p-1 text-text-muted hover:text-error rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {mission.description && (
            <p className="text-xs text-text-muted mt-0.5">
              {mission.description}
            </p>
          )}

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-muted">
                {GOAL_TYPE_LABELS[mission.goal_type] || mission.goal_type}
              </span>
              <span className="text-text font-medium">
                {mission.current_progress}/{mission.goal_target}
              </span>
            </div>
            <div className="h-2 bg-surface-light rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  mission.is_completed ? "bg-success" : "bg-primary"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Contribute button */}
          {isMember && !mission.is_completed && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onContribute(1)}
                isLoading={contributing}
                leftIcon={<ChevronUp className="h-3 w-3" />}
                className="text-xs"
              >
                +1 Progress
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface CreateMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description?: string;
    goal_type: string;
    goal_target: number;
    xp_reward?: number;
  }) => Promise<void>;
  creating: boolean;
}

function CreateMissionModal({
  isOpen,
  onClose,
  onCreate,
  creating,
}: CreateMissionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState("custom");
  const [goalTarget, setGoalTarget] = useState("10");
  const [xpReward, setXpReward] = useState("50");

  const handleCreate = async () => {
    if (!title.trim()) return;
    await onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      goal_type: goalType,
      goal_target: parseInt(goalTarget) || 10,
      xp_reward: parseInt(xpReward) || 50,
    });
    setTitle("");
    setDescription("");
    setGoalType("custom");
    setGoalTarget("10");
    setXpReward("50");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Mission" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Win 10 matches"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Description (optional)
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the mission..."
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Goal Type
          </label>
          <select
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
            className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text"
          >
            {Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Target
            </label>
            <Input
              type="number"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              min={1}
              max={10000}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              XP Reward
            </label>
            <Input
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(e.target.value)}
              min={0}
              max={1000}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            isLoading={creating}
            disabled={!title.trim()}
          >
            Create Mission
          </Button>
        </div>
      </div>
    </Modal>
  );
}
