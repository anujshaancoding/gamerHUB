import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreatorProfile,
  StreamerOverlay,
  CreatorClip,
  SponsorshipWithBrand,
  CreateCreatorProfileRequest,
  UpdateCreatorProfileRequest,
  CreateOverlayRequest,
  UpdateOverlayRequest,
  CreateClipRequest,
  ApplySponsorshipRequest,
  AnalyticsTimeRange,
  AnalyticsSummary,
  AnalyticsChartData,
  TopContent,
  AudienceInsight,
  SponsorshipCategory,
  CreatorTier,
} from "@/types/creator";
import { getCreatorTier } from "@/types/creator";

// Query keys
const CREATOR_KEYS = {
  profile: (userId?: string) => ["creator", "profile", userId] as const,
  profileByUrl: (url: string) => ["creator", "profile", "url", url] as const,
  overlays: ["creator", "overlays"] as const,
  analytics: (range: AnalyticsTimeRange) => ["creator", "analytics", range] as const,
  clips: (params?: { creatorId?: string; visibility?: string; gameId?: string }) =>
    ["creator", "clips", params] as const,
  sponsorships: (params?: { category?: SponsorshipCategory; page?: number }) =>
    ["sponsorships", params] as const,
  application: (sponsorshipId: string) => ["sponsorship", "application", sponsorshipId] as const,
};

// API functions
async function fetchCreatorProfile(userId?: string): Promise<CreatorProfile & { tier: CreatorTier } | null> {
  const url = userId
    ? `/api/creator/profile?userId=${userId}`
    : "/api/creator/profile";
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to fetch creator profile");
  }
  const data = await response.json();
  return data.profile;
}

async function fetchCreatorProfileByUrl(customUrl: string): Promise<CreatorProfile & { tier: CreatorTier }> {
  const response = await fetch(`/api/creator/profile?url=${customUrl}`);
  if (!response.ok) {
    throw new Error("Failed to fetch creator profile");
  }
  const data = await response.json();
  return data.profile;
}

async function createCreatorProfile(request: CreateCreatorProfileRequest): Promise<CreatorProfile> {
  const response = await fetch("/api/creator/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create creator profile");
  }
  const data = await response.json();
  return data.profile;
}

async function updateCreatorProfile(request: UpdateCreatorProfileRequest): Promise<CreatorProfile> {
  const response = await fetch("/api/creator/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update creator profile");
  }
  const data = await response.json();
  return data.profile;
}

// Overlays
async function fetchOverlays(): Promise<StreamerOverlay[]> {
  const response = await fetch("/api/creator/overlays");
  if (!response.ok) throw new Error("Failed to fetch overlays");
  const data = await response.json();
  return data.overlays;
}

async function createOverlay(request: CreateOverlayRequest): Promise<StreamerOverlay> {
  const response = await fetch("/api/creator/overlays", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create overlay");
  }
  const data = await response.json();
  return data.overlay;
}

async function updateOverlay(id: string, request: UpdateOverlayRequest): Promise<StreamerOverlay> {
  const response = await fetch(`/api/creator/overlays?id=${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update overlay");
  }
  const data = await response.json();
  return data.overlay;
}

async function deleteOverlay(id: string): Promise<void> {
  const response = await fetch(`/api/creator/overlays?id=${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete overlay");
  }
}

// Analytics
interface AnalyticsResponse {
  summary: AnalyticsSummary;
  chartData: AnalyticsChartData[];
  topContent: TopContent[];
  audienceInsights: AudienceInsight[];
  breakdown: {
    profileViews: number;
    clipViews: number;
    newFollowers: number;
  };
}

async function fetchAnalytics(range: AnalyticsTimeRange): Promise<AnalyticsResponse> {
  const response = await fetch(`/api/creator/analytics?range=${range}`);
  if (!response.ok) throw new Error("Failed to fetch analytics");
  return response.json();
}

// Clips
interface ClipsResponse {
  clips: CreatorClip[];
  total: number;
  page: number;
  totalPages: number;
}

async function fetchClips(params?: {
  creatorId?: string;
  visibility?: string;
  gameId?: string;
  page?: number;
  limit?: number;
}): Promise<ClipsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.creatorId) searchParams.set("creatorId", params.creatorId);
  if (params?.visibility) searchParams.set("visibility", params.visibility);
  if (params?.gameId) searchParams.set("gameId", params.gameId);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const response = await fetch(`/api/creator/clips?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch clips");
  return response.json();
}

async function createClip(request: CreateClipRequest): Promise<CreatorClip> {
  const response = await fetch("/api/creator/clips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create clip");
  }
  const data = await response.json();
  return data.clip;
}

async function updateClip(id: string, request: Partial<CreateClipRequest>): Promise<CreatorClip> {
  const response = await fetch(`/api/creator/clips?id=${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update clip");
  }
  const data = await response.json();
  return data.clip;
}

