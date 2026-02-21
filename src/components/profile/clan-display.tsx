"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Shield, ChevronRight, Crown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Avatar } from "@/components/ui";
import { useGameTheme } from "@/components/profile/game-theme-provider";

interface ClanMembership {
  id: string;
  role: string;
  joined_at: string;
  clan: {
    id: string;
    name: string;
    tag: string;
    slug: string;
    avatar_url: string | null;
    banner_url: string | null;
  };
}

interface ClanDisplayProps {
  memberships: ClanMembership[];
}

const roleConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  leader: { label: "Leader", color: "#FFD700", icon: Crown },
  co_leader: { label: "Co-Leader", color: "#FF6B00", icon: Shield },
  elder: { label: "Elder", color: "#A855F7", icon: Shield },
  officer: { label: "Officer", color: "#3B82F6", icon: Shield },
  member: { label: "Member", color: "#22C55E", icon: Users },
};

export function ClanDisplay({ memberships }: ClanDisplayProps) {
  const { theme } = useGameTheme();

  if (memberships.length === 0) {
    return (
      <Card className="gaming-card-border h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20` }}>
              <Users className="h-5 w-5" style={{ color: theme.colors.primary }} />
            </div>
            Clan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Users className="h-10 w-10 text-text-muted mx-auto mb-2 opacity-40" />
            <p className="text-text-muted text-sm">Not in a clan yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show primary clan (first) prominently, others smaller
  const [primary, ...others] = memberships;

  return (
    <Card className="gaming-card-border overflow-hidden h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20` }}>
            <Users className="h-5 w-5" style={{ color: theme.colors.primary }} />
          </div>
          Clan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Primary clan */}
          <ClanCard membership={primary} featured />

          {/* Other clans */}
          {others.map((m) => (
            <ClanCard key={m.id} membership={m} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ClanCard({ membership, featured = false }: { membership: ClanMembership; featured?: boolean }) {
  const { theme } = useGameTheme();
  const role = roleConfig[membership.role] ?? roleConfig.member;
  const RoleIcon = role.icon;

  return (
    <Link href={`/clans/${membership.clan.slug}`}>
      <motion.div
        whileHover={{ scale: 1.02, x: 4 }}
        className={`
          flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group
          ${featured
            ? "border-border bg-surface-light/50"
            : "border-transparent hover:border-border hover:bg-surface-light/30"
          }
        `}
        style={featured ? {
          borderColor: `${theme.colors.primary}30`,
          boxShadow: `0 0 12px ${theme.colors.glow}`,
        } : undefined}
      >
        {/* Clan avatar */}
        <Avatar
          src={membership.clan.avatar_url}
          alt={membership.clan.name}
          size={featured ? "lg" : "md"}
          className="ring-2 ring-border"
        />

        {/* Clan info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-bold text-text truncate ${featured ? "text-base" : "text-sm"}`}>
              {membership.clan.name}
            </p>
            <span className="text-xs text-text-muted font-mono">[{membership.clan.tag}]</span>
          </div>
          {/* Role badge */}
          <div className="flex items-center gap-1.5 mt-1">
            <RoleIcon className="h-3 w-3" style={{ color: role.color }} />
            <span className="text-xs font-medium" style={{ color: role.color }}>
              {role.label}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    </Link>
  );
}
