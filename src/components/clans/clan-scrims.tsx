"use client";

import { useState } from "react";
import {
  Swords,
  Plus,
  Clock,
  Users,
  Eye,
  EyeOff,
  Check,
  HelpCircle,
  X,
  Calendar,
  Gamepad2,
  Trash2,
  Copy,
  Radio,
} from "lucide-react";
import { Card, Button, Badge, Modal, Input, Avatar } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";
import { useClanScrims, type ClanScrim } from "@/lib/hooks/useClanScrims";
import type { ClanMemberRole } from "@/types/database";

interface ClanScrimsProps {
  clanId: string;
  userRole: ClanMemberRole | null;
  userId: string | null;
  games?: { id: string; name: string }[];
}

export function ClanScrims({
  clanId,
  userRole,
  userId,
  games,
}: ClanScrimsProps) {
  const {
    scrims,
    upcomingScrims,
    liveScrims,
    completedScrims,
    loading,
    createScrim,
    creatingScrim,
    rsvp,
    rsvping,
    updateScrim,
    deleteScrim,
  } = useClanScrims(clanId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const canCreate =
    userRole === "leader" ||
    userRole === "co_leader" ||
    userRole === "officer";
  const isMember = !!userRole;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-surface-light rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text flex items-center gap-2">
          <Swords className="h-4 w-4 text-accent" />
          Scrim Scheduler
        </h3>
        {canCreate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus className="h-3 w-3" />}
          >
            Schedule
          </Button>
        )}
      </div>

      {/* Live scrims */}
      {liveScrims.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-error flex items-center gap-1">
            <Radio className="h-3 w-3" />
            LIVE NOW
          </p>
          {liveScrims.map((scrim) => (
            <ScrimCard
              key={scrim.id}
              scrim={scrim}
              userId={userId}
              isMember={isMember}
              canManage={canCreate}
              onRsvp={rsvp}
              rsvping={rsvping}
              onUpdate={updateScrim}
              onDelete={deleteScrim}
            />
          ))}
        </div>
      )}

      {/* Upcoming scrims */}
      {upcomingScrims.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-muted">UPCOMING</p>
          {upcomingScrims.map((scrim) => (
            <ScrimCard
              key={scrim.id}
              scrim={scrim}
              userId={userId}
              isMember={isMember}
              canManage={canCreate}
              onRsvp={rsvp}
              rsvping={rsvping}
              onUpdate={updateScrim}
              onDelete={deleteScrim}
            />
          ))}
        </div>
      )}

      {/* Completed scrims */}
      {completedScrims.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-muted">COMPLETED</p>
          {completedScrims.slice(0, 3).map((scrim) => (
            <ScrimCard
              key={scrim.id}
              scrim={scrim}
              userId={userId}
              isMember={isMember}
              canManage={canCreate}
              onRsvp={rsvp}
              rsvping={rsvping}
              onUpdate={updateScrim}
              onDelete={deleteScrim}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {scrims.length === 0 && (
        <Card className="p-6 text-center">
          <Swords className="h-8 w-8 mx-auto text-text-muted mb-2" />
          <p className="text-text-muted text-sm">No scrims scheduled</p>
          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="h-3 w-3" />}
            >
              Schedule First Scrim
            </Button>
          )}
        </Card>
      )}

      {/* Create Scrim Modal */}
      <CreateScrimModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={async (data) => {
          await createScrim(data);
          setShowCreateModal(false);
        }}
        creating={creatingScrim}
        games={games}
      />
    </div>
  );
}

interface ScrimCardProps {
  scrim: ClanScrim;
  userId: string | null;
  isMember: boolean;
  canManage: boolean;
  onRsvp: (args: {
    scrimId: string;
    status: "confirmed" | "maybe" | "declined";
  }) => Promise<unknown>;
  rsvping: boolean;
  onUpdate: (args: {
    scrimId: string;
    updates: Record<string, unknown>;
  }) => Promise<unknown>;
  onDelete: (scrimId: string) => Promise<unknown>;
}

