import type { Database } from "./database";

// Database row types
export type SquadDNAProfile = Database["public"]["Tables"]["squad_dna_profiles"]["Row"];
export type SquadCompatibility = Database["public"]["Tables"]["squad_compatibility"]["Row"];
export type SquadMatchRequest = Database["public"]["Tables"]["squad_match_requests"]["Row"];

// DNA trait categories
export type DNATraitCategory =
  | "playstyle"
  | "communication"
  | "schedule"
  | "competitiveness"
  | "social"
  | "learning";

// Individual traits within categories
export type PlaystyleTrait = "aggressive" | "defensive" | "supportive" | "adaptive" | "strategic";
export type CommunicationTrait = "vocal" | "callouts_only" | "listener" | "igl" | "minimal";
export type ScheduleTrait = "weekday_morning" | "weekday_evening" | "weekend" | "late_night" | "flexible";
export type CompetitiveTrait = "casual" | "ranked_grind" | "tournament" | "pro" | "for_fun";
export type SocialTrait = "chill" | "focused" | "memey" | "toxic_ok" | "positive_only";
export type LearningTrait = "coach_me" | "self_learner" | "mentor" | "peer_learning" | "vod_reviewer";

// Complete DNA profile structure
export interface DNATraits {
  playstyle: PlaystyleTrait[];
  communication: CommunicationTrait[];
  schedule: ScheduleTrait[];
  competitiveness: CompetitiveTrait[];
  social: SocialTrait[];
  learning: LearningTrait[];
}

// Trait weights for matching (0-100)
export interface DNAWeights {
  playstyle: number;
  communication: number;
  schedule: number;
  competitiveness: number;
  social: number;
  learning: number;
}

// Trait display info
export const DNA_CATEGORIES: Record<DNATraitCategory, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  playstyle: {
    name: "Playstyle",
    description: "How you approach the game tactically",
    icon: "crosshair",
    color: "#EF4444",
  },
  communication: {
    name: "Communication",
    description: "How you interact with teammates",
    icon: "message-circle",
    color: "#3B82F6",
  },
  schedule: {
    name: "Schedule",
    description: "When you're available to play",
    icon: "calendar",
    color: "#10B981",
  },
  competitiveness: {
    name: "Competitiveness",
    description: "Your gaming intensity level",
    icon: "trophy",
    color: "#F59E0B",
  },
  social: {
    name: "Social Vibe",
    description: "The atmosphere you prefer",
    icon: "users",
    color: "#8B5CF6",
  },
  learning: {
    name: "Learning Style",
    description: "How you improve at games",
    icon: "book-open",
    color: "#EC4899",
  },
};

export const PLAYSTYLE_TRAITS: Record<PlaystyleTrait, { name: string; description: string }> = {
  aggressive: { name: "Aggressive", description: "Push first, ask questions later" },
  defensive: { name: "Defensive", description: "Hold angles and play safe" },
  supportive: { name: "Supportive", description: "Enable teammates to shine" },
  adaptive: { name: "Adaptive", description: "Change style based on situation" },
  strategic: { name: "Strategic", description: "Methodical and calculated" },
};

export const COMMUNICATION_TRAITS: Record<CommunicationTrait, { name: string; description: string }> = {
  vocal: { name: "Very Vocal", description: "Constant comms, always talking" },
  callouts_only: { name: "Callouts Only", description: "Essential info, no fluff" },
  listener: { name: "Good Listener", description: "Prefer receiving info" },
  igl: { name: "IGL", description: "Like to lead and make calls" },
  minimal: { name: "Minimal", description: "Prefer less voice chat" },
};

export const SCHEDULE_TRAITS: Record<ScheduleTrait, { name: string; description: string }> = {
  weekday_morning: { name: "Weekday Mornings", description: "Before noon on weekdays" },
  weekday_evening: { name: "Weekday Evenings", description: "After 6pm on weekdays" },
  weekend: { name: "Weekends", description: "Saturday and Sunday" },
  late_night: { name: "Late Night", description: "After midnight" },
  flexible: { name: "Flexible", description: "Available most times" },
};

export const COMPETITIVE_TRAITS: Record<CompetitiveTrait, { name: string; description: string }> = {
  casual: { name: "Casual", description: "Just here for fun" },
  ranked_grind: { name: "Ranked Grind", description: "Climbing the ladder" },
  tournament: { name: "Tournament", description: "Competitive events" },
  pro: { name: "Pro/Semi-Pro", description: "Serious competition" },
  for_fun: { name: "For Fun", description: "Winning is a bonus" },
};

