"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  MapPin,
  Globe,
  Trophy,
  Swords,
  Gamepad2,
  UserPlus,
  Lock,
  Mail,
  Shield,
} from "lucide-react";
import { Card, Avatar, Badge, Button, Modal } from "@/components/ui";
import type { Clan, Game, ClanGame } from "@/types/database";

interface ClanWithDetails extends Clan {
  primary_game: Game | null;
  clan_games?: (ClanGame & { game: Game })[];
  member_count: number;
}

interface ClanCardProps {
  clan: ClanWithDetails;
  onJoinRequest?: () => void;
}

export function ClanCard({ clan, onJoinRequest }: ClanCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const stats = clan.stats as { challenges_won?: number; total_matches?: number } | null;
  const joinType = clan.join_type || (clan.settings as any)?.join_type || "closed";

  return (
    <>
      <Card
        variant="interactive"
        className="h-full"
        onClick={() => setShowPreview(true)}
      >
        <div className="flex gap-4">
          {/* Avatar */}
          <Avatar
            src={clan.avatar_url}
            alt={clan.name}
            size="lg"
            fallback={clan.tag}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-text truncate">{clan.name}</h3>
              <Badge variant="outline" size="sm">
                [{clan.tag}]
              </Badge>
              {(clan.clan_level || 1) > 0 && (
                <Badge variant="primary" size="sm" className="gap-0.5">
                  <Shield className="h-2.5 w-2.5" />
                  {clan.clan_level || 1}
                </Badge>
              )}
            </div>
            {clan.description && (
              <p className="text-sm text-text-muted line-clamp-2 mt-1">
                {clan.description}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {clan.member_count}/{clan.max_members}
              </span>
              {clan.region && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {clan.region}
                </span>
              )}
              {clan.language && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {clan.language.toUpperCase()}
                </span>
              )}
            </div>

            {/* Primary Game */}
            {clan.primary_game && (
              <div className="mt-3">
                <Badge variant="primary" size="sm" className="gap-1">
                  <Gamepad2 className="h-3 w-3" />
                  {clan.primary_game.name}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <div className="flex gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-warning" />
              {stats?.challenges_won || 0} wins
            </span>
            <span className="flex items-center gap-1">
              <Swords className="h-3 w-3 text-accent" />
              {stats?.total_matches || 0} matches
            </span>
          </div>
          <div className="flex gap-1.5">
            {/* Join Type Badge */}
            {joinType === "open" && (
              <Badge variant="success" size="sm" className="gap-0.5">
                <Globe className="h-2.5 w-2.5" />
                Open
              </Badge>
            )}
            {joinType === "invite_only" && (
              <Badge variant="default" size="sm" className="gap-0.5">
                <Mail className="h-2.5 w-2.5" />
                Invite
              </Badge>
            )}
            {joinType === "closed" && (
              <Badge variant="warning" size="sm" className="gap-0.5">
                <Lock className="h-2.5 w-2.5" />
                Closed
              </Badge>
            )}
            {clan.is_recruiting && (
              <Badge variant="success" size="sm">
                Recruiting
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Clan Preview"
        size="md"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar
              src={clan.avatar_url}
              alt={clan.name}
              size="xl"
              fallback={clan.tag}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-text">{clan.name}</h3>
                <Badge variant="outline">[{clan.tag}]</Badge>
                {joinType === "open" && (
                  <Badge variant="success" size="sm" className="gap-0.5">
                    <Globe className="h-3 w-3" /> Open
                  </Badge>
                )}
                {joinType === "invite_only" && (
                  <Badge variant="default" size="sm" className="gap-0.5">
                    <Mail className="h-3 w-3" /> Invite Only
                  </Badge>
                )}
                {joinType === "closed" && (
                  <Badge variant="warning" size="sm" className="gap-0.5">
                    <Lock className="h-3 w-3" /> Closed
                  </Badge>
                )}
              </div>
              {clan.description && (
                <p className="text-text-secondary mt-2 text-sm">
                  {clan.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-surface-light rounded-lg">
              <Users className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-text">
                {clan.member_count}/{clan.max_members}
              </p>
              <p className="text-xs text-text-muted">Members</p>
            </div>
            <div className="text-center p-3 bg-surface-light rounded-lg">
              <Trophy className="h-5 w-5 mx-auto text-warning mb-1" />
              <p className="text-lg font-bold text-text">
                {stats?.challenges_won || 0}
              </p>
              <p className="text-xs text-text-muted">Wins</p>
            </div>
            <div className="text-center p-3 bg-surface-light rounded-lg">
              <Swords className="h-5 w-5 mx-auto text-accent mb-1" />
              <p className="text-lg font-bold text-text">
                {stats?.total_matches || 0}
              </p>
              <p className="text-xs text-text-muted">Matches</p>
            </div>
          </div>

          {/* Games */}
          {clan.clan_games && clan.clan_games.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-2">
                Games
              </h4>
              <div className="flex flex-wrap gap-2">
                {clan.clan_games.map((cg) => (
                  <Badge
                    key={cg.id}
                    variant={cg.is_primary ? "primary" : "outline"}
                    className="gap-1"
                  >
                    <Gamepad2 className="h-3 w-3" />
                    {cg.game?.name || "Unknown"}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex flex-wrap gap-3 text-sm text-text-muted">
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
            {clan.min_rank_requirement && (
              <span className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                Min: {clan.min_rank_requirement}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Link href={`/clans/${clan.slug}`} className="flex-1">
              <Button variant="outline" className="w-full">
                View Clan
              </Button>
            </Link>
            {clan.is_recruiting && onJoinRequest && (
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoinRequest();
                  setShowPreview(false);
                }}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Request to Join
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