function ScrimCard({
  scrim,
  userId,
  isMember,
  canManage,
  onRsvp,
  rsvping,
  onUpdate,
  onDelete,
}: ScrimCardProps) {
  const [showRoom, setShowRoom] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const scheduledDate = new Date(scrim.scheduled_at);
  const isUpcoming = scrim.status === "upcoming";
  const isLive = scrim.status === "live";
  const isPast = scrim.status === "completed" || scrim.status === "cancelled";

  const statusColors: Record<string, string> = {
    upcoming: "bg-primary/10 text-primary",
    live: "bg-error/10 text-error",
    completed: "bg-success/10 text-success",
    cancelled: "bg-surface-light text-text-muted",
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card
      className={`p-4 ${isLive ? "border-error/30 bg-error/5" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm text-text">{scrim.title}</h4>
            <Badge
              className={`text-[10px] ${statusColors[scrim.status] || ""}`}
            >
              {scrim.status === "live" && (
                <Radio className="h-2.5 w-2.5 mr-0.5" />
              )}
              {scrim.status.charAt(0).toUpperCase() + scrim.status.slice(1)}
            </Badge>
            {scrim.game && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Gamepad2 className="h-2.5 w-2.5" />
                {scrim.game.name}
              </Badge>
            )}
          </div>

          {scrim.description && (
            <p className="text-xs text-text-muted mt-1">{scrim.description}</p>
          )}

          {/* Time & slots */}
          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {scheduledDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              {scheduledDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {scrim.participant_count}/{scrim.max_slots} slots
            </span>
            {!isPast && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(scrim.scheduled_at)}
              </span>
            )}
          </div>

          {/* Participants avatars */}
          {scrim.participants && scrim.participants.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex -space-x-2">
                {scrim.participants
                  .filter((p) => p.status === "confirmed")
                  .slice(0, 6)
                  .map((p) => (
                    <Avatar
                      key={p.user_id}
                      src={p.profile?.avatar_url}
                      alt={p.profile?.username || ""}
                      size="xs"
                      className="ring-2 ring-background"
                    />
                  ))}
              </div>
              {scrim.participant_count > 6 && (
                <span className="text-xs text-text-muted ml-1">
                  +{scrim.participant_count - 6}
                </span>
              )}
            </div>
          )}

          {/* Room details (only visible after RSVP) */}
          {scrim.has_rsvp && (scrim.room_id || scrim.room_password) && (
            <div className="mt-2 p-2 bg-surface-light rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-text flex items-center gap-1">
                  {showRoom ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                  Room Details
                </p>
                <button
                  onClick={() => setShowRoom(!showRoom)}
                  className="text-xs text-primary"
                >
                  {showRoom ? "Hide" : "Show"}
                </button>
              </div>
              {showRoom && (
                <div className="mt-1 space-y-1">
                  {scrim.room_id && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">ID:</span>
                      <code className="text-xs text-text bg-surface px-1.5 py-0.5 rounded">
                        {scrim.room_id}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(scrim.room_id!, "room_id")
                        }
                        className="text-text-muted hover:text-primary"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      {copied === "room_id" && (
                        <span className="text-[10px] text-success">
                          Copied!
                        </span>
                      )}
                    </div>
                  )}
                  {scrim.room_password && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">Pass:</span>
                      <code className="text-xs text-text bg-surface px-1.5 py-0.5 rounded">
                        {scrim.room_password}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(scrim.room_password!, "room_pass")
                        }
                        className="text-text-muted hover:text-primary"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      {copied === "room_pass" && (
                        <span className="text-[10px] text-success">
                          Copied!
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 ml-3">
          {isMember && isUpcoming && (
            <>
              {!scrim.has_rsvp ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    onRsvp({ scrimId: scrim.id, status: "confirmed" })
                  }
                  isLoading={rsvping}
                  className="text-xs"
                  leftIcon={<Check className="h-3 w-3" />}
                >
                  RSVP
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onRsvp({ scrimId: scrim.id, status: "declined" })
                  }
                  isLoading={rsvping}
                  className="text-xs"
                  leftIcon={<X className="h-3 w-3" />}
                >
                  Cancel
                </Button>
              )}
            </>
          )}
          {canManage && !isPast && (
            <button
              onClick={() => onDelete(scrim.id)}
              className="p-1 text-text-muted hover:text-error rounded"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

interface CreateScrimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description?: string;
    game_id?: string;
    scheduled_at: string;
    max_slots?: number;
    room_id?: string;
    room_password?: string;
  }) => Promise<void>;
  creating: boolean;
  games?: { id: string; name: string }[];
}

function CreateScrimModal({
  isOpen,
  onClose,
  onCreate,
  creating,
  games,
}: CreateScrimModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gameId, setGameId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxSlots, setMaxSlots] = useState("10");
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");

  const handleCreate = async () => {
    if (!title.trim() || !date || !time) return;
    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    await onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      game_id: gameId || undefined,
      scheduled_at: scheduledAt,
      max_slots: parseInt(maxSlots) || 10,
      room_id: roomId.trim() || undefined,
      room_password: roomPassword.trim() || undefined,
    });
    // Reset form
    setTitle("");
    setDescription("");
    setGameId("");
    setDate("");
    setTime("");
    setMaxSlots("10");
    setRoomId("");
    setRoomPassword("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Scrim"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., BGMI Custom Room #5"
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
            placeholder="Rules, format, etc."
            maxLength={300}
          />
        </div>

        {games && games.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Game
            </label>
            <select
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text"
            >
              <option value="">Select game...</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Time
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Max Slots
          </label>
          <Input
            type="number"
            value={maxSlots}
            onChange={(e) => setMaxSlots(e.target.value)}
            min={1}
            max={100}
          />
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-xs text-text-muted mb-2 flex items-center gap-1">
            <EyeOff className="h-3 w-3" />
            Room details are hidden until players RSVP
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Room ID (optional)
              </label>
              <Input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g., 123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Password (optional)
              </label>
              <Input
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="e.g., abc123"
              />
            </div>
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
            disabled={!title.trim() || !date || !time}
          >
            Schedule Scrim
          </Button>
        </div>
      </div>
    </Modal>
  );
}
