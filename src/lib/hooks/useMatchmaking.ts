"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface PlayerInfo {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  skillRating: number;
  preferredRoles?: string[];
}

interface MatchFactors {
  skillBalance: number;
  playstyleCompatibility: number;
  roleComplementarity: number;
  communicationMatch: number;
  scheduleOverlap: number;
}

interface TeammateSuggestion {
  suggestedUserIds: string[];
  suggestedUser: PlayerInfo | null;
  compatibilityScore: number;
  reasoning: string;
  matchFactors: MatchFactors;
}

interface TeamBalanceResult {
  teamA: PlayerInfo[];
  teamB: PlayerInfo[];
  balanceScore: number;
  reasoning: string;
  alternatives: Array<{
    teamA: PlayerInfo[];
    teamB: PlayerInfo[];
    score: number;
    reasoning: string;
  }>;
}

interface MatchPrediction {
  predictedWinner: "team_a" | "team_b" | "even";
  teamAWinProbability: number;
  reasoning: string;
  keyFactors: string[];
}

interface SkillProfile {
  id: string;
  userId: string;
  gameId: string;
  skillRating: number;
  aggressionScore: number;
  teamworkScore: number;
  communicationScore: number;
  consistencyScore: number;
  preferredRoles: string[];
  preferredAgents: string[];
  avgKda: number | null;
  winRate: number | null;
  recentForm: number;
  aiPlaystyleSummary: string | null;
  aiStrengths: string[] | null;
  aiWeaknesses: string[] | null;
  gamesPlayed: number;
}

// API functions
async function fetchSkillProfile(gameId: string): Promise<SkillProfile | null> {
  const res = await fetch(`/api/matchmaking/profile?gameId=${gameId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch skill profile");
  return res.json();
}

async function updateSkillProfile(
  gameId: string,
  data: Partial<SkillProfile>
): Promise<SkillProfile> {
  const res = await fetch("/api/matchmaking/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, ...data }),
  });
  if (!res.ok) throw new Error("Failed to update skill profile");
  return res.json();
}

async function suggestTeammates(
  gameId: string,
  numSuggestions: number = 5
): Promise<{ suggestions: TeammateSuggestion[] }> {
  const res = await fetch("/api/matchmaking/suggest-teammates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, numSuggestions }),
  });
  if (!res.ok) throw new Error("Failed to get teammate suggestions");
  return res.json();
}

async function suggestOpponents(
  gameId: string,
  numSuggestions: number = 5
): Promise<{ suggestions: TeammateSuggestion[] }> {
  const res = await fetch("/api/matchmaking/suggest-opponents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, numSuggestions }),
  });
  if (!res.ok) throw new Error("Failed to get opponent suggestions");
  return res.json();
}

async function balanceTeams(
  playerIds: string[],
  gameId: string
): Promise<TeamBalanceResult> {
  const res = await fetch("/api/matchmaking/team-balance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerIds, gameId }),
  });
  if (!res.ok) throw new Error("Failed to balance teams");
  return res.json();
}

async function predictOutcome(
  teamAIds: string[],
  teamBIds: string[],
  gameId: string
): Promise<{ prediction: MatchPrediction }> {
  const res = await fetch("/api/matchmaking/predict-outcome", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamAIds, teamBIds, gameId }),
  });
  if (!res.ok) throw new Error("Failed to predict outcome");
  return res.json();
}

// Hooks
export function useSkillProfile(gameId: string) {
  return useQuery({
    queryKey: ["skill-profile", gameId],
    queryFn: () => fetchSkillProfile(gameId),
    enabled: !!gameId,
  });
}

export function useUpdateSkillProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, data }: { gameId: string; data: Partial<SkillProfile> }) =>
      updateSkillProfile(gameId, data),
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: ["skill-profile", gameId] });
    },
  });
}

export function useSuggestTeammates(gameId: string) {
  return useMutation({
    mutationFn: (numSuggestions?: number) =>
      suggestTeammates(gameId, numSuggestions),
  });
}

export function useSuggestOpponents(gameId: string) {
  return useMutation({
    mutationFn: (numSuggestions?: number) =>
      suggestOpponents(gameId, numSuggestions),
  });
}

export function useTeamBalance(gameId: string) {
  return useMutation({
    mutationFn: (playerIds: string[]) => balanceTeams(playerIds, gameId),
  });
}

export function usePredictOutcome(gameId: string) {
  return useMutation({
    mutationFn: ({
      teamAIds,
      teamBIds,
    }: {
      teamAIds: string[];
      teamBIds: string[];
    }) => predictOutcome(teamAIds, teamBIds, gameId),
  });
}

// Helper to format skill rating
export function formatSkillRating(rating: number): string {
  if (rating >= 2500) return "Grandmaster";
  if (rating >= 2200) return "Master";
  if (rating >= 2000) return "Diamond";
  if (rating >= 1800) return "Platinum";
  if (rating >= 1600) return "Gold";
  if (rating >= 1400) return "Silver";
  if (rating >= 1200) return "Bronze";
  return "Iron";
}

export function getSkillColor(rating: number): string {
  if (rating >= 2500) return "text-red-400";
  if (rating >= 2200) return "text-purple-400";
  if (rating >= 2000) return "text-cyan-400";
  if (rating >= 1800) return "text-emerald-400";
  if (rating >= 1600) return "text-yellow-400";
  if (rating >= 1400) return "text-zinc-400";
  if (rating >= 1200) return "text-amber-600";
  return "text-stone-500";
}