export const SOCIAL_TRAITS: Record<SocialTrait, { name: string; description: string }> = {
  chill: { name: "Chill", description: "Relaxed and easygoing" },
  focused: { name: "Focused", description: "All business during games" },
  memey: { name: "Meme-y", description: "Jokes and good times" },
  toxic_ok: { name: "Toxicity OK", description: "Can handle some salt" },
  positive_only: { name: "Positive Only", description: "Good vibes required" },
};

export const LEARNING_TRAITS: Record<LearningTrait, { name: string; description: string }> = {
  coach_me: { name: "Coach Me", description: "Open to being coached" },
  self_learner: { name: "Self Learner", description: "Figure it out myself" },
  mentor: { name: "Mentor", description: "Like helping others improve" },
  peer_learning: { name: "Peer Learning", description: "Learn together as equals" },
  vod_reviewer: { name: "VOD Reviewer", description: "Analyze gameplay footage" },
};

// Compatibility calculation
export interface CompatibilityResult {
  overallScore: number; // 0-100
  categoryScores: Record<DNATraitCategory, number>;
  strengths: string[];
  weaknesses: string[];
  chemistry: "poor" | "okay" | "good" | "great" | "perfect";
}

// Squad analysis
export interface SquadAnalysis {
  squadId: string;
  members: {
    id: string;
    username: string;
    avatar_url?: string;
    dna: DNATraits;
  }[];
  teamCompatibility: number;
  roleBalance: {
    hasIGL: boolean;
    hasSupportive: boolean;
    hasAggressive: boolean;
    scheduleOverlap: number;
  };
  recommendations: string[];
  missingTraits: string[];
}

// Player match suggestion
export interface PlayerMatch {
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  compatibility: CompatibilityResult;
  dnaProfile: DNATraits;
  commonGames: string[];
  mutualConnections?: number;
}

// API request/response types
export interface CreateDNAProfileRequest {
  traits: DNATraits;
  weights?: DNAWeights;
  game_id?: string;
}

export interface UpdateDNAProfileRequest {
  traits?: Partial<DNATraits>;
  weights?: Partial<DNAWeights>;
}

export interface FindPlayersRequest {
  gameId?: string;
  minCompatibility?: number;
  limit?: number;
  prioritizeCategory?: DNATraitCategory;
}

export interface AnalyzeSquadRequest {
  userIds: string[];
  gameId?: string;
}

// Helper functions
export function calculateCompatibility(
  profile1: DNATraits,
  profile2: DNATraits,
  weights1?: DNAWeights,
  weights2?: DNAWeights
): CompatibilityResult {
  const defaultWeights: DNAWeights = {
    playstyle: 80,
    communication: 90,
    schedule: 100,
    competitiveness: 85,
    social: 75,
    learning: 60,
  };

  const w1 = weights1 || defaultWeights;
  const w2 = weights2 || defaultWeights;

  // Average weights
  const avgWeights: DNAWeights = {
    playstyle: (w1.playstyle + w2.playstyle) / 2,
    communication: (w1.communication + w2.communication) / 2,
    schedule: (w1.schedule + w2.schedule) / 2,
    competitiveness: (w1.competitiveness + w2.competitiveness) / 2,
    social: (w1.social + w2.social) / 2,
    learning: (w1.learning + w2.learning) / 2,
  };

  const categoryScores: Record<DNATraitCategory, number> = {
    playstyle: calculateTraitOverlap(profile1.playstyle, profile2.playstyle),
    communication: calculateTraitOverlap(profile1.communication, profile2.communication),
    schedule: calculateTraitOverlap(profile1.schedule, profile2.schedule),
    competitiveness: calculateTraitOverlap(profile1.competitiveness, profile2.competitiveness),
    social: calculateTraitOverlap(profile1.social, profile2.social),
    learning: calculateTraitOverlap(profile1.learning, profile2.learning),
  };

  // Weighted average
  const totalWeight = Object.values(avgWeights).reduce((a, b) => a + b, 0);
  let weightedSum = 0;
  for (const cat of Object.keys(categoryScores) as DNATraitCategory[]) {
    weightedSum += categoryScores[cat] * avgWeights[cat];
  }
  const overallScore = Math.round(weightedSum / totalWeight);

  // Determine strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const [cat, score] of Object.entries(categoryScores)) {
    if (score >= 80) {
      strengths.push(DNA_CATEGORIES[cat as DNATraitCategory].name);
    } else if (score < 40) {
      weaknesses.push(DNA_CATEGORIES[cat as DNATraitCategory].name);
    }
  }

  // Determine chemistry level
  let chemistry: CompatibilityResult["chemistry"];
  if (overallScore >= 90) chemistry = "perfect";
  else if (overallScore >= 75) chemistry = "great";
  else if (overallScore >= 60) chemistry = "good";
  else if (overallScore >= 40) chemistry = "okay";
  else chemistry = "poor";

  return {
    overallScore,
    categoryScores,
    strengths,
    weaknesses,
    chemistry,
  };
}

