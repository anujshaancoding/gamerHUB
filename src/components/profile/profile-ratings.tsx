"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Smile,
  Users,
  Crown,
  MessageCircle,
  Clock,
  Award,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { RatingModal } from "@/components/ratings/rating-modal";
import { useAuth } from "@/lib/hooks/useAuth";
import { useGameTheme } from "@/components/profile/game-theme-provider";
import type { Profile, TraitEndorsementStats } from "@/types/database";

interface ProfileRatingsProps {
  traits: TraitEndorsementStats;
  profile: Profile;
  isOwnProfile: boolean;
}

interface TraitDisplayConfig {
  key: keyof Omit<TraitEndorsementStats, "totalEndorsers">;
  label: string;
  icon: React.ElementType;
  color: string;
}

const traitConfig: TraitDisplayConfig[] = [
  { key: "friendly", label: "Friendly", icon: Smile, color: "#00ff88" },
  { key: "teamPlayer", label: "Team Player", icon: Users, color: "#00d4ff" },
  { key: "leader", label: "Leader", icon: Crown, color: "#ff00ff" },
  {
    key: "communicative",
    label: "Communicative",
    icon: MessageCircle,
    color: "#ffaa00",
  },
  { key: "reliable", label: "Reliable", icon: Clock, color: "#ff6b6b" },
];

function TraitBar({
  label,
  count,
  total,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  count: number;
  total: number;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-text-secondary">
          <Icon className="h-4 w-4" style={{ color }} />
          {label}
        </span>
        <span className="text-text-muted text-xs">
          <span className="font-bold text-text">{count}</span>
          {total > 0 && (
            <span className="ml-1">
              ({Math.round(percentage)}%)
            </span>
          )}
        </span>
      </div>
      <div className="h-2.5 bg-surface rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
          className="h-full rounded-full relative overflow-hidden"
          style={{
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 10px ${color}50`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[xp-shine_2s_ease-in-out_infinite]" />
        </motion.div>
      </div>
    </motion.div>
  );
}

export function ProfileRatings({
  traits,
  profile,
  isOwnProfile,
}: ProfileRatingsProps) {
  const { user } = useAuth();
  const [showEndorseModal, setShowEndorseModal] = useState(false);

  // Sort traits by endorsement count (most endorsed first)
  const sortedTraits = [...traitConfig].sort(
    (a, b) => (traits[b.key] || 0) - (traits[a.key] || 0)
  );

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="gaming-card-border overflow-hidden h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                Player Traits
              </span>
              {traits.totalEndorsers > 0 && (
                <span className="text-xs text-text-muted font-normal">
                  {traits.totalEndorsers} endorser
                  {traits.totalEndorsers !== 1 ? "s" : ""}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {traits.totalEndorsers > 0 ? (
                <>
                  {/* Trait Bars */}
                  <div className="space-y-4">
                    {sortedTraits.map((config, index) => (
                      <TraitBar
                        key={config.key}
                        label={config.label}
                        count={traits[config.key] || 0}
                        total={traits.totalEndorsers}
                        icon={config.icon}
                        color={config.color}
                        delay={0.1 + index * 0.1}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-surface-light flex items-center justify-center">
                    <Award className="h-8 w-8 text-text-muted" />
                  </div>
                  <p className="text-text-muted text-sm">No endorsements yet</p>
                  <p className="text-text-dim text-xs mt-1">
                    Play with others to earn trait endorsements
                  </p>
                </div>
              )}

              {/* Endorse Button */}
              {!isOwnProfile && user && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="pt-3 border-t border-border"
                >
                  <Button
                    variant="outline"
                    onClick={() => setShowEndorseModal(true)}
                    className="w-full hover:border-primary hover:text-primary transition-colors"
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Endorse Player
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Endorsement Modal */}
      {showEndorseModal && user && (
        <RatingModal
          isOpen={showEndorseModal}
          onClose={() => setShowEndorseModal(false)}
          player={profile}
          currentUserId={user.id}
        />
      )}
    </>
  );
}
