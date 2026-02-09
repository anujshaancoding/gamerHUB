import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  SquadDNAProfile,
  DNATraits,
  DNAWeights,
  CreateDNAProfileRequest,
  UpdateDNAProfileRequest,
  FindPlayersRequest,
  PlayerMatch,
  CompatibilityResult,
  AnalyzeSquadRequest,
  SquadAnalysis,
} from "@/types/squad-dna";
import { calculateCompatibility } from "@/types/squad-dna";

// Query keys
const DNA_KEYS = {
  ownProfiles: ["squad-dna", "own"] as const,
  profile: (userId: string, gameId?: string) => ["squad-dna", "profile", userId, gameId] as const,
  matches: (gameId?: string) => ["squad-dna", "matches", gameId] as const,
  analysis: (userIds: string[]) => ["squad-dna", "analysis", userIds] as const,
};

// API functions
async function fetchOwnProfiles(): Promise<SquadDNAProfile[]> {
  const response = await fetch("/api/squad-dna/profile");
  if (!response.ok) {
    throw new Error("Failed to fetch DNA profiles");
  }
  const data = await response.json();
  return data.profiles || [];
}

async function fetchProfileByUser(userId: string, gameId?: string): Promise<SquadDNAProfile | null> {
  const params = new URLSearchParams({ userId });
  if (gameId) params.set("gameId", gameId);

  const response = await fetch(`/api/squad-dna/profile?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch DNA profile");
  }
  const data = await response.json();
  return data.profile;
}

async function createDNAProfile(request: CreateDNAProfileRequest): Promise<SquadDNAProfile> {
  const response = await fetch("/api/squad-dna/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create DNA profile");
  }
  const data = await response.json();
  return data.profile;
}

async function updateDNAProfile(
  profileId: string,
  request: UpdateDNAProfileRequest
): Promise<SquadDNAProfile> {
  const response = await fetch(`/api/squad-dna/profile?id=${profileId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update DNA profile");
  }
  const data = await response.json();
  return data.profile;
}

async function deleteDNAProfile(profileId: string): Promise<void> {
  const response = await fetch(`/api/squad-dna/profile?id=${profileId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete DNA profile");
  }
}

async function findCompatiblePlayers(request: FindPlayersRequest): Promise<{
  matches: PlayerMatch[];
  total: number;
}> {
  const response = await fetch("/api/squad-dna/find-players", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to find players");
  }
  return response.json();
}

// Hooks

// Own DNA profiles hook
export function useOwnDNAProfiles() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DNA_KEYS.ownProfiles,
    queryFn: fetchOwnProfiles,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: createDNAProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DNA_KEYS.ownProfiles });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ profileId, ...request }: UpdateDNAProfileRequest & { profileId: string }) =>
      updateDNAProfile(profileId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DNA_KEYS.ownProfiles });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDNAProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DNA_KEYS.ownProfiles });
    },
  });

  // Get default (game-agnostic) profile
  const defaultProfile = query.data?.find((p) => !p.game_id);
  // Get game-specific profiles
  const gameProfiles = query.data?.filter((p) => p.game_id) || [];

  return {
    profiles: query.data || [],
    defaultProfile,
    gameProfiles,
    hasProfile: (query.data?.length || 0) > 0,
    isLoading: query.isLoading,
    error: query.error,

    createProfile: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateProfile: (profileId: string, request: UpdateDNAProfileRequest) =>
      updateMutation.mutateAsync({ profileId, ...request }),
    isUpdating: updateMutation.isPending,

    deleteProfile: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

// DNA profile by user hook
export function useDNAProfile(userId: string, gameId?: string) {
  return useQuery({
    queryKey: DNA_KEYS.profile(userId, gameId),
    queryFn: () => fetchProfileByUser(userId, gameId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// Find compatible players hook
export function useFindPlayers(request?: FindPlayersRequest) {
  return useQuery({
    queryKey: DNA_KEYS.matches(request?.gameId),
    queryFn: () => findCompatiblePlayers(request || {}),
    enabled: false, // Manual trigger
    staleTime: 1000 * 60 * 2,
  });
}

// Search players mutation (for manual trigger)
export function useSearchPlayers() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: findCompatiblePlayers,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(DNA_KEYS.matches(variables.gameId), data);
    },
  });

  return {
    searchPlayers: mutation.mutateAsync,
    isSearching: mutation.isPending,
    matches: mutation.data?.matches || [],
    total: mutation.data?.total || 0,
    error: mutation.error,
  };
}

// Calculate compatibility between two users (client-side)
export function useCompatibility(
  profile1: DNATraits | null,
  profile2: DNATraits | null,
  weights1?: DNAWeights,
  weights2?: DNAWeights
): CompatibilityResult | null {
  if (!profile1 || !profile2) return null;
  return calculateCompatibility(profile1, profile2, weights1, weights2);
}

// Analyze squad compatibility (client-side helper)
export function analyzeSquad(
  members: Array<{
    id: string;
    username: string;
    avatar_url?: string;
    traits: DNATraits;
    weights?: DNAWeights;
  }>
): SquadAnalysis {
  const recommendations: string[] = [];
  const missingTraits: string[] = [];

  // Check for role balance
  const allPlaystyles = members.flatMap((m) => m.traits.playstyle);
  const hasIGL = members.some((m) => m.traits.communication.includes("igl"));
  const hasSupportive = allPlaystyles.includes("supportive");
  const hasAggressive = allPlaystyles.includes("aggressive");

  if (!hasIGL) {
    recommendations.push("Consider having a designated IGL for better coordination");
    missingTraits.push("IGL");
  }

  if (!hasSupportive) {
    recommendations.push("Adding a supportive player could balance the team");
    missingTraits.push("Supportive playstyle");
  }

  // Calculate schedule overlap
  const schedules = members.map((m) => new Set(m.traits.schedule));
  const commonSchedule = [...schedules[0]].filter((s) =>
    schedules.every((set) => set.has(s))
  );
  const scheduleOverlap = Math.round((commonSchedule.length / schedules[0].size) * 100);

  if (scheduleOverlap < 50) {
    recommendations.push("Your team has limited schedule overlap - consider finding more compatible times");
  }

  // Calculate overall team compatibility
  let totalCompatibility = 0;
  let pairCount = 0;

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const compat = calculateCompatibility(
        members[i].traits,
        members[j].traits,
        members[i].weights,
        members[j].weights
      );
      totalCompatibility += compat.overallScore;
      pairCount++;
    }
  }

  const teamCompatibility = pairCount > 0 ? Math.round(totalCompatibility / pairCount) : 0;

  // Check competitiveness alignment
  const competitiveLevels = members.map((m) => m.traits.competitiveness);
  const hasProPlayer = competitiveLevels.some((c) => c.includes("pro") || c.includes("tournament"));
  const hasCasual = competitiveLevels.some((c) => c.includes("casual") || c.includes("for_fun"));

  if (hasProPlayer && hasCasual) {
    recommendations.push("Significant competitive level difference - discuss expectations");
  }

  // Check social vibe compatibility
  const socialVibes = members.flatMap((m) => m.traits.social);
  const hasPositiveOnly = socialVibes.includes("positive_only");
  const hasToxicOk = socialVibes.includes("toxic_ok");

  if (hasPositiveOnly && hasToxicOk) {
    recommendations.push("Mixed social preferences - establish communication guidelines");
  }

  return {
    squadId: members.map((m) => m.id).join("-"),
    members: members.map((m) => ({
      id: m.id,
      username: m.username,
      avatar_url: m.avatar_url,
      dna: m.traits,
    })),
    teamCompatibility,
    roleBalance: {
      hasIGL,
      hasSupportive,
      hasAggressive,
      scheduleOverlap,
    },
    recommendations,
    missingTraits,
  };
}