function calculateTraitOverlap(traits1: string[], traits2: string[]): number {
  if (traits1.length === 0 || traits2.length === 0) return 50;

  const set1 = new Set(traits1);
  const set2 = new Set(traits2);
  const intersection = traits1.filter((t) => set2.has(t)).length;
  const union = new Set([...traits1, ...traits2]).size;

  // Jaccard similarity * 100
  return Math.round((intersection / union) * 100);
}

export function getChemistryColor(chemistry: CompatibilityResult["chemistry"]): string {
  const colors: Record<CompatibilityResult["chemistry"], string> = {
    perfect: "#22C55E",
    great: "#84CC16",
    good: "#3B82F6",
    okay: "#F59E0B",
    poor: "#EF4444",
  };
  return colors[chemistry];
}

export function getChemistryEmoji(chemistry: CompatibilityResult["chemistry"]): string {
  const emojis: Record<CompatibilityResult["chemistry"], string> = {
    perfect: "🔥",
    great: "⭐",
    good: "👍",
    okay: "🤔",
    poor: "😬",
  };
  return emojis[chemistry];
}

// Default DNA profile for new users
export const DEFAULT_DNA_PROFILE: DNATraits = {
  playstyle: ["adaptive"],
  communication: ["callouts_only"],
  schedule: ["flexible"],
  competitiveness: ["ranked_grind"],
  social: ["chill"],
  learning: ["peer_learning"],
};

export const DEFAULT_DNA_WEIGHTS: DNAWeights = {
  playstyle: 80,
  communication: 90,
  schedule: 100,
  competitiveness: 85,
  social: 75,
  learning: 60,
};

// All DNA traits organized by category for UI selection
export const DNA_TRAITS: Record<DNATraitCategory, Array<{ id: string; label: string; description: string }>> = {
  playstyle: [
    { id: "aggressive", label: "Aggressive", description: "Push first, ask questions later" },
    { id: "defensive", label: "Defensive", description: "Hold angles and play safe" },
    { id: "supportive", label: "Supportive", description: "Enable teammates to shine" },
    { id: "adaptive", label: "Adaptive", description: "Change style based on situation" },
    { id: "strategic", label: "Strategic", description: "Methodical and calculated" },
  ],
  communication: [
    { id: "vocal", label: "Very Vocal", description: "Constant comms, always talking" },
    { id: "callouts_only", label: "Callouts Only", description: "Essential info, no fluff" },
    { id: "listener", label: "Good Listener", description: "Prefer receiving info" },
    { id: "igl", label: "IGL", description: "Like to lead and make calls" },
    { id: "minimal", label: "Minimal", description: "Prefer less voice chat" },
  ],
  schedule: [
    { id: "weekday_morning", label: "Weekday Mornings", description: "Before noon on weekdays" },
    { id: "weekday_evening", label: "Weekday Evenings", description: "After 6pm on weekdays" },
    { id: "weekend", label: "Weekends", description: "Saturday and Sunday" },
    { id: "late_night", label: "Late Night", description: "After midnight" },
    { id: "flexible", label: "Flexible", description: "Available most times" },
  ],
  competitiveness: [
    { id: "casual", label: "Casual", description: "Just here for fun" },
    { id: "ranked_grind", label: "Ranked Grind", description: "Climbing the ladder" },
    { id: "tournament", label: "Tournament", description: "Competitive events" },
    { id: "pro", label: "Pro/Semi-Pro", description: "Serious competition" },
    { id: "for_fun", label: "For Fun", description: "Winning is a bonus" },
  ],
  social: [
    { id: "chill", label: "Chill", description: "Relaxed and easygoing" },
    { id: "focused", label: "Focused", description: "All business during games" },
    { id: "memey", label: "Meme-y", description: "Jokes and good times" },
    { id: "toxic_ok", label: "Toxicity OK", description: "Can handle some salt" },
    { id: "positive_only", label: "Positive Only", description: "Good vibes required" },
  ],
  learning: [
    { id: "coach_me", label: "Coach Me", description: "Open to being coached" },
    { id: "self_learner", label: "Self Learner", description: "Figure it out myself" },
    { id: "mentor", label: "Mentor", description: "Like helping others improve" },
    { id: "peer_learning", label: "Peer Learning", description: "Learn together as equals" },
    { id: "vod_reviewer", label: "VOD Reviewer", description: "Analyze gameplay footage" },
  ],
};