async function deleteClip(id: string): Promise<void> {
  const response = await fetch(`/api/creator/clips?id=${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete clip");
  }
}

// Sponsorships
interface SponsorshipsResponse {
  sponsorships: SponsorshipWithBrand[];
  total: number;
  page: number;
  totalPages: number;
  eligibility: {
    tier: CreatorTier;
    followerCount: number;
  };
}

async function fetchSponsorships(params?: {
  category?: SponsorshipCategory;
  page?: number;
  limit?: number;
}): Promise<SponsorshipsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const response = await fetch(`/api/sponsorships?${searchParams}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch sponsorships");
  }
  return response.json();
}

async function applyToSponsorship(
  sponsorshipId: string,
  request: ApplySponsorshipRequest
): Promise<unknown> {
  const response = await fetch(`/api/sponsorships/${sponsorshipId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to apply to sponsorship");
  }
  return response.json();
}

async function withdrawApplication(sponsorshipId: string): Promise<void> {
  const response = await fetch(`/api/sponsorships/${sponsorshipId}/apply`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to withdraw application");
  }
}

// Hooks

// Creator Profile
export function useCreatorProfile(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CREATOR_KEYS.profile(userId),
    queryFn: () => fetchCreatorProfile(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: createCreatorProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(CREATOR_KEYS.profile(undefined), profile);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCreatorProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(CREATOR_KEYS.profile(undefined), profile);
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,

    createProfile: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    tier: query.data ? getCreatorTier(query.data.follower_count || 0) : "bronze",
  };
}

export function useCreatorProfileByUrl(customUrl: string) {
  return useQuery({
    queryKey: CREATOR_KEYS.profileByUrl(customUrl),
    queryFn: () => fetchCreatorProfileByUrl(customUrl),
    enabled: !!customUrl,
    staleTime: 1000 * 60 * 5,
  });
}

// Overlays
export function useOverlays() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CREATOR_KEYS.overlays,
    queryFn: fetchOverlays,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: createOverlay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREATOR_KEYS.overlays });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...request }: UpdateOverlayRequest & { id: string }) =>
      updateOverlay(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREATOR_KEYS.overlays });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOverlay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREATOR_KEYS.overlays });
    },
  });

  return {
    overlays: query.data || [],
    isLoading: query.isLoading,
    error: query.error,

    createOverlay: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateOverlay: (id: string, request: UpdateOverlayRequest) =>
      updateMutation.mutateAsync({ id, ...request }),
    isUpdating: updateMutation.isPending,

    deleteOverlay: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

// Analytics
export function useCreatorAnalytics(range: AnalyticsTimeRange = "30d") {
  return useQuery({
    queryKey: CREATOR_KEYS.analytics(range),
    queryFn: () => fetchAnalytics(range),
    staleTime: 1000 * 60 * 5,
  });
}

// Clips
export function useCreatorClips(params?: {
  creatorId?: string;
  visibility?: string;
  gameId?: string;
  page?: number;
  limit?: number;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CREATOR_KEYS.clips(params),
    queryFn: () => fetchClips(params),
    staleTime: 1000 * 60 * 2,
  });

  const createMutation = useMutation({
    mutationFn: createClip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator", "clips"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...request }: Partial<CreateClipRequest> & { id: string }) =>
      updateClip(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator", "clips"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator", "clips"] });
    },
  });

  return {
    clips: query.data?.clips || [],
    total: query.data?.total || 0,
    page: query.data?.page || 1,
    totalPages: query.data?.totalPages || 1,
    isLoading: query.isLoading,
    error: query.error,

    createClip: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateClip: (id: string, request: Partial<CreateClipRequest>) =>
      updateMutation.mutateAsync({ id, ...request }),
    isUpdating: updateMutation.isPending,

    deleteClip: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

// Sponsorships
export function useSponsorships(params?: {
  category?: SponsorshipCategory;
  page?: number;
  limit?: number;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CREATOR_KEYS.sponsorships(params),
    queryFn: () => fetchSponsorships(params),
    staleTime: 1000 * 60 * 5,
  });

  const applyMutation = useMutation({
    mutationFn: ({
      sponsorshipId,
      request,
    }: {
      sponsorshipId: string;
      request: ApplySponsorshipRequest;
    }) => applyToSponsorship(sponsorshipId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: withdrawApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
    },
  });

  return {
    sponsorships: query.data?.sponsorships || [],
    total: query.data?.total || 0,
    page: query.data?.page || 1,
    totalPages: query.data?.totalPages || 1,
    eligibility: query.data?.eligibility,
    isLoading: query.isLoading,
    error: query.error,

    applyToSponsorship: (sponsorshipId: string, request: ApplySponsorshipRequest) =>
      applyMutation.mutateAsync({ sponsorshipId, request }),
    isApplying: applyMutation.isPending,

    withdrawApplication: withdrawMutation.mutateAsync,
    isWithdrawing: withdrawMutation.isPending,
  };
}

// Generate overlay URL
export function getOverlayUrl(token: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/api/creator/overlays/${token}`;
}
