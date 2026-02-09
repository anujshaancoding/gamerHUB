"use client";

import { motion } from "framer-motion";
import {
  X,
  Download,
  Share2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  MessageCircle,
  Calendar,
  Trophy,
  BookOpen,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DNARadarChart } from "./DNARadarChart";
import {
  type DNATraits,
  type DNATraitCategory,
  DNA_CATEGORIES,
  calculateCompatibility,
  analyzeSquadBalance,
  getChemistryColor,
  getChemistryEmoji,
} from "@/types/squad-dna";

interface SquadMember {
  id: string;
  username: string;
  avatar_url?: string;
  traits: DNATraits;
}

interface ChemistryReportProps {
  members: SquadMember[];
  onClose: () => void;
}

export function ChemistryReport({ members, onClose }: ChemistryReportProps) {
  // Calculate all pairwise compatibility scores
  const pairwiseScores: Array<{
    member1: SquadMember;
    member2: SquadMember;
    result: ReturnType<typeof calculateCompatibility>;
  }> = [];

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const result = calculateCompatibility(members[i].traits, members[j].traits);
      pairwiseScores.push({
        member1: members[i],
        member2: members[j],
        result,
      });
    }
  }

  // Overall team chemistry
  const overallChemistry =
    pairwiseScores.reduce((sum, p) => sum + p.result.overallScore, 0) /
    pairwiseScores.length;

  // Squad balance
  const balance = analyzeSquadBalance(members.map((m) => m.traits));

  // Get best and worst pairs
  const sortedPairs = [...pairwiseScores].sort(
    (a, b) => b.result.overallScore - a.result.overallScore
  );
  const bestPair = sortedPairs[0];
  const worstPair = sortedPairs[sortedPairs.length - 1];

  // Category coverage
  const categoryCoverage: Record<DNATraitCategory, number> = {
    playstyle: 0,
    communication: 0,
    schedule: 0,
    competitiveness: 0,
    social: 0,
    learning: 0,
  };

  Object.keys(categoryCoverage).forEach((cat) => {
    const category = cat as DNATraitCategory;
    const uniqueTraits = new Set(members.flatMap((m) => m.traits[category] || []));
    categoryCoverage[category] = Math.min(uniqueTraits.size * 20, 100);
  });

  // Combined traits for team radar
  const combinedTraits: DNATraits = {
    playstyle: [...new Set(members.flatMap((m) => m.traits.playstyle || []))],
    communication: [...new Set(members.flatMap((m) => m.traits.communication || []))],
    schedule: [...new Set(members.flatMap((m) => m.traits.schedule || []))],
    competitiveness: [...new Set(members.flatMap((m) => m.traits.competitiveness || []))],
    social: [...new Set(members.flatMap((m) => m.traits.social || []))],
    learning: [...new Set(members.flatMap((m) => m.traits.learning || []))],
  };

  const getCategoryIcon = (category: DNATraitCategory) => {
    const icons: Record<DNATraitCategory, React.ElementType> = {
      playstyle: Target,
      communication: MessageCircle,
      schedule: Calendar,
      competitiveness: Trophy,
      social: Heart,
      learning: BookOpen,
    };
    return icons[category];
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "Squad Chemistry Report",
        text: `Our squad has ${Math.round(overallChemistry)}% chemistry! ${getChemistryEmoji(
          overallChemistry >= 80
            ? "perfect"
            : overallChemistry >= 60
            ? "great"
            : overallChemistry >= 40
            ? "good"
            : "developing"
        )}`,
        url: window.location.href,
      });
    } catch {
      // Share API not available or user cancelled
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card rounded-2xl border border-border max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Squad Chemistry Report</h2>
              <p className="text-sm text-muted-foreground">
                {members.length} members analyzed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex flex-col items-center"
            >
              <div
                className="w-40 h-40 rounded-full flex flex-col items-center justify-center text-4xl font-bold border-4"
                style={{
                  borderColor: getChemistryColor(
                    overallChemistry >= 80
                      ? "perfect"
                      : overallChemistry >= 60
                      ? "great"
                      : overallChemistry >= 40
                      ? "good"
                      : "developing"
                  ),
                  backgroundColor: `${getChemistryColor(
                    overallChemistry >= 80
                      ? "perfect"
                      : overallChemistry >= 60
                      ? "great"
                      : overallChemistry >= 40
                      ? "good"
                      : "developing"
                  )}10`,
                }}
              >
                <span
                  style={{
                    color: getChemistryColor(
                      overallChemistry >= 80
                        ? "perfect"
                        : overallChemistry >= 60
                        ? "great"
                        : overallChemistry >= 40
                        ? "good"
                        : "developing"
                    ),
                  }}
                >
                  {Math.round(overallChemistry)}%
                </span>
                <span className="text-2xl">
                  {getChemistryEmoji(
                    overallChemistry >= 80
                      ? "perfect"
                      : overallChemistry >= 60
                      ? "great"
                      : overallChemistry >= 40
                      ? "good"
                      : "developing"
                  )}
                </span>
              </div>
              <p className="mt-2 text-lg font-medium capitalize">
                {overallChemistry >= 80
                  ? "Perfect"
                  : overallChemistry >= 60
                  ? "Great"
                  : overallChemistry >= 40
                  ? "Good"
                  : "Developing"}{" "}
                Chemistry
              </p>
            </motion.div>
          </div>

          {/* Team DNA Radar */}
          <div className="bg-muted/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Combined Team DNA
            </h3>
            <div className="flex justify-center">
              <DNARadarChart traits={combinedTraits} size={280} />
            </div>
          </div>

          {/* Category Coverage */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Category Coverage</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(categoryCoverage).map(([cat, score]) => {
                const category = cat as DNATraitCategory;
                const Icon = getCategoryIcon(category);
                return (
                  <div
                    key={category}
                    className="bg-muted/30 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon
                        className="h-4 w-4"
                        style={{ color: DNA_CATEGORIES[category].color }}
                      />
                      <span className="text-sm font-medium">
                        {DNA_CATEGORIES[category].name}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: DNA_CATEGORIES[category].color }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{score}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best & Worst Pairs */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Best Pair */}
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h4 className="font-semibold text-green-500">Best Chemistry</h4>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-bold">
                    {bestPair.member1.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm">+</span>
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-bold">
                    {bestPair.member2.username?.[0]?.toUpperCase()}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-500">
                    {bestPair.result.overallScore}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bestPair.member1.username} & {bestPair.member2.username}
                  </p>
                </div>
              </div>
              {bestPair.result.strengths.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {bestPair.result.strengths.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Needs Work Pair */}
            {worstPair && worstPair !== bestPair && (
              <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                  <h4 className="font-semibold text-orange-500">Needs Work</h4>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-sm font-bold">
                      {worstPair.member1.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm">+</span>
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-sm font-bold">
                      {worstPair.member2.username?.[0]?.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-500">
                      {worstPair.result.overallScore}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {worstPair.member1.username} & {worstPair.member2.username}
                    </p>
                  </div>
                </div>
                {worstPair.result.weaknesses.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {worstPair.result.weaknesses.slice(0, 3).map((w) => (
                      <span
                        key={w}
                        className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-500 rounded-full"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* All Pairwise Scores */}
          <div>
            <h3 className="text-lg font-semibold mb-4">All Member Combinations</h3>
            <div className="space-y-2">
              {sortedPairs.map((pair, idx) => (
                <motion.div
                  key={`${pair.member1.id}-${pair.member2.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">
                      {idx + 1}.
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {pair.member1.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm">{pair.member1.username}</span>
                    </div>
                    <span className="text-muted-foreground">+</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {pair.member2.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm">{pair.member2.username}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-bold"
                      style={{ color: getChemistryColor(pair.result.chemistry) }}
                    >
                      {pair.result.overallScore}%
                    </span>
                    <span>{getChemistryEmoji(pair.result.chemistry)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Strengths & Gaps */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-500">
                Team Strengths
              </h3>
              <div className="space-y-2">
                {balance.strengths.length > 0 ? (
                  balance.strengths.map((s) => (
                    <div
                      key={s}
                      className="px-3 py-2 bg-green-500/10 text-green-500 rounded-lg text-sm"
                    >
                      {s}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Build your squad to identify strengths
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-orange-500">
                Areas to Develop
              </h3>
              <div className="space-y-2">
                {balance.gaps.length > 0 ? (
                  balance.gaps.map((g) => (
                    <div
                      key={g}
                      className="px-3 py-2 bg-orange-500/10 text-orange-500 rounded-lg text-sm"
                    >
                      {g}
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
          {balance.recommendations.length > 0 && (
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {balance.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-primary font-bold">{idx + 1}.</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