// Squad balance analysis
export interface SquadBalance {
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  roleDistribution: Record<string, number>;
}

export function analyzeSquadBalance(memberTraits: DNATraits[]): SquadBalance {
  const strengths: string[] = [];
  const gaps: string[] = [];
  const recommendations: string[] = [];
  const roleDistribution: Record<string, number> = {};

  if (memberTraits.length < 2) {
    return { strengths, gaps, recommendations: ["Add more members to analyze"], roleDistribution };
  }

  // Count trait occurrences across all members
  const traitCounts: Record<DNATraitCategory, Record<string, number>> = {
    playstyle: {},
    communication: {},
    schedule: {},
    competitiveness: {},
    social: {},
    learning: {},
  };

  for (const traits of memberTraits) {
    for (const category of Object.keys(traitCounts) as DNATraitCategory[]) {
      for (const trait of traits[category] || []) {
        traitCounts[category][trait] = (traitCounts[category][trait] || 0) + 1;
      }
    }
  }

  // Analyze playstyle balance
  const playstyles = traitCounts.playstyle;
  if (playstyles.aggressive && playstyles.aggressive >= memberTraits.length * 0.5) {
    if (!playstyles.supportive || playstyles.supportive < 1) {
      gaps.push("No supportive players");
      recommendations.push("Consider adding a support-focused player for team balance");
    } else {
      strengths.push("Balanced aggression and support");
    }
  }
  if (playstyles.supportive && playstyles.supportive >= 2) {
    strengths.push("Strong support presence");
  }
  if (playstyles.strategic && playstyles.strategic >= 1) {
    strengths.push("Strategic mindset on team");
  }

  // Analyze communication
  const comms = traitCounts.communication;
  if (comms.igl && comms.igl >= 1) {
    strengths.push("Has in-game leader");
    if (comms.igl > 1) {
      gaps.push("Multiple IGLs may cause conflicts");
      recommendations.push("Clarify leadership roles to avoid confusion");
    }
  } else {
    gaps.push("No designated IGL");
    recommendations.push("Consider having someone take the IGL role");
  }
  if (comms.listener && comms.listener >= memberTraits.length * 0.5 && !comms.vocal) {
    gaps.push("Too many listeners, not enough callers");
    recommendations.push("Need more vocal players for better communication");
  }

  // Analyze schedule overlap
  const schedules = traitCounts.schedule;
  const scheduleKeys = Object.keys(schedules);
  if (scheduleKeys.length === 1 || schedules.flexible >= memberTraits.length * 0.5) {
    strengths.push("Good schedule alignment");
  } else if (scheduleKeys.length >= 3 && !schedules.flexible) {
    gaps.push("Scattered schedules");
    recommendations.push("Finding practice times may be difficult");
  }

  // Analyze competitiveness alignment
  const competitive = traitCounts.competitiveness;
  const compKeys = Object.keys(competitive);
  if (compKeys.length === 1) {
    strengths.push("Aligned competitive goals");
  } else if (competitive.casual && (competitive.tournament || competitive.pro)) {
    gaps.push("Mixed competitive expectations");
    recommendations.push("Align on whether sessions are casual or serious");
  }

  // Analyze social vibe
  const social = traitCounts.social;
  if (social.positive_only && social.toxic_ok) {
    gaps.push("Conflicting toxicity tolerance");
    recommendations.push("Set clear expectations about team atmosphere");
  }
  if (social.chill && social.chill >= memberTraits.length * 0.6) {
    strengths.push("Relaxed team atmosphere");
  }
  if (social.focused && social.focused >= memberTraits.length * 0.6) {
    strengths.push("Highly focused team");
  }

  // Analyze learning
  const learning = traitCounts.learning;
  if (learning.mentor && learning.coach_me) {
    strengths.push("Good mentorship dynamic");
  }
  if (learning.vod_reviewer && learning.vod_reviewer >= 1) {
    strengths.push("VOD review capability");
  }

  // Role distribution
  roleDistribution.aggressive = playstyles.aggressive || 0;
  roleDistribution.supportive = playstyles.supportive || 0;
  roleDistribution.igl = comms.igl || 0;
  roleDistribution.flexible_schedule = schedules.flexible || 0;

  return { strengths, gaps, recommendations, roleDistribution };
}
