"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  X,
  Search,
  Loader2,
  UserPlus,
  Sparkles,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DNARadarChart, CompatibilityScore } from "./DNARadarChart";
import { ChemistryReport } from "./ChemistryReport";
import {
  type DNATraits,
  type CompatibilityResult,
  calculateCompatibility,
  analyzeSquadBalance,
} from "@/types/squad-dna";

interface SquadMember {
  id: string;
  username: string;
  avatar_url?: string;
  traits: DNATraits;
}

interface SquadAnalyzerProps {
  currentUserTraits: DNATraits;
  currentUserId: string;
  currentUsername: string;
  onFindPlayers?: () => void;
}

export function SquadAnalyzer({
  currentUserTraits,
  currentUserId,
  currentUsername,
  onFindPlayers,
}: SquadAnalyzerProps) {
  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([
    {
      id: currentUserId,
      username: currentUsername,
      traits: currentUserTraits,
    },
  ]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SquadMember[]>([]);
  const [showReport, setShowReport] = useState(false);

  // Calculate team chemistry
  const calculateTeamChemistry = (): {
    averageScore: number;
    pairwiseScores: Array<{
      member1: string;
      member2: string;
      score: number;
      chemistry: CompatibilityResult["chemistry"];
    }>;
  } => {
    if (squadMembers.length < 2) {
      return { averageScore: 0, pairwiseScores: [] };
    }

    const pairwiseScores: Array<{
      member1: string;
      member2: string;
      score: number;
      chemistry: CompatibilityResult["chemistry"];
    }> = [];

    for (let i = 0; i < squadMembers.length; i++) {
      for (let j = i + 1; j < squadMembers.length; j++) {
        const result = calculateCompatibility(
          squadMembers[i].traits,
          squadMembers[j].traits
        );
        pairwiseScores.push({
          member1: squadMembers[i].username,
          member2: squadMembers[j].username,
          score: result.overallScore,
          chemistry: result.chemistry,
        });
      }
    }

    const averageScore =
      pairwiseScores.reduce((sum, p) => sum + p.score, 0) / pairwiseScores.length;

    return { averageScore, pairwiseScores };
  };

  const { averageScore, pairwiseScores } = calculateTeamChemistry();

  // Get squad balance analysis
  const squadBalance = analyzeSquadBalance(squadMembers.map((m) => m.traits));

  // Search for players (mock - would call API)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/squad-dna/find-players?search=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(
          data.players.filter(
            (p: SquadMember) => !squadMembers.some((m) => m.id === p.id)
          )
        );
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addMember = (member: SquadMember) => {
    if (squadMembers.length >= 6) return;
    setSquadMembers([...squadMembers, member]);
    setSearchResults(searchResults.filter((r) => r.id !== member.id));
    setSearchQuery("");
  };

  const removeMember = (memberId: string) => {
    if (memberId === currentUserId) return; // Can't remove self
    setSquadMembers(squadMembers.filter((m) => m.id !== memberId));
  };

  // Combine all traits for team radar
  const combinedTraits: DNATraits = {
    playstyle: [...new Set(squadMembers.flatMap((m) => m.traits.playstyle || []))],
    communication: [...new Set(squadMembers.flatMap((m) => m.traits.communication || []))],
    schedule: [...new Set(squadMembers.flatMap((m) => m.traits.schedule || []))],
    competitiveness: [...new Set(squadMembers.flatMap((m) => m.traits.competitiveness || []))],
    social: [...new Set(squadMembers.flatMap((m) => m.traits.social || []))],
    learning: [...new Set(squadMembers.flatMap((m) => m.traits.learning || []))],
  };

  return (
    <div className="space-y-6">
      {/* Squad Members */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Squad Members ({squadMembers.length}/6)
          </h3>
          {squadMembers.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReport(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              View Report
            </Button>
          )}
        </div>

        {/* Member Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {squadMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-muted/50 rounded-lg p-3"
            >
              {member.id !== currentUserId && (
                <button
                  onClick={() => removeMember(member.id)}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    member.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{member.username}</p>
                  {index === 0 && (
                    <span className="text-xs text-primary">You</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add Member Button */}
          {squadMembers.length < 6 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={onFindPlayers}
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-3 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm">Add Player</span>
            </motion.button>
          )}
        </div>

        {/* Search for players */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search players by username..."
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-2"
            >
              {searchResults.map((player) => {
                const compatibility = calculateCompatibility(
                  currentUserTraits,
                  player.traits
                );
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                        {player.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{player.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {compatibility.overallScore}% compatible
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addMember(player)}
                      disabled={squadMembers.length >= 6}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Team Chemistry Overview */}
      {squadMembers.length >= 2 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Team Radar */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Team DNA Profile</h3>
            <DNARadarChart traits={combinedTraits} size={220} />
          </div>

          {/* Chemistry Score */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Team Chemistry</h3>
            <div className="flex flex-col items-center">
              <div
                className="w-32 h-32 rounded-full flex flex-col items-center justify-center text-3xl font-bold"
                style={{
                  background: `conic-gradient(from 0deg, ${
                    averageScore >= 80
                      ? "#22c55e"
                      : averageScore >= 60
                      ? "#3b82f6"
                      : averageScore >= 40
                      ? "#f59e0b"
                      : "#ef4444"
                  } ${averageScore}%, transparent ${averageScore}%)`,
                }}
              >
                <div className="w-28 h-28 rounded-full bg-card flex flex-col items-center justify-center">
                  <span>{Math.round(averageScore)}%</span>
                  <span className="text-xs text-muted-foreground">Chemistry</span>
                </div>
              </div>

              {/* Pairwise scores */}
              <div className="mt-4 w-full space-y-2">
                {pairwiseScores.slice(0, 3).map((pair, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {pair.member1} + {pair.member2}
                    </span>
                    <span
                      className={
                        pair.score >= 80
                          ? "text-green-500"
                          : pair.score >= 60
                          ? "text-blue-500"
                          : pair.score >= 40
                          ? "text-yellow-500"
                          : "text-red-500"
                      }
                    >
                      {pair.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Squad Balance */}
      {squadMembers.length >= 2 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Squad Balance Analysis</h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div>
              <h4 className="text-sm font-medium text-green-500 flex items-center gap-2 mb-3">
                <Check className="h-4 w-4" />
                Team Strengths
              </h4>
              <div className="space-y-2">
                {squadBalance.strengths.length > 0 ? (
                  squadBalance.strengths.map((strength) => (
                    <div
                      key={strength}
                      className="px-3 py-2 bg-green-500/10 text-green-500 rounded-lg text-sm"
                    >
                      {strength}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Add more members to see strengths
                  </p>
                )}
              </div>
            </div>

            {/* Gaps */}
            <div>
              <h4 className="text-sm font-medium text-orange-500 flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4" />
                Areas to Improve
              </h4>
              <div className="space-y-2">
                {squadBalance.gaps.length > 0 ? (
                  squadBalance.gaps.map((gap) => (
                    <div
                      key={gap}
                      className="px-3 py-2 bg-orange-500/10 text-orange-500 rounded-lg text-sm"
                    >
                      {gap}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your team is well balanced!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {squadBalance.recommendations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {squadBalance.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Chemistry Report Modal */}
      <AnimatePresence>
        {showReport && squadMembers.length >= 2 && (
          <ChemistryReport
            members={squadMembers}
            onClose={() => setShowReport(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
