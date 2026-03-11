"use client";

import { useQuery } from "@tanstack/react-query";

interface PublicSiteSettings {
  hide_news: boolean;
}

export const siteSettingsKeys = {
  all: ["site-settings"] as const,
};

/**
 * Client-side hook to read public site settings (feature flags).
 * Cached for 60s via React Query + HTTP cache headers.
 */
export function useSiteSettings() {
  const { data, isLoading } = useQuery({
    queryKey: siteSettingsKeys.all,
    queryFn: async (): Promise<PublicSiteSettings> => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch site settings");
      return res.json();
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  return {
    hideNews: data?.hide_news ?? true, // default to hidden until loaded
    isLoading,
  };
}
