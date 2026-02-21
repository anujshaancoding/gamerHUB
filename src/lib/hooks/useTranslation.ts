import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type {
  SupportedLanguage,
  Region,
  TranslateRequest,
  TranslateResponse,
  RegionalCommunityWithStats,
  LocalePreferences,
  UpdateLocalePreferencesRequest,
  SchedulingPreferenceInput,
} from "@/types/localization";
import { SUPPORTED_LANGUAGES, REGIONS } from "@/types/localization";

// Query keys
const LOCALE_KEYS = {
  preferences: ["locale", "preferences"] as const,
  regions: (includeStats?: boolean) => ["regions", { includeStats }] as const,
  communities: (regionCode: string, language?: string) =>
    ["regions", regionCode, "communities", { language }] as const,
  pricing: (region: string) => ["pricing", region] as const,
  scheduling: ["scheduling", "preferences"] as const,
};

// API functions
async function fetchLocalePreferences(): Promise<LocalePreferences | null> {
  const response = await fetch("/api/regions");
  if (!response.ok) {
    throw new Error("Failed to fetch locale preferences");
  }
  const data = await response.json();
  return data.userPreferences || null;
}

async function updateLocalePreferences(
  request: UpdateLocalePreferencesRequest
): Promise<LocalePreferences> {
  const response = await fetch("/api/regions", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update preferences");
  }
  const data = await response.json();
  return data.preferences;
}

async function translateText(request: TranslateRequest): Promise<TranslateResponse> {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to translate");
  }
  return response.json();
}

async function fetchRegionalCommunities(
  regionCode: string,
  language?: string
): Promise<{ communities: RegionalCommunityWithStats[]; total: number }> {
  const params = new URLSearchParams();
  if (language) params.set("language", language);

  const response = await fetch(
    `/api/regions/${regionCode}/communities?${params}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch communities");
  }
  return response.json();
}

async function joinCommunity(regionCode: string, communityId: string, language?: string) {
  const response = await fetch(
    `/api/regions/${regionCode}/communities?communityId=${communityId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to join community");
  }
  return response.json();
}

async function leaveCommunity(regionCode: string, communityId: string) {
  const response = await fetch(
    `/api/regions/${regionCode}/communities?communityId=${communityId}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to leave community");
  }
}

async function fetchRegionalPricing(region: string) {
  const response = await fetch(`/api/pricing/${region}`);
  if (!response.ok) {
    throw new Error("Failed to fetch pricing");
  }
  return response.json();
}

async function fetchSchedulingPreferences() {
  const response = await fetch("/api/scheduling");
  if (!response.ok) {
    throw new Error("Failed to fetch scheduling preferences");
  }
  const data = await response.json();
  return data.preferences;
}

async function updateSchedulingPreferences(request: SchedulingPreferenceInput) {
  const response = await fetch("/api/scheduling", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update scheduling preferences");
  }
  const data = await response.json();
  return data.preferences;
}

async function findCompatiblePlayers(params: {
  targetTime: string;
  gameId?: string;
  duration?: number;
}) {
  const response = await fetch("/api/scheduling", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to find players");
  }
  return response.json();
}

// Hooks

// Locale preferences hook
export function useLocalePreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: LOCALE_KEYS.preferences,
    queryFn: fetchLocalePreferences,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const updateMutation = useMutation({
    mutationFn: updateLocalePreferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData(LOCALE_KEYS.preferences, preferences);
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    error: query.error,

    updatePreferences: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    // Convenience getters
    language: (query.data?.language || "en") as SupportedLanguage,
    region: (query.data?.region || "delhi") as Region,
    timezone: query.data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    timeFormat: query.data?.timeFormat || "12h",
    dateFormat: query.data?.dateFormat || "mdy",
  };
}

// Translation hook
export function useTranslation() {
  const { language: userLanguage } = useLocalePreferences();
  const [translationCache] = useState(new Map<string, string>());

  const translateMutation = useMutation({
    mutationFn: translateText,
    onSuccess: (result) => {
      const cacheKey = `${result.originalText}:${result.targetLanguage}`;
      translationCache.set(cacheKey, result.translatedText);
    },
  });

  const translate = useCallback(
    async (
      text: string,
      targetLanguage?: SupportedLanguage,
      context?: "chat" | "post" | "guide" | "general"
    ) => {
      const target = targetLanguage || userLanguage;

      // Check cache first
      const cacheKey = `${text}:${target}`;
      if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey)!;
      }

      // Request translation
      const result = await translateMutation.mutateAsync({
        text,
        targetLanguage: target,
        context,
      });

      return result.translatedText;
    },
    [userLanguage, translateMutation, translationCache]
  );

  // Simple t() function for static translations
  const t = useCallback(
    (key: string, fallback?: string) => {
      // In a real app, this would look up translations from a translations file
      // For now, just return the key or fallback
      return fallback || key;
    },
    []
  );

  return {
    translate,
    isTranslating: translateMutation.isPending,
    error: translateMutation.error,
    t,
    userLanguage,
    languages: SUPPORTED_LANGUAGES,
  };
}

// Regional communities hook
export function useRegionalCommunities(regionCode: string, language?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: LOCALE_KEYS.communities(regionCode, language),
    queryFn: () => fetchRegionalCommunities(regionCode, language),
    enabled: !!regionCode,
    staleTime: 1000 * 60 * 5,
  });

  const joinMutation = useMutation({
    mutationFn: ({
      communityId,
      language,
    }: {
      communityId: string;
      language?: string;
    }) => joinCommunity(regionCode, communityId, language),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: LOCALE_KEYS.communities(regionCode, language),
      });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (communityId: string) => leaveCommunity(regionCode, communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: LOCALE_KEYS.communities(regionCode, language),
      });
    },
  });

  return {
    communities: query.data?.communities || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    error: query.error,

    joinCommunity: (communityId: string, language?: string) =>
      joinMutation.mutateAsync({ communityId, language }),
    isJoining: joinMutation.isPending,

    leaveCommunity: leaveMutation.mutateAsync,
    isLeaving: leaveMutation.isPending,
  };
}

// Regional pricing hook
export function useRegionalPricing(region?: string) {
  const { region: userRegion } = useLocalePreferences();
  const targetRegion = region || userRegion;

  return useQuery({
    queryKey: LOCALE_KEYS.pricing(targetRegion),
    queryFn: () => fetchRegionalPricing(targetRegion),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Scheduling preferences hook
export function useScheduling() {
  const queryClient = useQueryClient();

  const prefsQuery = useQuery({
    queryKey: LOCALE_KEYS.scheduling,
    queryFn: fetchSchedulingPreferences,
    staleTime: 1000 * 60 * 5,
  });

  const updateMutation = useMutation({
    mutationFn: updateSchedulingPreferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData(LOCALE_KEYS.scheduling, preferences);
    },
  });

  const findPlayersMutation = useMutation({
    mutationFn: findCompatiblePlayers,
  });

  return {
    preferences: prefsQuery.data,
    isLoading: prefsQuery.isLoading,
    error: prefsQuery.error,

    updatePreferences: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    findCompatiblePlayers: findPlayersMutation.mutateAsync,
    isFinding: findPlayersMutation.isPending,
    compatiblePlayers: findPlayersMutation.data?.compatibleUsers || [],
  };
}

// Regions list hook
export function useRegions(includeStats = false) {
  return useQuery({
    queryKey: LOCALE_KEYS.regions(includeStats),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (includeStats) params.set("stats", "true");

      const response = await fetch(`/api/regions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch regions");
      const data = await response.json();
      return data.regions;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
